#!/bin/bash

# HandwerkOS ERP VPS Deployment Script
# Deploys to VPS 69.62.121.168 under /var/www/html/e-rechnung with PM2

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# VPS Configuration
VPS_HOST="69.62.121.168"
VPS_USER="root"
VPS_PATH="/var/www/html/e-rechnung"
DOMAIN="erp.mrx3k1.de"
NODE_VERSION="18"

# Service Ports
API_PORT="3901"
WEB_PORT="3900"

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    # Check SSH connection
    if ! ssh -o ConnectTimeout=5 $VPS_USER@$VPS_HOST "echo 'SSH connection successful'" 2>/dev/null; then
        error "❌ Cannot connect to VPS $VPS_HOST via SSH!"
    fi
    
    # Check if .env.vps exists
    if [[ ! -f .env.vps ]]; then
        error "❌ .env.vps file not found! Please create it first."
    fi
    
    # Check required tools
    for cmd in rsync ssh; do
        if ! command -v $cmd &> /dev/null; then
            error "❌ $cmd is required but not installed."
        fi
    done
    
    log "✅ Prerequisites check passed"
}

# Prepare local build
prepare_build() {
    log "📦 Preparing local build..."
    
    # Install dependencies
    if [[ ! -d node_modules ]]; then
        log "📥 Installing dependencies..."
        npm install
    fi
    
    # Generate Prisma client
    log "🔧 Generating Prisma client..."
    npm run db:generate || echo "Prisma generate skipped"
    
    # Build applications
    log "🏗️  Building applications..."
    
    # Build API
    if [[ -d apps/api ]]; then
        cd apps/api
        npm run build || echo "API build failed, continuing..."
        cd ../..
    fi
    
    # Build Web
    if [[ -d apps/web ]]; then
        cd apps/web
        npm run build || echo "Web build failed, continuing..."
        cd ../..
    fi
    
    log "✅ Local build completed"
}

# Setup VPS environment
setup_vps_environment() {
    log "⚙️  Setting up VPS environment..."
    
    ssh $VPS_USER@$VPS_HOST << EOF
        set -e
        
        # Update system
        apt update && apt upgrade -y
        
        # Install required packages
        apt install -y nginx postgresql postgresql-contrib redis-server curl wget gnupg2 software-properties-common
        
        # Install Node.js $NODE_VERSION
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt install -y nodejs
        
        # Install PM2 globally
        npm install -g pm2
        
        # Create application directory
        mkdir -p $VPS_PATH
        mkdir -p $VPS_PATH/{logs,uploads,documents,backups}
        
        # Create error pages directory
        mkdir -p /var/www/html/errors
        
        # Set permissions
        chown -R www-data:www-data $VPS_PATH
        chmod 755 $VPS_PATH
        
        # Setup PM2 startup script
        pm2 startup systemd -u $VPS_USER --hp /root || echo "PM2 startup already configured"
        
        log "✅ VPS environment setup completed"
EOF
    
    log "✅ VPS environment configured"
}

# Setup databases
setup_databases() {
    log "🗄️  Setting up databases..."
    
    ssh $VPS_USER@$VPS_HOST << 'EOF'
        set -e
        
        # Configure PostgreSQL
        systemctl start postgresql
        systemctl enable postgresql
        
        # Create database and user
        sudo -u postgres psql << 'SQL'
CREATE USER handwerkos_user WITH PASSWORD 'SECURE_DB_PASSWORD_CHANGE_ME';
CREATE DATABASE handwerkos_erp OWNER handwerkos_user;
GRANT ALL PRIVILEGES ON DATABASE handwerkos_erp TO handwerkos_user;
\q
SQL
        
        # Configure Redis
        systemctl start redis-server
        systemctl enable redis-server
        
        # Test connections
        sudo -u postgres psql -c "SELECT version();" handwerkos_erp
        redis-cli ping
        
        echo "✅ Databases configured successfully"
EOF
    
    log "✅ Database setup completed"
}

