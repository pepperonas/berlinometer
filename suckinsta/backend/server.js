const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5080;

// CORS configuration for mrx3k1.de
app.use(cors({
    origin: ['https://mrx3k1.de', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Instagram Video Downloader API is running',
        timestamp: new Date().toISOString()
    });
});

// Download endpoint
app.post('/api/download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ 
            error: 'URL is required',
            message: 'Please provide an Instagram video URL'
        });
    }

    // Validate Instagram URL
    const instagramRegex = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/;
    if (!instagramRegex.test(url)) {
        return res.status(400).json({ 
            error: 'Invalid Instagram URL',
            message: 'Please provide a valid Instagram video URL'
        });
    }

    const tempDir = '/tmp';
    const timestamp = Date.now();
    const outputTemplate = path.join(tempDir, `instagram_video_${timestamp}.%(ext)s`);
    
    // Check if cookie file exists
    const cookieFile = path.join(__dirname, 'instagram-cookies.txt');
    const hasCookies = fs.existsSync(cookieFile);

    // Function to try gallery-dl as fallback
    const tryGalleryDl = () => {
        console.log('Trying gallery-dl as fallback...');
        
        const galleryDlArgs = [
            '--dest', tempDir,
            '--filename', `instagram_video_${timestamp}.{extension}`,
            '--no-mtime',
            '--retries', '3'
        ];
        
        // Add cookies to gallery-dl if available
        if (hasCookies) {
            console.log('Using cookies with gallery-dl fallback');
            galleryDlArgs.push('--cookies', cookieFile);
        }
        
        galleryDlArgs.push(url);
        
        const galleryDl = spawn('gallery-dl', galleryDlArgs);

        let galleryStderr = '';
        let galleryStdout = '';

        galleryDl.stdout.on('data', (data) => {
            galleryStdout += data.toString();
        });

        galleryDl.stderr.on('data', (data) => {
            galleryStderr += data.toString();
        });

        galleryDl.on('close', (code) => {
            if (code !== 0) {
                console.error('gallery-dl also failed:', galleryStderr);
                return res.status(500).json({ 
                    error: 'Download failed',
                    message: 'Unable to download the video with any available method. This Instagram post may be private or require login access.',
                    details: 'Both yt-dlp and gallery-dl failed'
                });
            }

            // Find the downloaded file
            const files = fs.readdirSync(tempDir).filter(file => 
                file.startsWith(`instagram_video_${timestamp}`)
            );

            if (files.length === 0) {
                return res.status(500).json({ 
                    error: 'Download failed',
                    message: 'Video file not found after download'
                });
            }

            const downloadedFile = path.join(tempDir, files[0]);
            const fileName = `instagram_video_${timestamp}.mp4`;

            // Set headers for file download
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', 'video/mp4');

            // Stream the file to the client
            const fileStream = fs.createReadStream(downloadedFile);
            
            fileStream.on('error', (err) => {
                console.error('File stream error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ 
                        error: 'File transfer failed',
                        message: 'Error occurred while transferring the file'
                    });
                }
            });

            fileStream.on('end', () => {
                // Clean up: delete the temporary file
                try {
                    fs.unlinkSync(downloadedFile);
                    console.log(`Cleaned up temporary file: ${downloadedFile}`);
                } catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError);
                }
            });

            fileStream.pipe(res);
        });

        galleryDl.on('error', (error) => {
            console.error('gallery-dl spawn error:', error);
            res.status(500).json({ 
                error: 'System error',
                message: 'Unable to start fallback download process.'
            });
        });
    };

    if (hasCookies) {
        console.log('Using Instagram cookies for authenticated download');
    }
    
    try {
        // Build yt-dlp arguments
        const ytDlpArgs = [
            '--no-playlist',
            '--format', 'best[ext=mp4]/best',
            '--output', outputTemplate,
            '--no-check-certificate',
            '--ignore-errors',
            '--socket-timeout', '30',
            '--retries', '3',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--add-header', 'Accept-Language:en-US,en;q=0.9',
            '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            '--add-header', 'Accept-Encoding:gzip, deflate, br',
            '--add-header', 'DNT:1',
            '--add-header', 'Upgrade-Insecure-Requests:1'
        ];
        
        // Add cookie file if it exists
        if (hasCookies) {
            ytDlpArgs.push('--cookies', cookieFile);
        }
        
        ytDlpArgs.push(url);
        
        // Use yt-dlp to download the video
        const ytDlp = spawn('/usr/local/bin/yt-dlp-new', ytDlpArgs);

        let stderr = '';
        let stdout = '';

        ytDlp.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        ytDlp.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        ytDlp.on('close', (code) => {
            if (code !== 0) {
                console.error('yt-dlp failed, trying gallery-dl fallback...', stderr);
                
                // Try gallery-dl as fallback
                return tryGalleryDl();
            }

            // Find the downloaded file
            const files = fs.readdirSync(tempDir).filter(file => 
                file.startsWith(`instagram_video_${timestamp}`)
            );

            if (files.length === 0) {
                return res.status(500).json({ 
                    error: 'Download failed',
                    message: 'Video file not found after download'
                });
            }

            const downloadedFile = path.join(tempDir, files[0]);
            const fileName = `instagram_video_${timestamp}.mp4`;

            // Set headers for file download
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', 'video/mp4');

            // Stream the file to the client
            const fileStream = fs.createReadStream(downloadedFile);
            
            fileStream.on('error', (err) => {
                console.error('File stream error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ 
                        error: 'File transfer failed',
                        message: 'Error occurred while transferring the file'
                    });
                }
            });

            fileStream.on('end', () => {
                // Clean up: delete the temporary file
                try {
                    fs.unlinkSync(downloadedFile);
                    console.log(`Cleaned up temporary file: ${downloadedFile}`);
                } catch (cleanupError) {
                    console.error('Cleanup error:', cleanupError);
                }
            });

            fileStream.pipe(res);
        });

        ytDlp.on('error', (error) => {
            console.error('yt-dlp spawn error, trying gallery-dl fallback:', error);
            return tryGalleryDl();
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'An unexpected error occurred during download'
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Not found',
        message: 'API endpoint not found'
    });
});

app.listen(PORT, () => {
    console.log(`Instagram Video Downloader API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Download endpoint: POST http://localhost:${PORT}/api/download`);
});

module.exports = app;