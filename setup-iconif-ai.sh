#!/bin/bash

# Farben für die Konsolenausgabe
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funktion zum Anzeigen von Fortschritt
function print_step() {
  echo -e "${BLUE}==>${NC} $1"
}

function print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

function print_warning() {
  echo -e "${YELLOW}!${NC} $1"
}

function print_error() {
  echo -e "${RED}✗${NC} $1"
}

# Prüfen, ob notwendige Kommandos vorhanden sind
for cmd in node npm npx; do
  if ! command -v $cmd &> /dev/null; then
    print_error "$cmd ist nicht installiert. Bitte installieren Sie Node.js und npm."
    exit 1
  fi
done

# Projektnamen festlegen
PROJECT_NAME="iconif-ai"
echo -e "${BLUE}=======================${NC}"
echo -e "${BLUE}  iconif-ai Generator  ${NC}"
echo -e "${BLUE}=======================${NC}"

# Frage nach OpenAI API Key
echo ""
print_step "Bitte geben Sie Ihren OpenAI API Key ein (wird in .env gespeichert):"
read -p "> " OPENAI_API_KEY

if [ -z "$OPENAI_API_KEY" ]; then
  print_warning "Kein API Key eingegeben. Sie müssen später einen API Key in server/.env eintragen."
  OPENAI_API_KEY="your_openai_api_key_here"
fi

# Projektverzeichnis erstellen
print_step "Erstelle Projektverzeichnis $PROJECT_NAME..."
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Erstellen der Basisstruktur
print_step "Erstelle Verzeichnisstruktur..."
mkdir -p client/public client/src/components client/src/utils
mkdir -p server/output server/temp server/uploads

# SERVER-DATEIEN ERSTELLEN

# server/.env
print_step "Erstelle server/.env..."
cat > server/.env << EOL
OPENAI_API_KEY=$OPENAI_API_KEY
EOL

# server/package.json
print_step "Erstelle server/package.json..."
cat > server/package.json << EOL
{
  "name": "iconif-ai-server",
  "version": "1.0.0",
  "description": "Backend server for iconif-ai icon generator",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": [
    "icon",
    "generator",
    "ai",
    "openai"
  ],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "archiver": "^5.3.1",
    "axios": "^1.4.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.32.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
EOL

# server/server.js
print_step "Erstelle server/server.js..."
cat > server/server.js << 'EOL'
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
app.use(cors());
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

// Routes

/**
 * Generate an icon using OpenAI's DALL-E API
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, style, color } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
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
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
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
    const { iconId, formats } = req.body;
    
    if (!iconId) {
      return res.status(400).json({ message: 'Icon ID is required' });
    }

    const sourcePath = path.join(uploadsDir, `${iconId}.png`);
    
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ message: 'Icon not found' });
    }

    // Create a unique output directory for this icon
    const outputIconDir = path.join(outputDir, iconId);
    if (!fs.existsSync(outputIconDir)) {
      fs.mkdirSync(outputIconDir, { recursive: true });
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
        fs.mkdirSync(icoDir, { recursive: true });
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
        fs.mkdirSync(pngDir, { recursive: true });
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
        fs.mkdirSync(svgDir, { recursive: true });
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
        fs.mkdirSync(webpDir, { recursive: true });
      }
      
      for (const size of webpSizes) {
        await image
          .resize(size, size)
          .webp({ quality: 90 })
          .toFile(path.join(webpDir, `icon-${size}x${size}.webp`));
      }
      break;
      
    case 'favicon':
      // Create a favicon package
      const faviconDir = path.join(outputDir, 'favicon');
      if (!fs.existsSync(faviconDir)) {
        fs.mkdirSync(faviconDir, { recursive: true });
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
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    output.on('close', () => {
      resolve();
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    archive.directory(sourceDir, false);
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
    res.status(404).json({ message: 'Image not found' });
  }
});

/**
 * Download the zip file
 */
