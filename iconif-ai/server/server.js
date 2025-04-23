const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const archiver = require('archiver');
const sharp = require('sharp');
const {v4: uuidv4} = require('uuid');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = 5012;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Set up file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({storage: storage});

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');
const tempDir = path.join(__dirname, 'temp');

[uploadsDir, outputDir, tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
});

// Routes

app.get('/api/images/:id', (req, res) => {
    const imagePath = path.join(uploadsDir, `${req.params.id}.png`);
    console.log('Requested image path:', imagePath);
    console.log('File exists:', fs.existsSync(imagePath));

    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).json({message: 'Image not found'});
    }
});

app.use(cors({
    origin: 'http://localhost:3003',
    credentials: true
}));

/**
 * Generate an icon using OpenAI's DALL-E API
 */
app.post('/api/generate', async (req, res) => {
    try {
        const {prompt, style, color} = req.body;

        if (!prompt) {
            return res.status(400).json({message: 'Prompt is required'});
        }

        // Construct a better prompt for the AI
        let enhancedPrompt = `Create a professional icon of ${prompt}`;
        if (style) {
            enhancedPrompt += ` in ${style} style`;
        }
        if (color) {
            enhancedPrompt += ` with ${color} colors`;
        }
        enhancedPrompt += `. The icon should be simple, clear, and centered on a transparent background.`;

        // Call OpenAI API to generate image
        const response = await axios.post(
            'https://api.openai.com/v1/images/generations',
            {
                prompt: enhancedPrompt,
                n: 1,
                size: '1024x1024',
                response_format: 'url',
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            }
        );

        // Get the image URL
        const imageUrl = response.data.data[0].url;

        // Download the image
        const imageResponse = await axios.get(imageUrl, {responseType: 'arraybuffer'});
        const iconId = uuidv4();
        const imagePath = path.join(uploadsDir, `${iconId}.png`);

        // Save the image
        fs.writeFileSync(imagePath, Buffer.from(imageResponse.data));

        // Send the response
        res.json({
            id: iconId,
            previewUrl: `/api/images/${iconId}`,
            prompt,
            style,
            color,
        });
    } catch (error) {
        console.error('Error generating icon:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Failed to generate icon',
            error: error.response?.data?.error?.message || error.message
        });
    }
});

/**
 * Process the icon into various formats
 */
app.post('/api/process', async (req, res) => {
    try {
        const {iconId, formats} = req.body;

        if (!iconId) {
            return res.status(400).json({message: 'Icon ID is required'});
        }

        const sourcePath = path.join(uploadsDir, `${iconId}.png`);

        if (!fs.existsSync(sourcePath)) {
            return res.status(404).json({message: 'Icon not found'});
        }

        // Create a unique output directory for this icon
        const outputIconDir = path.join(outputDir, iconId);
        if (!fs.existsSync(outputIconDir)) {
            fs.mkdirSync(outputIconDir, {recursive: true});
        }

        // Process each format in parallel
        await Promise.all(formats.map(format => processFormat(format, sourcePath, outputIconDir)));

        // Create a zip file
        const zipPath = path.join(tempDir, `${iconId}.zip`);
        await createZipArchive(outputIconDir, zipPath);

        // Return the download URL
        res.json({
            success: true,
            downloadUrl: `/api/download/${iconId}`,
        });
    } catch (error) {
        console.error('Error processing icon formats:', error);
        res.status(500).json({
            message: 'Failed to process icon formats',
            error: error.message
        });
    }
});

/**
 * Helper function to process each format
 */
