#!/bin/bash
echo "Starting MongoDB and Bartender Server..."

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "MongoDB is not installed. Please install MongoDB first."
    echo "For macOS: brew install mongodb-community"
    echo "For Ubuntu: sudo apt install mongodb"
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Starting MongoDB..."
    mkdir -p ~/data/db
    mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongodb.log
    if [ $? -ne 0 ]; then
        echo "Failed to start MongoDB. Please check your MongoDB installation."
        exit 1
    fi
    echo "MongoDB started successfully."
else
    echo "MongoDB is already running."
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Failed to install dependencies."
        exit 1
    fi
fi

# Create admin user if needed
echo "Checking for admin user..."
node server/scripts/create-admin.js

# Start server
echo "Starting Bartender server..."
node server.js