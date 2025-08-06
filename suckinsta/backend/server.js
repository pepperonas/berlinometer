const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 5080;

// API Keys for external access
const API_KEYS = new Set([
    'sk_live_51234567890abcdef1234567890abcdef',  // Production key
    'sk_test_abcdef1234567890abcdef1234567890',   // Test key
    'sk_mrx3k1_dev_1234567890abcdefghijklmnop'    // Development key
]);

// Rate limiting storage (in-memory for simplicity)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per API key
const FRONTEND_RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute for frontend

// CORS configuration - allow all origins for API access
app.use(cors({
    origin: true, // Allow all origins for API access
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Authentication Middleware
const authenticateAPI = (req, res, next) => {
    // Skip auth for health check and documentation
    if (req.path === '/api/health' || req.path === '/api/docs') {
        return next();
    }

    // Skip auth for requests from the frontend (same origin or allowed origins)
    const origin = req.headers.origin || req.headers.referer;
    const allowedFrontendOrigins = [
        'https://mrx3k1.de',
        'http://localhost:3000',
        'http://localhost:3001'
    ];
    
    if (origin) {
        const isFromFrontend = allowedFrontendOrigins.some(allowed => 
            origin.startsWith(allowed)
        );
        
        if (isFromFrontend) {
            // For frontend requests, use a default internal API key for rate limiting
            req.apiKey = 'internal_frontend_key';
            return next();
        }
    }

    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'API key is required. Include it in the X-API-Key header or Authorization header as Bearer token.',
            code: 'MISSING_API_KEY'
        });
    }

    if (!API_KEYS.has(apiKey)) {
        return res.status(401).json({
            error: 'Invalid API key',
            message: 'The provided API key is not valid.',
            code: 'INVALID_API_KEY'
        });
    }

    // Add API key to request for rate limiting
    req.apiKey = apiKey;
    next();
};

// Rate Limiting Middleware
const rateLimit = (req, res, next) => {
    const key = req.apiKey;
    const now = Date.now();
    
    // Determine the rate limit based on whether it's a frontend request
    const maxRequests = key === 'internal_frontend_key' 
        ? FRONTEND_RATE_LIMIT_MAX_REQUESTS 
        : RATE_LIMIT_MAX_REQUESTS;
    
    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }
    
    const limit = rateLimitStore.get(key);
    
    if (now > limit.resetTime) {
        // Reset the limit
        rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }
    
    if (limit.count >= maxRequests) {
        return res.status(429).json({
            error: 'Rate limit exceeded',
            message: `Too many requests. Limit is ${maxRequests} requests per minute.`,
            retryAfter: Math.ceil((limit.resetTime - now) / 1000),
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
    
    limit.count++;
    next();
};

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Suckinsta API',
        message: 'Instagram Video Downloader API is running',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: 'GET /api/health',
            docs: 'GET /api/docs',
            download: 'POST /api/download'
        }
    });
});

// API Documentation endpoint (public)
app.get('/api/docs', (req, res) => {
    res.json({
        name: 'Suckinsta API',
        version: '2.0.0',
        description: 'Instagram Video Downloader API with authentication',
        baseUrl: 'https://mrx3k1.de/api',
        authentication: {
            type: 'API Key',
            methods: [
                'Include X-API-Key header',
                'Include Authorization header with Bearer token'
            ],
            example: 'X-API-Key: sk_live_your_api_key_here'
        },
        rateLimit: {
            window: '1 minute',
            maxRequests: 10,
            policy: 'per API key'
        },
        endpoints: [
            {
                method: 'GET',
                path: '/api/health',
                description: 'Health check endpoint',
                authentication: 'None required',
                response: {
                    status: 'string',
                    message: 'string',
                    timestamp: 'ISO 8601 datetime'
                }
            },
            {
                method: 'GET',
                path: '/api/docs',
                description: 'API documentation',
                authentication: 'None required',
                response: 'API documentation object'
            },
            {
                method: 'POST',
                path: '/api/download',
                description: 'Download Instagram video',
                authentication: 'Required',
                requestBody: {
                    url: 'string (required) - Instagram video URL'
                },
                responses: {
                    200: 'Video file download',
                    400: 'Bad request - invalid URL',
                    401: 'Authentication error',
                    429: 'Rate limit exceeded',
                    500: 'Download failed'
                },
                example: {
                    request: {
                        url: 'https://www.instagram.com/p/ABC123/',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-API-Key': 'sk_live_your_api_key_here'
                        }
                    }
                }
            }
        ],
        errorCodes: {
            MISSING_API_KEY: 'API key not provided',
            INVALID_API_KEY: 'API key is not valid',
            RATE_LIMIT_EXCEEDED: 'Too many requests per minute'
        },
        examples: {
            curl: {
                download: `curl -X POST https://mrx3k1.de/api/download \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_live_your_api_key_here" \\
  -d '{"url": "https://www.instagram.com/p/ABC123/"}' \\
  --output video.mp4`
            },
            javascript: {
                download: `fetch('https://mrx3k1.de/api/download', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sk_live_your_api_key_here'
  },
  body: JSON.stringify({
    url: 'https://www.instagram.com/p/ABC123/'
  })
}).then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video.mp4';
    a.click();
  });`
            },
            python: {
                download: `import requests

response = requests.post('https://mrx3k1.de/api/download', 
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'sk_live_your_api_key_here'
    },
    json={'url': 'https://www.instagram.com/p/ABC123/'}
)

if response.status_code == 200:
    with open('video.mp4', 'wb') as f:
        f.write(response.content)
else:
    print('Error:', response.json())`
            }
        }
    });
});

// Download endpoint (requires authentication and rate limiting)
app.post('/api/download', authenticateAPI, rateLimit, async (req, res) => {
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
    console.log(`🚀 Suckinsta API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📖 API docs: http://localhost:${PORT}/api/docs`);
    console.log(`⬇️  Download endpoint: POST http://localhost:${PORT}/api/download (requires API key)`);
    console.log(`🔑 Available API keys: ${API_KEYS.size} configured`);
    console.log(`🛡️  Rate limit: ${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW/1000}s per API key`);
});

module.exports = app;