app.get('/api/download/:id', (req, res) => {
  const zipPath = path.join(tempDir, `${req.params.id}.zip`);
  
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'icon-package.zip');
  } else {
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
EOL

# CLIENT-DATEIEN ERSTELLEN

# client/package.json
print_step "Erstelle client/package.json..."
cat > client/package.json << EOL
{
  "name": "iconif-ai",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOL

# client/public/index.html
print_step "Erstelle client/public/index.html..."
cat > client/public/index.html << EOL
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#2B2E3B" />
    <meta
      name="description"
      content="iconif-ai: KI-gestützter Icon-Generator"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>iconif-ai | KI Icon Generator</title>
  </head>
  <body>
    <noscript>Sie müssen JavaScript aktivieren, um diese App zu verwenden.</noscript>
    <div id="root"></div>
  </body>
</html>
EOL

# client/public/manifest.json
print_step "Erstelle client/public/manifest.json..."
cat > client/public/manifest.json << EOL
{
  "short_name": "iconif-ai",
  "name": "iconif-ai: KI Icon Generator",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#2B2E3B",
  "background_color": "#252830"
}
EOL

# client/src/index.js
print_step "Erstelle client/src/index.js..."
cat > client/src/index.js << EOL
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOL

# client/src/index.css
print_step "Erstelle client/src/index.css..."
cat > client/src/index.css << EOL
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOL

# client/src/App.jsx
print_step "Erstelle client/src/App.jsx..."
cat > client/src/App.jsx << 'EOL'
import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import IconGenerator from './components/IconGenerator';
import IconPreview from './components/IconPreview';
import DownloadSection from './components/DownloadSection';
import LoadingIndicator from './components/LoadingIndicator';

function App() {
  const [generatedIcon, setGeneratedIcon] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleIconGenerated = (iconData) => {
    setGeneratedIcon(iconData);
    setDownloadUrl(null);
  };

  const handleProcessingStart = () => {
    setIsProcessing(true);
    setDownloadUrl(null);
  };

  const handleProcessingComplete = (downloadUrl) => {
    setIsProcessing(false);
    setDownloadUrl(downloadUrl);
  };

  const handleError = (message) => {
    setErrorMessage(message);
    setIsGenerating(false);
    setIsProcessing(false);
  };

  return (
    <div className="app">
      <Header />
      <main className="app-content">
        <div className="content-container">
          <div className="generator-section">
            <IconGenerator 
              onGenerationStart={() => setIsGenerating(true)}
              onGenerationComplete={handleIconGenerated}
              onProcessingStart={handleProcessingStart}
              onProcessingComplete={handleProcessingComplete}
              onError={handleError}
            />
            
            {errorMessage && (
              <div className="error-message">
                <p>{errorMessage}</p>
                <button onClick={() => setErrorMessage(null)}>Dismiss</button>
              </div>
            )}
          </div>

          <div className="preview-section">
            {isGenerating && (
              <div className="generating-overlay">
                <LoadingIndicator message="Generiere dein Icon..." />
              </div>
            )}
            
            {isProcessing && (
              <div className="processing-overlay">
                <LoadingIndicator message="Verarbeite Icon-Formate..." />
              </div>
            )}
            
            <IconPreview icon={generatedIcon} />
            
            {downloadUrl && (
              <DownloadSection downloadUrl={downloadUrl} />
            )}
          </div>
        </div>
      </main>
      <footer className="app-footer">
        <p>iconif-ai © {new Date().getFullYear()} | KI-Powered Icon Generator</p>
      </footer>
    </div>
  );
}

export default App;
EOL

# client/src/App.css
print_step "Erstelle client/src/App.css..."
cat > client/src/App.css << EOL
:root {
  /* Color Variables */
  --background-dark: #2B2E3B;
  --background-darker: #252830;
  --card-background: #343845;
  --accent-blue: #688db1;
  --accent-green: #9cb68f;
  --accent-red: #e16162;
  --text-primary: #d1d5db;
  --text-secondary: #9ca3af;
  
  /* Shadow Variables */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4);

  /* Spacing Variables */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;

  /* Border Radius Variables */
  --radius-sm: 0.25rem;
  --radius: 0.5rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--background-darker);
  color: var(--text-primary);
  min-height: 100vh;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--background-dark);
  padding: var(--spacing-4) var(--spacing-8);
  box-shadow: var(--shadow);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  color: var(--text-primary);
  font-size: 1.75rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.app-header h1 span {
  color: var(--accent-blue);
}

.app-content {
  flex: 1;
  padding: var(--spacing-8);
  display: flex;
  justify-content: center;
}

.content-container {
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-8);
}

.app-footer {
  padding: var(--spacing-4);
  text-align: center;
  background-color: var(--background-dark);
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Card Styles */
.card {
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
}

/* Button Styles */
.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius);
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-primary {
  background-color: var(--accent-blue);
  color: white;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-secondary {
  background-color: var(--accent-green);
  color: white;
}

.btn-secondary:hover {
  filter: brightness(1.1);
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--accent-blue);
  color: var(--accent-blue);
}

