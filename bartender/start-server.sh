#!/bin/bash
echo "Starting Bartender Server with production configuration..."

# Set the working directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Failed to install dependencies."
        exit 1
    fi
fi

# Check if .env.server exists
if [ ! -f ".env.server" ]; then
    echo "ERROR: .env.server configuration file not found!"
    echo "Please create an .env.server file based on .env-examples/.env.server.example"
    exit 1
fi

# Create admin user if needed
echo "Checking for admin user..."
node -r dotenv/config server/scripts/create-admin.js dotenv_config_path=.env.server

# Start server with production configuration
echo "Starting Bartender server with production settings..."
node -r dotenv/config server.js dotenv_config_path=.env.server