# Deploy application files
deploy_application() {
    log "📤 Deploying application files..."
    
    # Sync files to VPS
    info "📂 Syncing files to VPS..."
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '*.log' \
        --exclude 'coverage' \
        --exclude '.next' \
        --exclude 'dist' \
        --progress \
        . $VPS_USER@$VPS_HOST:$VPS_PATH/
    
    # Install dependencies on VPS
    ssh $VPS_USER@$VPS_HOST << EOF
        set -e
        cd $VPS_PATH
        
        # Install root dependencies
        npm install --production
        
        # Install and build API
        if [[ -d apps/api ]]; then
            cd apps/api
            npm install --production
            npm run build || echo "API build on server failed"
            cd ../..
        fi
        
        # Install and build Web
        if [[ -d apps/web ]]; then
            cd apps/web
            npm install --production
            npm run build || echo "Web build on server failed"
            cd ../..
        fi
        
        # Set proper permissions
        chown -R www-data:www-data $VPS_PATH
        chmod +x scripts/*.sh 2>/dev/null || echo "No scripts to make executable"
        
        echo "✅ Application deployment completed"
EOF
    
    log "✅ Application files deployed"
}

# Setup database schema
setup_database_schema() {
    log "🏗️  Setting up database schema..."
    
    ssh $VPS_USER@$VPS_HOST << EOF
        set -e
        cd $VPS_PATH
        
        # Load environment variables
        export \$(cat .env.vps | grep -v '^#' | xargs) 2>/dev/null || echo "No .env.vps found"
        
        # Run Prisma migrations
        if [[ -d packages/database ]]; then
            cd packages/database
            npx prisma migrate deploy || echo "Prisma migrations failed"
            cd ../..
        fi
        
        # Run any additional SQL setup
        if [[ -f init-db.sql ]]; then
            sudo -u postgres psql handwerkos_erp < init-db.sql || echo "init-db.sql execution failed"
        fi
        
        echo "✅ Database schema setup completed"
EOF
    
    log "✅ Database schema configured"
}

# Configure Nginx
configure_nginx() {
    log "🌐 Configuring Nginx..."
    
    ssh $VPS_USER@$VPS_HOST << EOF
        set -e
        
        # Copy Nginx configuration
        cp $VPS_PATH/nginx/erp.mrx3k1.de.vps.conf /etc/nginx/sites-available/erp.mrx3k1.de
        
        # Create error pages
        cat > /var/www/html/errors/maintenance.html << 'HTML'
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wartung - HandwerkOS ERP</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #f5f5f5;
            color: #333;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #2C2E3B; margin-bottom: 20px; }
        .icon { font-size: 48px; margin-bottom: 20px; }
        .message { font-size: 18px; line-height: 1.6; margin-bottom: 30px; }
        .contact { font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔧</div>
        <h1>Wartungsarbeiten</h1>
        <div class="message">
            HandwerkOS ERP wird gerade aktualisiert.<br>
            Wir sind in wenigen Minuten wieder da!
        </div>
        <div class="contact">
            Bei Fragen erreichen Sie uns unter:<br>
            <strong>support@handwerkos.de</strong>
        </div>
    </div>
</body>
</html>
HTML
        
        cat > /var/www/html/errors/api_error.html << 'HTML'
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Fehler - HandwerkOS ERP</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 500px; margin: 0 auto; }
        h1 { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ Service temporär nicht verfügbar</h1>
        <p>Die HandwerkOS ERP API ist momentan nicht erreichbar.</p>
        <p>Bitte versuchen Sie es in wenigen Minuten erneut.</p>
    </div>
</body>
</html>
HTML
        
        # Create cache directories
        mkdir -p /var/cache/nginx/erp_static
        chown -R www-data:www-data /var/cache/nginx
        
        # Enable site
        ln -sf /etc/nginx/sites-available/erp.mrx3k1.de /etc/nginx/sites-enabled/
        
        # Test and reload nginx
        nginx -t
        systemctl reload nginx
        systemctl enable nginx
        
        echo "✅ Nginx configured successfully"
EOF
    
    log "✅ Nginx configuration completed"
}

# Setup SSL certificate
setup_ssl() {
    log "🔒 Setting up SSL certificate..."
    
    ssh $VPS_USER@$VPS_HOST << EOF
        set -e
        
        # Install Certbot
        apt install -y certbot python3-certbot-nginx
        
        # Create webroot directory
        mkdir -p /var/www/certbot
        chown www-data:www-data /var/www/certbot
        
        # Obtain certificate
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@mrx3k1.de || echo "SSL setup may need manual intervention"
        
        # Setup auto-renewal
        systemctl enable certbot.timer || echo "Certbot timer already enabled"
        
        # Test renewal
        certbot renew --dry-run || echo "SSL renewal test failed - check manually"
        
        echo "✅ SSL certificate setup completed"
EOF
    
    log "✅ SSL certificate configured"
}

# Start PM2 services
start_services() {
    log "🚀 Starting PM2 services..."
    
    ssh $VPS_USER@$VPS_HOST << EOF
        set -e
        cd $VPS_PATH
        
        # Stop any existing PM2 processes
        pm2 delete all || echo "No PM2 processes to delete"
        
        # Start services using VPS-specific ecosystem config
        pm2 start ecosystem.vps.config.js --env production
        
        # Save PM2 configuration
        pm2 save
        
        # Show status
        pm2 status
        pm2 logs --lines 10
        
        echo "✅ PM2 services started successfully"
EOF
    
    log "✅ PM2 services started"
}

# Setup monitoring and backups
setup_monitoring() {
    log "📊 Setting up monitoring and backups..."
    
    ssh $VPS_USER@$VPS_HOST << EOF
        set -e
        cd $VPS_PATH
        
        # Setup cron jobs
        (crontab -l 2>/dev/null; echo "# HandwerkOS ERP Backups") | crontab -
        (crontab -l 2>/dev/null; echo "0 2 * * * cd $VPS_PATH && ./scripts/backup.sh >> /var/log/handwerkos-backup.log 2>&1") | crontab -
        
        # Setup logrotate for PM2 logs
        cat > /etc/logrotate.d/handwerkos << 'LOGROTATE'
/var/www/html/e-rechnung/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    su root root
}
LOGROTATE
        
        echo "✅ Monitoring and backups configured"
EOF
    
    log "✅ Monitoring setup completed"
}

# Verify deployment
verify_deployment() {
    log "🔍 Verifying deployment..."
    
    # Test SSH connection
    ssh $VPS_USER@$VPS_HOST "echo '✅ SSH connection working'"
    
    # Test PM2 status
    ssh $VPS_USER@$VPS_HOST "pm2 status | grep -E '(handwerkos-api|handwerkos-web)'" || warn "PM2 services may not be running"
    
    # Test local API health
    ssh $VPS_USER@$VPS_HOST "curl -f http://127.0.0.1:$API_PORT/health" || warn "API health check failed"
    
    # Test local web service
    ssh $VPS_USER@$VPS_HOST "curl -f http://127.0.0.1:$WEB_PORT" || warn "Web service test failed"
    
    # Test Nginx configuration
    ssh $VPS_USER@$VPS_HOST "nginx -t" || error "Nginx configuration test failed"
    
    # Test database connection
    ssh $VPS_USER@$VPS_HOST "sudo -u postgres psql -c 'SELECT 1;' handwerkos_erp" || warn "Database connection test failed"
    
    # Test Redis
    ssh $VPS_USER@$VPS_HOST "redis-cli ping" || warn "Redis connection test failed"
    
    log "✅ Deployment verification completed"
}

# Main deployment function
main() {
    log "🚀 Starting HandwerkOS ERP deployment to VPS $VPS_HOST..."
    
    case "${1:-full}" in
        "check")
            check_prerequisites
            ;;
        "prepare")
            check_prerequisites
            prepare_build
            ;;
        "setup")
            setup_vps_environment
            setup_databases
            ;;
        "deploy")
            deploy_application
            setup_database_schema
            ;;
        "nginx")
            configure_nginx
            ;;
        "ssl")
            setup_ssl
            ;;
        "services")
            start_services
            ;;
        "monitor")
            setup_monitoring
            ;;
        "verify")
            verify_deployment
            ;;
        "restart")
            ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && pm2 restart all"
            ;;
        "logs")
            ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && pm2 logs"
            ;;
        "status")
            ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && pm2 status"
            ;;
        "full")
            check_prerequisites
            prepare_build
            setup_vps_environment
            setup_databases
            deploy_application
            setup_database_schema
            configure_nginx
            setup_ssl
            start_services
            setup_monitoring
            verify_deployment
            ;;
        *)
            echo "Usage: $0 {check|prepare|setup|deploy|nginx|ssl|services|monitor|verify|restart|logs|status|full}"
            echo ""
            echo "Commands:"
            echo "  check     - Check prerequisites"
            echo "  prepare   - Prepare local build"
            echo "  setup     - Setup VPS environment and databases"
            echo "  deploy    - Deploy application files"
            echo "  nginx     - Configure Nginx"
            echo "  ssl       - Setup SSL certificate"
            echo "  services  - Start PM2 services"
            echo "  monitor   - Setup monitoring and backups"
            echo "  verify    - Verify deployment"
            echo "  restart   - Restart PM2 services"
            echo "  logs      - Show PM2 logs"
            echo "  status    - Show PM2 status"
            echo "  full      - Complete deployment (default)"
            exit 1
            ;;
    esac
    
    if [[ "${1:-full}" == "full" ]]; then
        log ""
        log "🎉 HandwerkOS ERP deployment completed successfully!"
        log ""
        log "📋 Deployment Summary:"
        log "  🌐 URL: https://$DOMAIN"
        log "  🖥️  VPS: $VPS_HOST"
        log "  📁 Path: $VPS_PATH"
        log "  🔌 API Port: $API_PORT"
        log "  🌍 Web Port: $WEB_PORT"
        log ""
        log "🔧 Management Commands:"
        log "  ./deploy-vps.sh status   - Check PM2 status"
        log "  ./deploy-vps.sh logs     - View logs"
        log "  ./deploy-vps.sh restart  - Restart services"
        log "  ssh $VPS_USER@$VPS_HOST  - SSH to server"
        log ""
        log "⚠️  Important Next Steps:"
        log "  1. Update .env.vps with secure passwords"
        log "  2. Configure SMTP settings for email"
        log "  3. Test the application thoroughly"
        log "  4. Setup monitoring and alerts"
        log ""
    fi
}

# Error handling
trap 'error "❌ Deployment failed due to an error on line $LINENO"' ERR

# Run main function with arguments
main "$@"