.btn-outline:hover {
  background-color: rgba(104, 141, 177, 0.1);
}

.btn-danger {
  background-color: var(--accent-red);
  color: white;
}

.btn-danger:hover {
  filter: brightness(1.1);
}

/* Form Styles */
.form-group {
  margin-bottom: var(--spacing-4);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-2);
  color: var(--text-primary);
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: var(--spacing-3);
  background-color: var(--background-dark);
  border: 1px solid var(--card-background);
  border-radius: var(--radius);
  color: var(--text-primary);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 2px rgba(104, 141, 177, 0.3);
}

/* Error Message */
.error-message {
  background-color: rgba(225, 97, 98, 0.2);
  border-left: 3px solid var(--accent-red);
  padding: var(--spacing-4);
  margin: var(--spacing-4) 0;
  border-radius: var(--radius);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message p {
  color: var(--text-primary);
}

/* Progress Bar */
.progress-container {
  width: 100%;
  height: 8px;
  background-color: var(--background-dark);
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin: var(--spacing-4) 0;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-blue), var(--accent-green));
  border-radius: var(--radius-xl);
  transition: width 0.3s ease;
}

.progress-bar.error {
  background: linear-gradient(90deg, var(--accent-red), #ff8c8c);
}

/* Generator Section */
.generator-section {
  display: flex;
  flex-direction: column;
}

/* Preview Section */
.preview-section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.generating-overlay, .processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(37, 40, 48, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: var(--radius-lg);
  z-index: 10;
}

/* Loading indicator */
.spinner {
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 3px solid rgba(104, 141, 177, 0.3);
  border-radius: 50%;
  border-top-color: var(--accent-blue);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
}

.loading-indicator p {
  color: var(--text-primary);
  font-size: 1rem;
}

/* Checkbox styles */
.format-checkboxes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-blue);
}

/* Empty preview */
.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  padding: var(--spacing-8) 0;
  color: var(--text-secondary);
}

/* Icon preview */
.preview-container {
  display: flex;
  justify-content: center;
  margin: var(--spacing-4) 0;
}

.icon-preview {
  max-width: 100%;
  max-height: 300px;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.preview-info {
  margin-top: var(--spacing-4);
}

.preview-meta {
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-2);
}

.preview-prompt {
  color: var(--text-primary);
  font-style: italic;
}

/* Download card */
.download-card {
  margin-top: var(--spacing-4);
}

.format-info {
  margin: var(--spacing-4) 0;
}

.format-info ul {
  margin-top: var(--spacing-2);
  padding-left: var(--spacing-4);
  color: var(--text-secondary);
}

.download-btn {
  display: inline-block;
  margin: var(--spacing-4) 0;
  padding: var(--spacing-3) var(--spacing-6);
  text-decoration: none;
  text-align: center;
}

