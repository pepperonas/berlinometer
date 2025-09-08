#!/bin/bash

# Dart Snizzle Deployment Script
# Deploys the app to mrx3k1.de VPS

set -e

APP_NAME="dart-snizzle"
VPS_HOST="root@mrx3k1.de"
VPS_PATH="/var/www/html/$APP_NAME"

echo "🎯 Starting Dart Snizzle deployment..."

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the dart-snizzle root directory"
    exit 1
fi

echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

echo "📂 Creating temporary upload directory..."
ssh $VPS_HOST "mkdir -p /tmp/$APP_NAME-frontend /tmp/$APP_NAME-backend"

echo "🚀 Uploading backend files..."
scp -r backend/* $VPS_HOST:/tmp/$APP_NAME-backend/

echo "🌐 Uploading frontend build..."
scp -r frontend/build/* $VPS_HOST:/tmp/$APP_NAME-frontend/

echo "🔧 Setting up on VPS..."
ssh $VPS_HOST << 'ENDSSH'
    # Create production directories
    sudo mkdir -p /var/www/html/dart-snizzle/backend
    sudo mkdir -p /var/www/html/dart-snizzle/frontend
    sudo mkdir -p /var/www/html/dart-snizzle/backend/logs

    # Copy files to production
    sudo cp -r /tmp/dart-snizzle-backend/* /var/www/html/dart-snizzle/backend/
    sudo cp -r /tmp/dart-snizzle-frontend/* /var/www/html/dart-snizzle/frontend/

    # Set ownership
    sudo chown -R www-data:www-data /var/www/html/dart-snizzle

    # Install backend dependencies
    cd /var/www/html/dart-snizzle/backend
    sudo npm install --production

    # Start/restart PM2 service
    sudo pm2 delete dart-snizzle-backend 2>/dev/null || true
    sudo pm2 start ecosystem.config.js --env production
    sudo pm2 save

    # Clean up temp files
    rm -rf /tmp/dart-snizzle-frontend /tmp/dart-snizzle-backend

    echo "✅ Deployment completed!"
    echo "🌐 Frontend: https://mrx3k1.de/dart-snizzle/"
    echo "🔧 API: https://mrx3k1.de/dart-snizzle/api/health"
    echo "📊 PM2 Status:"
    sudo pm2 status dart-snizzle-backend
ENDSSH

echo ""
echo "🎉 Dart Snizzle deployment successful!"
echo "🌐 App URL: https://mrx3k1.de/dart-snizzle/"
echo ""
echo "Next steps:"
echo "1. Add Nginx configuration for /dart-snizzle/ routes"
echo "2. Test the application"
echo "3. Create first admin user in MongoDB"
echo ""
echo "Nginx configuration to add:"
echo "----------------------------------------"
cat << 'EOF'
# Dart Snizzle Frontend
location /dart-snizzle/ {
    alias /var/www/html/dart-snizzle/frontend/;
    try_files $uri $uri/ /dart-snizzle/index.html;
    index index.html;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    
    # PWA headers
    location ~* \.(?:manifest|json)$ {
        add_header Cache-Control "public, max-age=300";
    }
}

# Dart Snizzle Backend API
location /dart-snizzle/api/ {
    proxy_pass http://localhost:5070/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
EOF
echo "----------------------------------------"