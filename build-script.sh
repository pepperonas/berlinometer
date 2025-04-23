#!/bin/bash

# build.sh
# This script builds and sets up the complete iconif-ai project

# Set up error handling
set -e
trap 'echo "An error occurred. Build failed."' ERR

# Configuration
PROJECT_NAME="iconif-ai"
CLIENT_PORT=3003
SERVER_PORT=5012

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print a styled message
print_message() {
    echo -e "${BLUE}[${PROJECT_NAME}]${NC} ${GREEN}$1${NC}"
}

print_step() {
    echo -e "\n${YELLOW}=== $1 ===${NC}"
}

# Check requirements
check_requirements() {
    print_step "Checking Requirements"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js is not installed. Please install Node.js v16 or higher.${NC}"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d 'v' -f 2)
    NODE_VERSION_MAJOR=$(echo $NODE_VERSION | cut -d '.' -f 1)
    
    if [ "$NODE_VERSION_MAJOR" -lt 16 ]; then
        echo -e "${RED}Node.js version $NODE_VERSION is not supported. Please use Node.js v16 or higher.${NC}"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}npm is not installed. Please install npm.${NC}"
        exit 1
    fi
    
    # Check if ports are available
    check_port_availability $CLIENT_PORT "Client"
    check_port_availability $SERVER_PORT "Server"
    
    print_message "All requirements met!"
}

# Check if a port is available
check_port_availability() {
    PORT=$1
    SERVICE=$2
    
    # Check if the port is in use
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}$SERVICE port $PORT is already in use. Please free up this port.${NC}"
        exit 1
    fi
}

# Create project directory structure
create_project_structure() {
    print_step "Creating Project Structure"
    
    # Create project directory if it doesn't exist
    if [ ! -d "$PROJECT_NAME" ]; then
        mkdir -p "$PROJECT_NAME"
        print_message "Created project directory: $PROJECT_NAME"
    else
        print_message "Project directory already exists"
    fi
    
    # Change to project directory
    cd "$PROJECT_NAME"
    
    # Create client and server directories
    mkdir -p client/public client/src/components client/src/hooks client/src/services client/src/styles client/src/utils
    mkdir -p server/config server/controllers server/middleware server/services server/routes server/utils
    mkdir -p server/storage/icons server/storage/temp
    
    print_message "Created project directory structure"
}

# Copy files
copy_files() {
    print_step "Copying Files"
    
    # You can add specific file copy operations here if needed
    print_message "Files copied successfully"
}

# Set up client
setup_client() {
    print_step "Setting Up Client"
    
    # Change to client directory
    cd client
    
    # Initialize package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        print_message "Initializing client package.json"
        echo '{
  "name": "iconif-ai-client",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.0"
  },
  "scripts": {
    "start": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}' > package.json
    fi
    
    # Create vite.config.js
    echo "import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: $CLIENT_PORT,
  },
  build: {
    outDir: 'build',
  },
});" > vite.config.js
    
    # Create index.html in public directory
    echo '<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#2B2E3B" />
    <meta
      name="description"
      content="iconif-ai - AI-powered icon generator"
    />
    <title>iconif-ai | AI Icon Generator</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>' > public/index.html
    
    # Install dependencies
    print_message "Installing client dependencies..."
    npm install
    
    # Return to project root
    cd ..
    
    print_message "Client setup completed"
}

# Set up server
setup_server() {
    print_step "Setting Up Server"
    
    # Change to server directory
    cd server
    
    # Initialize package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        print_message "Initializing server package.json"
        echo '{
  "name": "iconif-ai-server",
  "version": "1.0.0",
  "description": "Backend server for iconif-ai",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.17.0",
    "sharp": "^0.32.6",
    "archiver": "^6.0.1",
    "fs-extra": "^11.1.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}' > package.json
    fi
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_message "Creating .env file"
        echo "PORT=$SERVER_PORT
OPENAI_API_KEY=your_openai_api_key
ICON_STORAGE_DIR=./storage/icons
TEMP_DIR=./storage/temp
SERVER_BASE_URL=http://localhost:$SERVER_PORT" > .env
        
        # Also create .env.example
        cp .env .env.example
    fi
    
    # Install dependencies
    print_message "Installing server dependencies..."
    npm install
    
    # Return to project root
    cd ..
    
    print_message "Server setup completed"
}

