#!/bin/bash

# HandwerkOS ERP Deployment Script
# This script deploys the HandwerkOS ERP system to your VPS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_HOST="${SERVER_HOST:-root@mrx3k1.de}"
APP_NAME="handwerkos"
REMOTE_PATH="/var/www/${APP_NAME}"
DOMAIN="erp.mrx3k1.de"
NODE_VERSION="18"

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
    
    # Check if SSH key exists
    if [[ ! -f ~/.ssh/id_rsa && ! -f ~/.ssh/id_ed25519 ]]; then
        warn "No SSH key found. You may need to enter password multiple times."
    fi
    
    # Check if .env.prod exists
    if [[ ! -f .env.prod ]]; then
        error ".env.prod file not found! Please create it first."
    fi
    
    # Check if required commands exist
    for cmd in rsync ssh docker; do
        if ! command -v $cmd &> /dev/null; then
            error "$cmd is required but not installed."
        fi
    done
    
    log "✅ Prerequisites check passed"
}

# Prepare local files
prepare_local() {
    log "📦 Preparing local files..."
    
    # Create necessary directories
    mkdir -p logs/{api,web,worker}
    mkdir -p backups
    mkdir -p uploads
    mkdir -p scripts
    
    # Build production Dockerfiles
    create_dockerfiles
    
    # Create additional scripts
    create_scripts
    
    log "✅ Local preparation completed"
}

# Create production Dockerfiles
create_dockerfiles() {
    log "🐳 Creating production Dockerfiles..."
    
    # API Dockerfile
    cat > apps/api/Dockerfile.prod << 'EOF'
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat && \
    npm install -g pnpm

# Dependencies stage
FROM base AS deps
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/*/package*.json ./packages/
RUN pnpm install --frozen-lockfile --prod

# Build stage
FROM base AS builder
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/*/package*.json ./packages/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build:api

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 handwerkos
    
COPY --from=deps --chown=handwerkos:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=handwerkos:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=handwerkos:nodejs /app/apps/api/package.json ./package.json

RUN mkdir -p logs uploads && \
    chown -R handwerkos:nodejs logs uploads

USER handwerkos
EXPOSE 3001
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
EOF

    # Web Dockerfile
    cat > apps/web/Dockerfile.prod << 'EOF'
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat && \
    npm install -g pnpm

# Dependencies stage
FROM base AS deps
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/*/package*.json ./packages/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/*/package*.json ./packages/
RUN pnpm install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm run build:web

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
EOF

    log "✅ Dockerfiles created"
}

