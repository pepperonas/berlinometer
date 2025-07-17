#!/bin/bash

# Social Market Deployment Script
# Run this script on your VPS to deploy the social-market app

echo "🚀 Deploying Social Market App..."

# Variables
APP_NAME="social-market"
BACKEND_DIR="/var/www/html/$APP_NAME/backend"
FRONTEND_DIR="/var/www/html/$APP_NAME/frontend"
NGINX_CONF="/etc/nginx/sites-available/mrx3k1.de"

# Create directories
sudo mkdir -p $BACKEND_DIR
sudo mkdir -p $FRONTEND_DIR

echo "📁 Directories created"

# Copy backend files
sudo cp -r backend/* $BACKEND_DIR/
sudo chown -R www-data:www-data $BACKEND_DIR

echo "⚙️ Backend files copied"

# Install backend dependencies
cd $BACKEND_DIR
sudo npm install --production

echo "📦 Backend dependencies installed"

# Build and copy frontend
cd /tmp
# Assuming you've uploaded the frontend build or will build it locally
# sudo cp -r frontend/build/* $FRONTEND_DIR/
echo "⚠️  Please build frontend locally with 'npm run build' and upload to $FRONTEND_DIR"

# Add nginx configuration
echo "🌐 Adding Nginx configuration..."
echo "Please add the following to your nginx configuration:"
echo "Location: $NGINX_CONF"
cat nginx-social-market.conf

# Start with PM2
echo "🔄 Starting backend with PM2..."
cd $BACKEND_DIR
sudo pm2 start ecosystem.config.js
sudo pm2 save
sudo pm2 startup

echo "✅ Social Market deployed!"
echo ""
echo "📋 Next steps:"
echo "1. Build frontend: cd social-market/frontend && npm run build"
echo "2. Upload frontend build to: $FRONTEND_DIR"
echo "3. Add nginx config to: $NGINX_CONF"
echo "4. Restart nginx: sudo systemctl reload nginx"
echo "5. Access app at: https://mrx3k1.de/social-market/"
echo ""
echo "🔧 PM2 commands:"
echo "- View logs: pm2 logs social-market-backend"
echo "- Restart: pm2 restart social-market-backend"
echo "- Stop: pm2 stop social-market-backend"