.download-note {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Responsive design */
@media (max-width: 768px) {
  .content-container {
    grid-template-columns: 1fr;
  }
  
  .app-content {
    padding: var(--spacing-4);
  }
  
  .format-checkboxes {
    grid-template-columns: 1fr;
  }
}
EOL

# Component-Dateien
print_step "Erstelle React-Komponenten..."

# Header.jsx
cat > client/src/components/Header.jsx << 'EOL'
import React from 'react';

function Header() {
  return (
    <header className="app-header">
      <h1>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#688db1" />
          <path d="M7 12H17M12 7V17" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        iconif<span>-ai</span>
      </h1>
      <div className="header-actions">
        <button className="btn btn-outline">Info</button>
      </div>
    </header>
  );
}

export default Header;
EOL

# IconGenerator.jsx
cat > client/src/components/IconGenerator.jsx << 'EOL'
import React, { useState } from 'react';
import { generateIcon, processIconFormats } from '../utils/api';

function IconGenerator({ onGenerationStart, onGenerationComplete, onProcessingStart, onProcessingComplete, onError }) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('flat');
  const [color, setColor] = useState('');
  const [includeFormats, setIncludeFormats] = useState({
    ico: true,
    png: true,
    svg: true,
    webp: true,
    favicon: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      onError('Bitte gib eine Beschreibung für dein Icon ein');
      return;
    }
    
    try {
      onGenerationStart();
      
      const iconData = await generateIcon({
        prompt,
        style,
        color,
      });
      
      onGenerationComplete(iconData);
      
      if (iconData) {
        onProcessingStart();
        
        const downloadData = await processIconFormats({
          iconId: iconData.id,
          formats: Object.keys(includeFormats).filter(key => includeFormats[key]),
        });
        
        onProcessingComplete(downloadData.downloadUrl);
      }
    } catch (error) {
      onError(error.message || 'Icon konnte nicht generiert werden');
    }
  };

  const handleFormatChange = (format) => {
    setIncludeFormats({
      ...includeFormats,
      [format]: !includeFormats[format],
    });
  };

  return (
    <div className="card">
      <h2>Icon generieren</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="prompt" className="form-label">Beschreibung</label>
          <textarea
            id="prompt"
            className="form-control"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Beschreibe dein Icon (z.B. 'Ein minimalistisches Berg-Logo')"
            rows={4}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="style" className="form-label">Stil</label>
          <select
            id="style"
            className="form-control"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            <option value="flat">Flat</option>
            <option value="3d">3D</option>
            <option value="outline">Outline</option>
            <option value="gradient">Gradient</option>
            <option value="pixel">Pixel Art</option>
            <option value="realistic">Realistisch</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="color" className="form-label">Farbschema (optional)</label>
          <input
            type="text"
            id="color"
            className="form-control"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="z.B. blau, rot und weiß, pastellfarben"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Ausgabeformate</label>
          <div className="format-checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeFormats.ico}
                onChange={() => handleFormatChange('ico')}
              />
              .ICO (Windows)
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeFormats.png}
                onChange={() => handleFormatChange('png')}
              />
              .PNG (Transparent)
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeFormats.svg}
                onChange={() => handleFormatChange('svg')}
              />
              .SVG (Vektor)
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeFormats.webp}
                onChange={() => handleFormatChange('webp')}
              />
              .WEBP (Web-optimiert)
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeFormats.favicon}
                onChange={() => handleFormatChange('favicon')}
              />
              Favicon-Paket
            </label>
          </div>
        </div>
        
        <button type="submit" className="btn btn-primary">Icon generieren</button>
      </form>
    </div>
  );
}

export default IconGenerator;
EOL

# IconPreview.jsx
cat > client/src/components/IconPreview.jsx << 'EOL'
import React from 'react';

function IconPreview({ icon }) {
  if (!icon) {
    return (
      <div className="card preview-card">
        <div className="empty-preview">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#343845" />
            <path d="M7 12H17M12 7V17" stroke="#688db1" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <p>Deine Icon-Vorschau wird hier angezeigt</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card preview-card">
      <h2>Icon-Vorschau</h2>
      <div className="preview-container">
        <img src={icon.previewUrl} alt="Generiertes Icon" className="icon-preview" />
      </div>
      
      <div className="preview-info">
        <div className="preview-meta">
          <span>Stil: {icon.style}</span>
          {icon.color && <span>Farbe: {icon.color}</span>}
        </div>
        <p className="preview-prompt">"{icon.prompt}"</p>
      </div>
    </div>
  );
}

export default IconPreview;
EOL

# DownloadSection.jsx
cat > client/src/components/DownloadSection.jsx << 'EOL'
import React from 'react';

function DownloadSection({ downloadUrl }) {
  return (
    <div className="card download-card">
      <h2>Dein Icon-Paket</h2>
      <p>Dein Icon wurde verarbeitet und ist in allen gewünschten Formaten zum Download bereit.</p>
      
      <div className="format-info">
        <p>Paket enthält verschiedene Größen für Web- und App-Nutzung:</p>
        <ul>
          <li>16x16, 32x32, 48x48, 64x64, 128x128, 256x256 Pixel</li>
          <li>App-Icons für iOS und Android</li>
          <li>Favicon-Paket für Webseiten</li>
        </ul>
      </div>
      
      <a 
        href={downloadUrl} 
        download 
        className="btn btn-primary download-btn"
      >
        Icon-Paket herunterladen (.zip)
      </a>
      
      <p className="download-note">Alle Dateien sind optimiert und bereit für den Einsatz in deinen Projekten.</p>
    </div>
  );
}

export default DownloadSection;
EOL

# LoadingIndicator.jsx
cat > client/src/components/LoadingIndicator.jsx << 'EOL'
import React from 'react';

function LoadingIndicator({ message }) {
  return (
    <div className="loading-indicator">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}

export default LoadingIndicator;
EOL

# API utilities
print_step "Erstelle API-Utilities..."
mkdir -p client/src/utils

cat > client/src/utils/api.js << 'EOL'
// utils/api.js
const API_BASE_URL = 'http://localhost:5012/api';

/**
 * Generate an icon using the ChatGPT/OpenAI API
 * @param {Object} options - Generation options
 * @param {string} options.prompt - Text description of the icon
 * @param {string} options.style - Style of the icon (flat, 3d, outline, etc.)
 * @param {string} options.color - Optional color theme
 * @returns {Promise<Object>} Icon data including preview URL
 */
export const generateIcon = async (options) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate icon');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating icon:', error);
    throw error;
  }
};

