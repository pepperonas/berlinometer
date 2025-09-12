#!/bin/bash

# Simplified HandwerkOS ERP VPS Deployment Script
# Deploys essential components only to VPS 69.62.121.168

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
VPS_HOST="69.62.121.168"
VPS_USER="root"
VPS_PATH="/var/www/html/e-rechnung"
DOMAIN="erp.mrx3k1.de"

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Deploy simplified version
deploy_simple() {
    log "🚀 Deploying simplified HandwerkOS ERP..."
    
    # Create basic application structure on VPS
    ssh $VPS_USER@$VPS_HOST << 'EOF'
        set -e
        
        # Update system and install essentials
        apt update && apt upgrade -y
        apt install -y nginx postgresql postgresql-contrib redis-server nodejs npm curl
        
        # Install PM2
        npm install -g pm2
        
        # Create application directory
        mkdir -p /var/www/html/e-rechnung/{public,api,logs,uploads,documents}
        
        # Create basic HTML landing page
        cat > /var/www/html/e-rechnung/public/index.html << 'HTML'
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HandwerkOS ERP - Coming Soon</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #2C2E3B 0%, #4F46E5 100%);
            color: white;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .container {
            max-width: 600px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 20px;
            font-weight: 700;
        }
        .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 30px;
        }
        .features {
            text-align: left;
            margin: 30px 0;
        }
        .feature {
            margin: 10px 0;
            padding: 10px 0;
        }
        .icon {
            display: inline-block;
            width: 24px;
            margin-right: 10px;
        }
        .status {
            background: rgba(16, 185, 129, 0.2);
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #10B981;
        }
        .contact {
            margin-top: 30px;
            font-size: 0.9rem;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 HandwerkOS</h1>
        <div class="subtitle">Modernes ERP-System für kleine Unternehmen</div>
        
        <div class="status">
            ✅ Server erfolgreich bereitgestellt!<br>
            🚀 Deployment in Bearbeitung...
        </div>
        
        <div class="features">
            <div class="feature">📊 <strong>E-Rechnung konform</strong> - XRechnung & ZUGFeRD Support</div>
            <div class="feature">👥 <strong>Multi-Tenant</strong> - Jedes Unternehmen isoliert</div>
            <div class="feature">🔒 <strong>Sicher & DSGVO-konform</strong> - Deutsche Standards</div>
            <div class="feature">⚡ <strong>Modern & Schnell</strong> - Next.js & TypeScript</div>
            <div class="feature">💾 <strong>Automatische Backups</strong> - Daten immer sicher</div>
            <div class="feature">📱 <strong>Responsive Design</strong> - Desktop & Mobile</div>
        </div>
        
        <div class="contact">
            <strong>Server-Info:</strong><br>
            Domain: erp.mrx3k1.de<br>
            Server: 69.62.121.168<br>
            Status: Deployment in Vorbereitung
        </div>
    </div>
</body>
</html>
HTML
        
        # Create basic Express.js API server
        cat > /var/www/html/e-rechnung/api/server.js << 'JS'
const express = require('express');
const app = express();
const port = 3901;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'HandwerkOS ERP API'
    });
});

// Basic API info
app.get('/api/info', (req, res) => {
    res.json({
        name: 'HandwerkOS ERP API',
        version: '1.0.0',
        description: 'E-Rechnung compliant ERP system for small businesses',
        endpoints: {
            health: '/health',
            info: '/api/info'
        }
    });
});

app.listen(port, '127.0.0.1', () => {
    console.log(`HandwerkOS API running on http://127.0.0.1:${port}`);
});
JS
        
        # Initialize package.json for API
        cd /var/www/html/e-rechnung/api
        npm init -y
        npm install express
        
        # Setup basic PM2 ecosystem
        cat > /var/www/html/e-rechnung/ecosystem.simple.js << 'JS'
module.exports = {
  apps: [
    {
      name: 'handwerkos-api-simple',
      script: 'api/server.js',
      cwd: '/var/www/html/e-rechnung',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3901
      },
      error_file: '/var/www/html/e-rechnung/logs/api-error.log',
      out_file: '/var/www/html/e-rechnung/logs/api-out.log',
      log_file: '/var/www/html/e-rechnung/logs/api.log',
      max_memory_restart: '256M',
      restart_delay: 4000
    }
  ]
};
JS
        
        # Configure basic Nginx
        cat > /etc/nginx/sites-available/erp.mrx3k1.de << 'NGINX'
server {
    listen 80;
    server_name erp.mrx3k1.de;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name erp.mrx3k1.de;
    
    # SSL will be configured by certbot
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Serve static files
    location / {
        root /var/www/html/e-rechnung/public;
        try_files $uri $uri/ /index.html;
        expires 1h;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3901/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3901/health;
        access_log off;
    }
}
NGINX
        
        # Enable site
        ln -sf /etc/nginx/sites-available/erp.mrx3k1.de /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        
        # Test nginx
        nginx -t
        
        # Setup SSL with Let's Encrypt
        apt install -y certbot python3-certbot-nginx
        mkdir -p /var/www/certbot
        
        # Restart services
        systemctl restart nginx
        systemctl enable nginx
        
        # Start PM2
        cd /var/www/html/e-rechnung
        pm2 start ecosystem.simple.js
        pm2 save
        pm2 startup --user root
        
        # Configure databases
        systemctl start postgresql redis-server
        systemctl enable postgresql redis-server
        
        # Create basic database
        sudo -u postgres createuser handwerkos_user || echo "User already exists"
        sudo -u postgres createdb handwerkos_erp -O handwerkos_user || echo "Database already exists"
        
        echo "✅ Basic HandwerkOS ERP setup completed!"
        echo "🌐 Access: https://erp.mrx3k1.de (after SSL setup)"
        echo "📊 API Health: https://erp.mrx3k1.de/health"
        echo ""
        echo "Next steps:"
        echo "1. Setup SSL: certbot --nginx -d erp.mrx3k1.de"
        echo "2. Check PM2: pm2 status"
        echo "3. View logs: pm2 logs"
EOF
    
    log "✅ Basic HandwerkOS ERP deployed successfully!"
}

# Setup SSL automatically
setup_ssl() {
    log "🔒 Setting up SSL certificate..."
    
    ssh $VPS_USER@$VPS_HOST << EOF
        set -e
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@mrx3k1.de || echo "SSL setup completed or failed"
        systemctl reload nginx
        echo "✅ SSL setup attempted"
EOF
}

# Show status
show_status() {
    log "📊 Checking system status..."
    
    ssh $VPS_USER@$VPS_HOST << EOF
        echo "=== PM2 Status ==="
        pm2 status
        
        echo "=== Nginx Status ==="
        systemctl status nginx --no-pager -l
        
        echo "=== API Health Check ==="
        curl -f http://127.0.0.1:3901/health || echo "API not responding"
        
        echo "=== SSL Certificate ==="
        certbot certificates || echo "No SSL certificates found"
EOF
}

case "${1:-deploy}" in
    "deploy")
        deploy_simple
        setup_ssl
        show_status
        ;;
    "ssl")
        setup_ssl
        ;;
    "status")
        show_status
        ;;
    "logs")
        ssh $VPS_USER@$VPS_HOST "pm2 logs"
        ;;
    *)
        echo "Usage: $0 {deploy|ssl|status|logs}"
        ;;
esac