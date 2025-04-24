const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const archiver = require('archiver');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = 5012;

// Middleware
app.use(cors({
    origin: 'http://localhost:3003',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');
const tempDir = path.join(__dirname, 'temp');

[uploadsDir, outputDir, tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Helper function to build enhanced prompts
function buildEnhancedPrompt(prompt, style, color) {
    // Entferne Leerzeichen und Zeilenumbrüche vom Anfang und Ende des Prompts
    prompt = prompt.trim();

    // Basis-Prompt für ein klares, professionelles Logo
    let enhancedPrompt = `Create a professional, minimalist logo of ${prompt}`;

    // Style-spezifische Anweisungen
    if (style === 'flat') {
        enhancedPrompt += ` using a clean, flat design with simple shapes and bold elements`;
    } else if (style === '3d') {
        enhancedPrompt += ` with subtle 3D effects, soft shadows, and depth`;
    } else if (style === 'outline') {
        enhancedPrompt += ` as a simple, elegant outline design with clean lines`;
    } else if (style === 'gradient') {
        enhancedPrompt += ` using smooth, modern color gradients`;
    } else if (style === 'pixel') {
        enhancedPrompt += ` in a clean pixel art style with clear shapes`;
    } else if (style === 'realistic') {
        enhancedPrompt += ` with realistic details but maintaining logo simplicity`;
    } else {
        enhancedPrompt += ` in ${style} style`;
    }

    // Farbvorgaben
    if (color) {
        enhancedPrompt += ` with ${color} as the primary colors`;
    }

    // Wichtige Anweisungen für ein gutes Logo
    enhancedPrompt += `. Important requirements: 
  1. Create a SINGLE focal element, not multiple icons or patterns 
  2. NO text or lettering whatsoever
  3. NO watermarks, signatures or banner elements
  4. Perfect for a company logo or app icon
  5. Clean transparent background
  6. Professional, memorable design
  7. Clear silhouette that works at small sizes`;

    return enhancedPrompt;
}

// Routes

/**
 * Generate an icon using OpenAI's DALL-E API
 */
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt, style, color, model = 'dall-e-3', aspectRatio = 'square' } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        console.log('Generation request received:', { prompt, style, color, model, aspectRatio });

        // Select size based on aspect ratio
        const size = aspectRatio === 'square' ? '1024x1024' :
            aspectRatio === 'landscape' ? '1792x1024' : '1024x1792';

        // WICHTIG: Hier wird der verbesserte Prompt generiert
        const enhancedPrompt = buildEnhancedPrompt(prompt, style, color);
        console.log('Enhanced prompt:', enhancedPrompt);

        // Validiere das Modell
        const validModels = ['dall-e-2', 'dall-e-3', 'gpt-image-1'];
        if (!validModels.includes(model)) {
            return res.status(400).json({
                message: 'Invalid model specified',
                error: `Model '${model}' is not valid. Valid models are: ${validModels.join(', ')}`
            });
        }

        // Prepare API request payload
        const apiPayload = {
            prompt: enhancedPrompt, // Verwende den verbesserten Prompt!
            model: model,
            n: 1,
            size: size,
            response_format: 'url',
        };

        // Add quality and style parameters for DALL-E 3
        if (model === 'dall-e-3') {
            apiPayload.quality = "hd";
            apiPayload.style = "natural";
        }

        console.log('Sending request to OpenAI API with enhanced prompt');

        // Call OpenAI API to generate image
        const response = await axios.post(
            'https://api.openai.com/v1/images/generations',
            apiPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            }
        );

        console.log('OpenAI API response received');

        // Get the image URL
        const imageUrl = response.data.data[0].url;
        console.log('Image URL received');

        // Download the image
        console.log('Downloading image...');
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const iconId = uuidv4();
        const imagePath = path.join(uploadsDir, `${iconId}.png`);

        // Save the image
        console.log('Saving image to:', imagePath);
        fs.writeFileSync(imagePath, Buffer.from(imageResponse.data));
        console.log('Image saved successfully');

        // Send the response with full URL
        const fullResponseUrl = `http://localhost:5012/api/images/${iconId}`;
        console.log('Sending response with URL:', fullResponseUrl);

        res.json({
            id: iconId,
            previewUrl: fullResponseUrl,
            prompt,
            style,
            color,
            model,
            aspectRatio
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
        const { iconId, formats } = req.body;

        if (!iconId) {
            return res.status(400).json({ message: 'Icon ID is required' });
        }

        console.log('Processing request received for icon:', iconId);
        console.log('Requested formats:', formats);

        const sourcePath = path.join(uploadsDir, `${iconId}.png`);
        console.log('Source path:', sourcePath);

        if (!fs.existsSync(sourcePath)) {
            console.error('Icon not found at path:', sourcePath);
            return res.status(404).json({ message: 'Icon not found' });
        }

        // Create a unique output directory for this icon
        const outputIconDir = path.join(outputDir, iconId);
        if (!fs.existsSync(outputIconDir)) {
            fs.mkdirSync(outputIconDir, { recursive: true });
        }

        console.log('Processing formats in directory:', outputIconDir);

        // Process each format in parallel
        await Promise.all(formats.map(format => processFormat(format, sourcePath, outputIconDir)));

        // Create a zip file
        const zipPath = path.join(tempDir, `${iconId}.zip`);
        console.log('Creating ZIP archive at:', zipPath);
        await createZipArchive(outputIconDir, zipPath);

        // Return the download URL with full path
        const downloadUrl = `http://localhost:5012/api/download/${iconId}`;
        console.log('Download URL:', downloadUrl);

        res.json({
            success: true,
            downloadUrl: downloadUrl,
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
    console.log(`Processing format: ${format} from ${sourcePath} to ${outputDir}`);
    const image = sharp(sourcePath);

    switch (format) {
        case 'ico':
            // Create ICO files in multiple sizes
            const icoSizes = [16, 32, 48];
            const icoDir = path.join(outputDir, 'ico');
            if (!fs.existsSync(icoDir)) {
                fs.mkdirSync(icoDir, { recursive: true });
            }

            for (const size of icoSizes) {
                const outPath = path.join(icoDir, `icon-${size}x${size}.ico`);
                console.log(`Creating ICO ${size}x${size} at: ${outPath}`);
                await image
                    .resize(size, size)
                    .toFile(outPath);
            }
            break;

        case 'png':
            // Create PNG files in multiple sizes
            const pngSizes = [16, 32, 48, 64, 128, 256, 512, 1024];
            const pngDir = path.join(outputDir, 'png');
            if (!fs.existsSync(pngDir)) {
                fs.mkdirSync(pngDir, { recursive: true });
            }

            for (const size of pngSizes) {
                const outPath = path.join(pngDir, `icon-${size}x${size}.png`);
                console.log(`Creating PNG ${size}x${size} at: ${outPath}`);
                await image
                    .resize(size, size)
                    .png()
                    .toFile(outPath);
            }
            break;

        case 'svg':
            // Create an SVG using potrace (simplified here)
            // In a real implementation, you'd use potrace or another tool to convert raster to vector
            const svgDir = path.join(outputDir, 'svg');
            if (!fs.existsSync(svgDir)) {
                fs.mkdirSync(svgDir, { recursive: true });
            }

            // This is a placeholder. In a real app, you'd use a proper PNG to SVG conversion.
            const pngPath = path.join(svgDir, 'icon.png');
            console.log(`Creating PNG for SVG at: ${pngPath}`);
            await image
                .resize(1024, 1024)
                .toFile(pngPath);

            // Write a placeholder SVG file
            const svgPath = path.join(svgDir, 'icon.svg');
            console.log(`Creating SVG at: ${svgPath}`);
            fs.writeFileSync(
                svgPath,
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
                fs.mkdirSync(webpDir, { recursive: true });
            }

            for (const size of webpSizes) {
                const outPath = path.join(webpDir, `icon-${size}x${size}.webp`);
                console.log(`Creating WebP ${size}x${size} at: ${outPath}`);
                await image
                    .resize(size, size)
                    .webp({ quality: 90 })
                    .toFile(outPath);
            }
            break;

        case 'favicon':
            // Create a favicon package
            const faviconDir = path.join(outputDir, 'favicon');
            if (!fs.existsSync(faviconDir)) {
                fs.mkdirSync(faviconDir, { recursive: true });
            }

            // Create favicon.ico (16x16, 32x32, 48x48)
            const faviconPath = path.join(faviconDir, 'favicon.ico');
            console.log(`Creating favicon.ico at: ${faviconPath}`);
            await image
                .resize(32, 32)
                .toFile(faviconPath);

            // Create apple-touch-icon.png (180x180)
            const appleTouchPath = path.join(faviconDir, 'apple-touch-icon.png');
            console.log(`Creating apple-touch-icon.png at: ${appleTouchPath}`);
            await image
                .resize(180, 180)
                .png()
                .toFile(appleTouchPath);

            // Create android-chrome icons
            const androidSmallPath = path.join(faviconDir, 'android-chrome-192x192.png');
            const androidLargePath = path.join(faviconDir, 'android-chrome-512x512.png');
            console.log(`Creating android chrome icons at: ${androidSmallPath} and ${androidLargePath}`);
            await image.resize(192, 192).png().toFile(androidSmallPath);
            await image.resize(512, 512).png().toFile(androidLargePath);

            // Create favicon-16x16.png and favicon-32x32.png
            const favicon16Path = path.join(faviconDir, 'favicon-16x16.png');
            const favicon32Path = path.join(faviconDir, 'favicon-32x32.png');
            console.log(`Creating favicon PNGs at: ${favicon16Path} and ${favicon32Path}`);
            await image.resize(16, 16).png().toFile(favicon16Path);
            await image.resize(32, 32).png().toFile(favicon32Path);

            // Create a site.webmanifest file
            const manifestPath = path.join(faviconDir, 'site.webmanifest');
            console.log(`Creating site.webmanifest at: ${manifestPath}`);
            fs.writeFileSync(
                manifestPath,
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

    console.log(`Finished processing format: ${format}`);
}

/**
 * Helper function to create a zip archive
 */
function createZipArchive(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
        console.log(`Creating ZIP archive from ${sourceDir} to ${outputPath}`);

        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        output.on('close', () => {
            console.log(`ZIP archive created successfully: ${outputPath}, size: ${archive.pointer()} bytes`);
            resolve();
        });

        archive.on('warning', (err) => {
            console.warn('Archive warning:', err);
            if (err.code === 'ENOENT') {
                // Log warning but don't abort
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

        // Check if source directory exists
        if (fs.existsSync(sourceDir)) {
            console.log(`Adding directory to archive: ${sourceDir}`);
            archive.directory(sourceDir, false);
        } else {
            console.error(`Source directory does not exist: ${sourceDir}`);
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
    console.log(`Image requested: ${imagePath}`);
    console.log(`File exists: ${fs.existsSync(imagePath)}`);

    if (fs.existsSync(imagePath)) {
        console.log('Sending file...');
        res.sendFile(imagePath);
    } else {
        console.log('File not found!');
        res.status(404).json({ message: 'Image not found' });
    }
});

/**
 * Download the zip file
 */
app.get('/api/download/:id', (req, res) => {
    const zipPath = path.join(tempDir, `${req.params.id}.zip`);
    console.log(`ZIP download requested: ${zipPath}`);
    console.log(`File exists: ${fs.existsSync(zipPath)}`);

    if (fs.existsSync(zipPath)) {
        console.log('Sending ZIP file for download...');
        res.download(zipPath, 'icon-package.zip');
    } else {
        console.log('ZIP file not found!');
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
    console.log(`Upload directory: ${uploadsDir}`);
    console.log(`Output directory: ${outputDir}`);
    console.log(`Temp directory: ${tempDir}`);
});