/**
 * Process the generated icon into various formats
 * @param {Object} options - Processing options
 * @param {string} options.iconId - ID of the generated icon
 * @param {Array<string>} options.formats - Array of formats to generate
 * @returns {Promise<Object>} Data including download URL
 */
export const processIconFormats = async (options) => {
  try {
    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to process icon formats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing icon formats:', error);
    throw error;
  }
};
EOL

# README.md erstellen
print_step "Erstelle README.md..."
cat > README.md << 'EOL'
# iconif-ai: KI-gestützter Icon-Generator

Eine Full-Stack-Webanwendung, die KI verwendet, um benutzerdefinierte Icons zu generieren und in verschiedene Formate zu konvertieren.

## Funktionen

- Generierung von Icons basierend auf Textbeschreibungen
- Auswahl von verschiedenen Stilen und Farbschemata
- Konvertierung in gängige Formate (ICO, PNG, SVG, WEBP)
- Erstellung von Favicon-Paketen für Webseiten
- Download aller Formate als ZIP-Archiv

## Technologie-Stack

- **Frontend:** React.js
- **Backend:** Node.js mit Express
- **KI-Integration:** OpenAI API (DALL-E)
- **Bildverarbeitung:** Sharp.js
- **Archivierung:** Archiver

## Installation

### Voraussetzungen
- Node.js v16+ und npm
- OpenAI API-Schlüssel

### Einrichtung

1. Repository klonen
2. Backend-Abhängigkeiten installieren:
   ```
   cd server
   npm install
   ```
3. Frontend-Abhängigkeiten installieren:
   ```
   cd client
   npm install
   ```
4. OpenAI API-Schlüssel in `server/.env` eintragen
5. Backend starten:
   ```
   cd server
   npm start
   ```
6. Frontend starten:
   ```
   cd client
   npm start
   ```
7. Anwendung unter http://localhost:3003 aufrufen

## API-Endpunkte

- `POST /api/generate`: Generiert ein Icon mit der OpenAI API
- `POST /api/process`: Verarbeitet das Icon in verschiedene Formate
- `GET /api/images/:id`: Liefert das generierte Bild
- `GET /api/download/:id`: Liefert das ZIP-Archiv mit allen Formaten

## Lizenz

MIT
EOL

# Docker-Dateien erstellen
print_step "Erstelle Docker-Dateien..."

# client/Dockerfile
cat > client/Dockerfile << 'EOL'
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV PORT=3003
EXPOSE 3003
CMD ["npm", "start"]
EOL

# server/Dockerfile
cat > server/Dockerfile << 'EOL'
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5012
CMD ["node", "server.js"]
EOL

# docker-compose.yml
cat > docker-compose.yml << 'EOL'
version: '3'
services:
  frontend:
    build: ./client
    ports:
      - "3003:3003"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://backend:5012
  
  backend:
    build: ./server
    ports:
      - "5012:5012"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./server/uploads:/app/uploads
      - ./server/output:/app/output
      - ./server/temp:/app/temp
EOL

# Installation abschließen
print_step "Installiere Abhängigkeiten für das Backend..."
cd server
npm install

print_step "Installiere Abhängigkeiten für das Frontend..."
cd ../client
npm install

cd ..

# Fertigstellen
print_success "Die Projektstruktur für iconif-ai wurde erfolgreich erstellt!"
print_success "Verwende folgende Befehle, um die Anwendung zu starten:"
echo ""
echo "  # Backend starten:"
echo "  cd $PROJECT_NAME/server"
echo "  npm start"
echo ""
echo "  # Frontend starten:"
echo "  cd $PROJECT_NAME/client"
echo "  PORT=3003 npm start"
echo ""
print_warning "Vergiss nicht, deinen OpenAI API-Key in server/.env einzutragen."
print_success "Die Anwendung wird unter http://localhost:3003 verfügbar sein."