async function processFormat(format, sourcePath, outputDir) {
    const image = sharp(sourcePath);

    switch (format) {
        case 'ico':
            // Create ICO files in multiple sizes
            const icoSizes = [16, 32, 48];
            const icoDir = path.join(outputDir, 'ico');
            if (!fs.existsSync(icoDir)) {
                fs.mkdirSync(icoDir, {recursive: true});
            }

            for (const size of icoSizes) {
                await image
                    .resize(size, size)
                    .toFile(path.join(icoDir, `icon-${size}x${size}.ico`));
            }
            break;

        case 'png':
            // Create PNG files in multiple sizes
            const pngSizes = [16, 32, 48, 64, 128, 256, 512, 1024];
            const pngDir = path.join(outputDir, 'png');
            if (!fs.existsSync(pngDir)) {
                fs.mkdirSync(pngDir, {recursive: true});
            }

            for (const size of pngSizes) {
                await image
                    .resize(size, size)
                    .png()
                    .toFile(path.join(pngDir, `icon-${size}x${size}.png`));
            }
            break;

        case 'svg':
            // Create an SVG using potrace (simplified here)
            // In a real implementation, you'd use potrace or another tool to convert raster to vector
            const svgDir = path.join(outputDir, 'svg');
            if (!fs.existsSync(svgDir)) {
                fs.mkdirSync(svgDir, {recursive: true});
            }

            // This is a placeholder. In a real app, you'd use a proper PNG to SVG conversion.
            await image
                .resize(1024, 1024)
                .toFile(path.join(svgDir, 'icon.png'));

            // Write a placeholder SVG file
            fs.writeFileSync(
                path.join(svgDir, 'icon.svg'),
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
          <image href="icon.png" width="1024" height="1024"/>
        </svg>`
            );
            break;

        case 'webp':
            // Create WebP files in multiple sizes
            const webpSizes = [16, 32, 48, 64, 128, 256, 512];
            const webpDir = path.join(outputDir, 'webp');
            if (!fs.existsSync(webpDir)) {
                fs.mkdirSync(webpDir, {recursive: true});
            }

            for (const size of webpSizes) {
                await image
                    .resize(size, size)
                    .webp({quality: 90})
                    .toFile(path.join(webpDir, `icon-${size}x${size}.webp`));
            }
            break;

        case 'favicon':
            // Create a favicon package
            const faviconDir = path.join(outputDir, 'favicon');
            if (!fs.existsSync(faviconDir)) {
                fs.mkdirSync(faviconDir, {recursive: true});
            }

            // Create favicon.ico (16x16, 32x32, 48x48)
            await image
                .resize(32, 32)
                .toFile(path.join(faviconDir, 'favicon.ico'));

            // Create apple-touch-icon.png (180x180)
            await image
                .resize(180, 180)
                .png()
                .toFile(path.join(faviconDir, 'apple-touch-icon.png'));

            // Create android-chrome icons
            await image.resize(192, 192).png().toFile(path.join(faviconDir, 'android-chrome-192x192.png'));
            await image.resize(512, 512).png().toFile(path.join(faviconDir, 'android-chrome-512x512.png'));

            // Create favicon-16x16.png and favicon-32x32.png
            await image.resize(16, 16).png().toFile(path.join(faviconDir, 'favicon-16x16.png'));
            await image.resize(32, 32).png().toFile(path.join(faviconDir, 'favicon-32x32.png'));

            // Create a site.webmanifest file
            fs.writeFileSync(
                path.join(faviconDir, 'site.webmanifest'),
                JSON.stringify({
                    name: '',
                    short_name: '',
                    icons: [
                        {
                            src: '/android-chrome-192x192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: '/android-chrome-512x512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        }
                    ],
                    theme_color: '#ffffff',
                    background_color: '#ffffff',
                    display: 'standalone'
                }, null, 2)
            );
            break;

        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}

/**
 * Helper function to create a zip archive
 */
function createZipArchive(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
        console.log('Creating ZIP archive from:', sourceDir);
        console.log('Saving to:', outputPath);

        // Stelle sicher, dass das Verzeichnis existiert
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        output.on('close', () => {
            console.log('ZIP archive created successfully:', outputPath);
            console.log('ZIP size:', archive.pointer() + ' bytes');
            resolve();
        });

        archive.on('warning', (err) => {
            console.warn('Archive warning:', err);
            if (err.code === 'ENOENT') {
                // Warnung loggen, aber nicht abbrechen
                console.warn('Warning during archiving:', err);
            } else {
                reject(err);
            }
        });

        archive.on('error', (err) => {
            console.error('Archive error:', err);
            reject(err);
        });

        archive.pipe(output);

        // Prüfe, ob das Quellverzeichnis existiert
        if (fs.existsSync(sourceDir)) {
            console.log('Adding directory to archive:', sourceDir);
            archive.directory(sourceDir, false);
        } else {
            console.error('Source directory does not exist:', sourceDir);
            reject(new Error(`Source directory does not exist: ${sourceDir}`));
            return;
        }

        archive.finalize();
    });
}

/**
 * Serve the generated image
 */
app.get('/api/images/:id', (req, res) => {
    const imagePath = path.join(uploadsDir, `${req.params.id}.png`);

    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).json({message: 'Image not found'});
    }
});

/**
 * Download the zip file
 */
// server/server.js - Verbessere die Download-Route
app.get('/api/download/:id', (req, res) => {
    const zipPath = path.join(tempDir, `${req.params.id}.zip`);

    console.log('Requested ZIP path:', zipPath);
    console.log('File exists:', fs.existsSync(zipPath));

    if (fs.existsSync(zipPath)) {
        // Absolute Pfade verwenden
        const absolutePath = path.resolve(zipPath);
        console.log('Sending ZIP file from:', absolutePath);
        res.download(absolutePath, 'icon-package.zip');
    } else {
        console.error('ZIP file not found at path:', zipPath);
        res.status(404).json({ message: 'Package not found' });
    }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
