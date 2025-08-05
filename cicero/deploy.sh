#!/bin/bash

# Deploy Cicero Frontend to VPS

echo "🚀 Deploying Cicero Frontend..."

# Build the frontend
cd frontend
echo "📦 Building frontend..."
npm run build

# Create deployment directory on server and copy files
echo "📤 Copying files to server..."
ssh mrx3k1@mrx3k1.de "mkdir -p /var/www/html/cicero/frontend"
rsync -avz --delete build/ mrx3k1@mrx3k1.de:/var/www/html/cicero/frontend/

echo "✅ Frontend deployment complete!"

# Restart backend services on server
echo "🔄 Restarting backend services..."
ssh mrx3k1@mrx3k1.de "cd /home/mrx3k1/mrx3k1/cicero && pm2 restart ecosystem.config.js --env production"
ssh mrx3k1@mrx3k1.de "cd /home/mrx3k1/mrx3k1/cicero/log-parser && pm2 restart ecosystem.config.js"

echo "✅ Cicero deployment complete!"