#!/bin/bash

# Social Market Deploy Script
# Führt das komplette Deployment durch

echo "🚀 Starting Social Market Deployment..."

# Server details (adjust as needed)
SERVER="root@mrx3k1.de"
REMOTE_BACKEND="/var/www/html/social-market/backend"
REMOTE_FRONTEND="/var/www/html/social-market/frontend"

# Local paths
LOCAL_BACKEND="./backend"
LOCAL_FRONTEND="./frontend/build"

echo "📦 Creating deployment packages..."

# Create temp directory for deployment
rm -rf deploy-temp
mkdir -p deploy-temp/backend
mkdir -p deploy-temp/frontend

# Copy backend files (excluding node_modules)
rsync -av --exclude='node_modules' --exclude='uploads/*' $LOCAL_BACKEND/ deploy-temp/backend/

# Copy frontend build
cp -r $LOCAL_FRONTEND/* deploy-temp/frontend/

echo "📤 Uploading to server..."

# Upload backend
ssh $SERVER "mkdir -p $REMOTE_BACKEND"
rsync -avz --delete deploy-temp/backend/ $SERVER:$REMOTE_BACKEND/

# Upload frontend
ssh $SERVER "mkdir -p $REMOTE_FRONTEND"
rsync -avz --delete deploy-temp/frontend/ $SERVER:$REMOTE_FRONTEND/

echo "🔧 Setting up on server..."

# Execute setup commands on server
ssh $SERVER << 'ENDSSH'
cd /var/www/html/social-market/backend

# Install dependencies
npm install --production

# Create uploads directory
mkdir -p uploads
chown -R www-data:www-data /var/www/html/social-market

# Restart PM2
pm2 restart social-market-backend || pm2 start ecosystem.config.js
pm2 save

# Show status
pm2 list
ENDSSH

# Clean up local temp files
rm -rf deploy-temp

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📌 Check the app at: https://mrx3k1.de/social-market/"
echo "📊 View logs: ssh $SERVER 'pm2 logs social-market-backend'"
echo ""
echo "🔍 If nginx not configured, add the configuration from nginx-social-market.conf"