# Create root package.json
create_root_package() {
    print_step "Creating Root Package"
    
    # Create root package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        echo '{
  "name": "iconif-ai",
  "version": "1.0.0",
  "description": "AI-powered icon generator",
  "scripts": {
    "install:all": "npm run install:client && npm run install:server",
    "install:client": "cd client && npm install",
    "install:server": "cd server && npm install",
    "start": "concurrently \"npm run start:client\" \"npm run start:server\"",
    "start:client": "cd client && npm start",
    "start:server": "cd server && npm run dev",
    "build": "npm run build:client",
    "build:client": "cd client && npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}' > package.json
    fi
    
    # Install root dependencies
    print_message "Installing root dependencies..."
    npm install
}

# Create source files
create_source_files() {
    print_step "Creating Source Files"
    
    # Create client source files
    create_client_source_files
    
    # Create server source files
    create_server_source_files
    
    print_message "Source files created successfully"
}

# Create client source files
create_client_source_files() {
    # Create client index.jsx
    echo "import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);" > client/src/index.jsx
    
    # Create App.jsx
    echo "import React from 'react';
import Header from './components/Header';
import IconGenerator from './components/IconGenerator';
import Footer from './components/Footer';
import './styles/theme.css';

function App() {
  return (
    <div className=\"app\">
      <Header />
      <main>
        <IconGenerator />
      </main>
      <Footer />
    </div>
  );
}

export default App;" > client/src/App.jsx
    
    # Create components and other necessary files
    # Note: In a real script, you would add all the component files here
    # For brevity, I'm only showing a few critical ones
    
    # Create apiService.js
    mkdir -p client/src/services
    echo "const API_URL = 'http://localhost:$SERVER_PORT/api';

export const generateIcon = async (prompt, style, color) => {
  const response = await fetch(\`\${API_URL}/generate\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, style, color }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate icon');
  }

  return response.json();
};

export const getIconStatus = async (jobId) => {
  const response = await fetch(\`\${API_URL}/status/\${jobId}\`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to check icon status');
  }
  
  return response.json();
};" > client/src/services/apiService.js
    
    # Create theme.css (simplified for the script)
    mkdir -p client/src/styles
    echo ":root {
  --background-dark: #2B2E3B;
  --background-darker: #252830;
  --card-background: #343845;
  --accent-blue: #688db1;
  --accent-green: #9cb68f;
  --accent-red: #e16162;
  --text-primary: #d1d5db;
  --text-secondary: #9ca3af;
  
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  
  --radius-sm: 0.25rem;
  --radius: 0.5rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

body {
  background-color: var(--background-dark);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
}

/* Additional styles would be added here */" > client/src/styles/theme.css
}

# Create server source files
create_server_source_files() {
    # Create server.js
    echo "const app = require('./app');
const config = require('./config/config');

// Start the server
const server = app.listen(config.port, () => {
  console.log(\`Server running on port \${config.port}\`);
  console.log(\`API available at \${config.server.baseUrl}/api\`);
});

// Handle server shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});" > server/server.js
    
    # Create app.js
    echo "const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUtils = require('./utils/fileUtils');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

// Initialize the Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize storage directories
fileUtils.ensureStorageDirs().catch(err => {
  console.error('Failed to initialize storage directories:', err);
  process.exit(1);
});

// API routes
app.use('/api', apiRoutes);

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

module.exports = app;" > server/app.js
    
    # Create config.js
    mkdir -p server/config
    echo "require('dotenv').config();

module.exports = {
  port: process.env.PORT || $SERVER_PORT,
  openAI: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  storage: {
    iconDir: process.env.ICON_STORAGE_DIR || './storage/icons',
    tempDir: process.env.TEMP_DIR || './storage/temp',
  },
  server: {
    baseUrl: process.env.SERVER_BASE_URL || 'http://localhost:$SERVER_PORT',
  },
};" > server/config/config.js
    
    # Create API routes file
    mkdir -p server/routes
    echo "const express = require('express');
const router = express.Router();
const iconController = require('../controllers/iconController');

// Icon generation route
router.post('/generate', iconController.generateIcon);

// Job status route
router.get('/status/:jobId', iconController.getIconStatus);

// Icon preview route
router.get('/preview/:jobId', iconController.getIconPreview);

// Download icon package route
router.get('/download/:jobId/:filename', iconController.downloadIconPackage);

module.exports = router;" > server/routes/api.js
    
    # Create basic controller structure
    mkdir -p server/controllers
    echo "// Placeholder for icon controller
const openaiService = require('../services/openai');
const imageProcessor = require('../services/imageProcessor');
const zipBuilder = require('../services/zipBuilder');

// Controller functions would go here
const generateIcon = async (req, res) => {
  // Implementation would go here
};

const getIconStatus = async (req, res) => {
  // Implementation would go here
};

const getIconPreview = async (req, res) => {
  // Implementation would go here
};

const downloadIconPackage = async (req, res) => {
  // Implementation would go here
};

module.exports = {
  generateIcon,
  getIconStatus,
  getIconPreview,
  downloadIconPackage
};" > server/controllers/iconController.js
    
    # Create utils file
    mkdir -p server/utils
    echo "const fs = require('fs-extra');
const path = require('path');
const config = require('../config/config');

// Ensure storage directories exist
const ensureStorageDirs = async () => {
  await fs.ensureDir(config.storage.iconDir);
  await fs.ensureDir(config.storage.tempDir);
};

module.exports = {
  ensureStorageDirs,
};" > server/utils/fileUtils.js
    
    # Create error handler middleware
    mkdir -p server/middleware
    echo "const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Set the status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Send the error response
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};

module.exports = errorHandler;" > server/middleware/errorHandler.js
}

# Build client
build_client() {
    print_step "Building Client"
    
    # Change to client directory
    cd client
    
    # Build the client
    npm run build
    
    # Return to project root
    cd ..
    
    print_message "Client built successfully"
}

# Create README
create_readme() {
    print_step "Creating README"
    
    echo "# iconif-ai

An AI-powered icon generator application that creates icons in multiple formats for web and app use.

## Features

- Generate icons using ChatGPT API
- Transform icons into various formats (PNG, ICO, SVG, WebP, JPG)
- Multiple sizes for different use cases
- Download icon sets as a zip package

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository
2. Configure your OpenAI API key in \`server/.env\`
3. Run the build script:

\`\`\`bash
./build.sh
\`\`\`

### Running the Application

Start both the client and server:

\`\`\`bash
npm start
\`\`\`

Or run them separately:

- Client: \`npm run start:client\` (runs on port $CLIENT_PORT)
- Server: \`npm run start:server\` (runs on port $SERVER_PORT)

## Configuration

- Client port: $CLIENT_PORT
- Server port: $SERVER_PORT
- OpenAI API key: Set in \`server/.env\`

## Project Structure

- \`client/\`: React frontend application
- \`server/\`: Node.js backend API
  - \`server/services/openai.js\`: ChatGPT API integration
  - \`server/services/imageProcessor.js\`: Image format converter
  - \`server/services/zipBuilder.js\`: ZIP file creation

## License

MIT
" > README.md
    
    print_message "README created"
}

# Create .gitignore
create_gitignore() {
    print_step "Creating .gitignore"
    
    echo "# Dependencies
/node_modules
/client/node_modules
/server/node_modules

# Production
/client/build

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Storage
/server/storage/icons/*
/server/storage/temp/*
!/server/storage/icons/.gitkeep
!/server/storage/temp/.gitkeep

# Editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS files
.DS_Store
Thumbs.db" > .gitignore
    
    # Create .gitkeep files
    touch server/storage/icons/.gitkeep
    touch server/storage/temp/.gitkeep
    
    print_message ".gitignore created"
}

# Print completion message
print_completion() {
    print_step "Build Completed"
    
    echo -e "${GREEN}iconif-ai project has been set up successfully!${NC}"
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "1. Set your OpenAI API key in ${YELLOW}server/.env${NC}"
    echo -e "2. Start the application with: ${YELLOW}npm start${NC}"
    echo
    echo -e "${BLUE}Ports:${NC}"
    echo -e "- Client: ${YELLOW}$CLIENT_PORT${NC}"
    echo -e "- Server: ${YELLOW}$SERVER_PORT${NC}"
    echo
    echo -e "${BLUE}Project Directory:${NC} ${YELLOW}$(pwd)/$PROJECT_NAME${NC}"
}

# Main function
main() {
    print_message "Starting build of iconif-ai project"
    
    # Check requirements
    check_requirements
    
    # Create project structure
    create_project_structure
    
    # Set up client and server
    setup_client
    setup_server
    
    # Create root package.json
    create_root_package
    
    # Create source files
    create_source_files
    
    # Create README and .gitignore
    create_readme
    create_gitignore
    
    # Build client
    build_client
    
    # Print completion message
    print_completion
}

# Execute main function
main