# Create additional scripts
create_scripts() {
    log "📜 Creating additional scripts..."
    
    # Backup script
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="$BACKUP_DIR/handwerkos_db_$TIMESTAMP.sql"
FILES_BACKUP_FILE="$BACKUP_DIR/handwerkos_files_$TIMESTAMP.tar.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "Creating database backup..."
pg_dump -h postgres -U $POSTGRES_USER -d $POSTGRES_DB > "$DB_BACKUP_FILE"
gzip "$DB_BACKUP_FILE"

# Files backup (uploads, etc.)
echo "Creating files backup..."
tar -czf "$FILES_BACKUP_FILE" -C /app uploads logs

# Cleanup old backups (keep last 30 days)
find "$BACKUP_DIR" -name "handwerkos_*" -mtime +30 -delete

echo "Backup completed: ${DB_BACKUP_FILE}.gz and $FILES_BACKUP_FILE"
EOF

    # Health check script
    cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
set -e

# Check API health
API_HEALTH=$(curl -f -s http://localhost:3001/health || echo "FAILED")
if [[ "$API_HEALTH" == "FAILED" ]]; then
    echo "API health check failed"
    exit 1
fi

# Check Web health
WEB_HEALTH=$(curl -f -s http://localhost:3000/api/health || echo "FAILED")
if [[ "$WEB_HEALTH" == "FAILED" ]]; then
    echo "Web health check failed"
    exit 1
fi

# Check database connection
DB_CHECK=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;" || echo "FAILED")
if [[ "$DB_CHECK" == "FAILED" ]]; then
    echo "Database health check failed"
    exit 1
fi

echo "All health checks passed"
EOF

    chmod +x scripts/*.sh
    log "✅ Scripts created"
}

# Deploy to server
deploy_to_server() {
    log "🚀 Deploying to server $SERVER_HOST..."
    
    # Create remote directory
    ssh $SERVER_HOST "mkdir -p $REMOTE_PATH"
    
    # Sync files (excluding node_modules and build artifacts)
    info "📂 Syncing files to server..."
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude 'dist' \
        --exclude '.git' \
        --exclude '*.log' \
        --exclude 'coverage' \
        --progress \
        . $SERVER_HOST:$REMOTE_PATH/
    
    log "✅ Files synced to server"
}

# Setup server environment
setup_server() {
    log "⚙️  Setting up server environment..."
    
    ssh $SERVER_HOST << EOF
        set -e
        cd $REMOTE_PATH
        
        # Update system
        apt update && apt upgrade -y
        
        # Install required packages
        apt install -y nginx certbot python3-certbot-nginx docker.io docker-compose postgresql-client redis-tools curl
        
        # Install Node.js $NODE_VERSION
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt install -y nodejs
        
        # Install PM2 globally
        npm install -g pm2
        
        # Setup PM2 startup
        pm2 startup systemd -u root --hp /root
        
        # Create necessary directories
        mkdir -p /var/log/nginx
        mkdir -p /var/cache/nginx/{static,files}
        mkdir -p /var/www/errors
        mkdir -p /var/www/certbot
        mkdir -p logs/{api,web,worker}
        mkdir -p backups
        mkdir -p uploads
        
        # Set permissions
        chown -R www-data:www-data /var/cache/nginx
        chown -R root:root logs backups uploads
        chmod 755 scripts/*.sh
        
        echo "✅ Server environment setup completed"
EOF
    
    log "✅ Server environment configured"
}

# Configure Nginx
configure_nginx() {
    log "🌐 Configuring Nginx..."
    
    ssh $SERVER_HOST << EOF
        set -e
        
        # Copy nginx configuration
        cp $REMOTE_PATH/nginx/erp.mrx3k1.de.conf /etc/nginx/sites-available/
        
        # Create error pages
        cat > /var/www/errors/maintenance.html << 'HTML'
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wartung - HandwerkOS</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #2C2E3B; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Wartungsarbeiten</h1>
        <p>HandwerkOS wird gerade aktualisiert. Wir sind bald wieder da!</p>
        <p>Bei Fragen erreichen Sie uns unter support@handwerkos.de</p>
    </div>
</body>
</html>
HTML
        
        cat > /var/www/errors/api_error.html << 'HTML'
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>API Fehler - HandwerkOS</title>
</head>
<body>
    <h1>Service temporär nicht verfügbar</h1>
    <p>Die HandwerkOS API ist momentan nicht erreichbar. Bitte versuchen Sie es später erneut.</p>
</body>
</html>
HTML
        
        # Enable site
        ln -sf /etc/nginx/sites-available/erp.mrx3k1.de.conf /etc/nginx/sites-enabled/
        
        # Test nginx configuration
        nginx -t
        
        echo "✅ Nginx configured"
EOF
    
    log "✅ Nginx configuration completed"
}

# Setup SSL certificate
setup_ssl() {
    log "🔒 Setting up SSL certificate..."
    
    ssh $SERVER_HOST << EOF
        set -e
        
        # Stop nginx temporarily
        systemctl stop nginx || true
        
        # Obtain SSL certificate
        certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos -m admin@mrx3k1.de
        
        # Setup auto-renewal
        echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
        
        # Start nginx
        systemctl start nginx
        systemctl enable nginx
        
        echo "✅ SSL certificate configured"
EOF
    
    log "✅ SSL certificate setup completed"
}

# Build and start services
start_services() {
    log "🏗️  Building and starting services..."
    
    ssh $SERVER_HOST << EOF
        set -e
        cd $REMOTE_PATH
        
        # Load environment variables
        export \$(cat .env.prod | xargs)
        
        # Build and start Docker services
        docker-compose -f docker-compose.prod.yml down || true
        docker-compose -f docker-compose.prod.yml build --no-cache
        docker-compose -f docker-compose.prod.yml up -d
        
        # Wait for services to be ready
        echo "⏳ Waiting for services to start..."
        sleep 30
        
        # Install dependencies and build applications
        npm install
        npm run build
        
        # Start PM2 processes
        pm2 delete all || true
        pm2 start ecosystem.config.js --env production
        pm2 save
        
        # Setup cron jobs
        # Database backup at 2 AM daily
        echo "0 2 * * * cd $REMOTE_PATH && docker-compose -f docker-compose.prod.yml run --rm backup" | crontab -
        
        # Health check every 5 minutes
        echo "*/5 * * * * cd $REMOTE_PATH && ./scripts/health-check.sh >> /var/log/handwerkos-health.log 2>&1" | crontab -
        
        echo "✅ Services started successfully"
EOF
    
    log "✅ Services started and configured"
}

# Verify deployment
verify_deployment() {
    log "🔍 Verifying deployment..."
    
    # Test API endpoint
    if curl -f -s "https://$DOMAIN/api/health" > /dev/null; then
        log "✅ API health check passed"
    else
        error "❌ API health check failed"
    fi
    
    # Test frontend
    if curl -f -s "https://$DOMAIN" > /dev/null; then
        log "✅ Frontend health check passed"
    else
        error "❌ Frontend health check failed"
    fi
    
    # Check SSL certificate
    if curl -f -s "https://$DOMAIN" | head -1 > /dev/null; then
        log "✅ SSL certificate working"
    else
        warn "⚠️  SSL certificate may have issues"
    fi
    
    log "✅ Deployment verification completed"
}

# Main deployment function
main() {
    log "🚀 Starting HandwerkOS ERP deployment..."
    
    case "${1:-full}" in
        "check")
            check_prerequisites
            ;;
        "prepare")
            check_prerequisites
            prepare_local
            ;;
        "deploy")
            deploy_to_server
            ;;
        "setup")
            setup_server
            configure_nginx
            ;;
        "ssl")
            setup_ssl
            ;;
        "start")
            start_services
            ;;
        "verify")
            verify_deployment
            ;;
        "full")
            check_prerequisites
            prepare_local
            deploy_to_server
            setup_server
            configure_nginx
            setup_ssl
            start_services
            verify_deployment
            ;;
        *)
            echo "Usage: $0 {check|prepare|deploy|setup|ssl|start|verify|full}"
            echo ""
            echo "Commands:"
            echo "  check    - Check prerequisites"
            echo "  prepare  - Prepare local files"
            echo "  deploy   - Deploy files to server"
            echo "  setup    - Setup server environment"
            echo "  ssl      - Setup SSL certificate"
            echo "  start    - Start services"
            echo "  verify   - Verify deployment"
            echo "  full     - Run complete deployment (default)"
            exit 1
            ;;
    esac
    
    if [[ "${1:-full}" == "full" ]]; then
        log "🎉 HandwerkOS ERP deployment completed successfully!"
        log "🌐 Your ERP system is now available at: https://$DOMAIN"
        log "📊 MinIO Console: https://$DOMAIN/minio/"
        log "📝 Check logs: ssh $SERVER_HOST 'pm2 logs'"
        log ""
        log "Next steps:"
        log "1. Update your DNS to point $DOMAIN to your server IP"
        log "2. Test the application thoroughly"
        log "3. Set up monitoring and alerting"
        log "4. Configure your SMTP settings for email functionality"
    fi
}

# Run main function with all arguments
main "$@"