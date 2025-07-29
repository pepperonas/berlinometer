#!/bin/bash

# Popular Times Deployment Script
# Deploys the React webapp and Python backend to VPS

set -e

echo "🚀 Starting Popular Times Deployment..."

# Configuration
VPS_HOST="mrx3k1.de"
VPS_USER="root"
APP_NAME="popular-times"
LOCAL_BUILD_DIR="webapp/build"
REMOTE_WEB_DIR="/var/www/html/popular-times/webapp"
REMOTE_API_DIR="/var/www/html/popular-times"
SERVICE_NAME="popular-times-api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if build directory exists
if [ ! -d "$LOCAL_BUILD_DIR" ]; then
    print_error "Build directory not found. Please run 'npm run build' first."
    exit 1
fi



print_status "Deploying backend to VPS..."

# Upload backend files
scp server.py $VPS_USER@$VPS_HOST:$REMOTE_API_DIR/
scp requirements.txt $VPS_USER@$VPS_HOST:$REMOTE_API_DIR/
scp -r maps-playwrite-scraper/ $VPS_USER@$VPS_HOST:$REMOTE_API_DIR/

print_status "Setting up Python environment and dependencies..."

# Install Python dependencies and setup service
ssh $VPS_USER@$VPS_HOST << EOF
cd $REMOTE_API_DIR

# Install Python dependencies
pip3 install -r requirements.txt

# Install Playwright browsers
python3 -m playwright install chromium

# Create systemd service file
cat > /etc/systemd/system/$SERVICE_NAME.service << EOL
[Unit]
Description=Popular Times API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$REMOTE_API_DIR
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/python3 /var/www/html/popular-times/server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL

# Reload systemd and start service
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME

# Check service status
if systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ Service $SERVICE_NAME is running"
else
    echo "❌ Service $SERVICE_NAME failed to start"
    systemctl status $SERVICE_NAME
fi
EOF

print_status "Deployment completed! 🎉"
print_status "Frontend: https://$VPS_HOST/popular-times"
print_status "API: https://$VPS_HOST/api/popular-times"

print_status "Checking service status..."
ssh $VPS_USER@$VPS_HOST "systemctl status $SERVICE_NAME --no-pager"

echo ""
print_status "Deployment Summary:"
echo "  ✅ React app built and deployed"
echo "  ✅ Python backend deployed"
echo "  ✅ Systemd service configured"
echo "  ✅ Nginx proxy configured"
echo ""
echo "🌐 Access your app at: https://$VPS_HOST/popular-times"