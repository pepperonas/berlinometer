#!/bin/bash

# HandwerkOS SSL Certificate Setup Script
# Configures Let's Encrypt SSL certificates for the ERP system

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="${DOMAIN:-erp.mrx3k1.de}"
EMAIL="${SSL_EMAIL:-admin@mrx3k1.de}"
WEBROOT="/var/www/certbot"

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SSL: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] SSL ERROR: $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] SSL WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] SSL INFO: $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "🔍 Checking SSL prerequisites..."
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        info "📦 Installing certbot..."
        apt update
        apt install -y certbot python3-certbot-nginx
    fi
    
    # Check if nginx is installed and running
    if ! command -v nginx &> /dev/null; then
        error "❌ Nginx is not installed!"
    fi
    
    if ! systemctl is-active --quiet nginx; then
        warn "⚠️  Nginx is not running. Starting..."
        systemctl start nginx
    fi
    
    # Create webroot directory
    mkdir -p "$WEBROOT"
    chown -R www-data:www-data "$WEBROOT"
    
    log "✅ Prerequisites check passed"
}

# Setup initial nginx config for ACME challenge
setup_initial_nginx() {
    log "🌐 Setting up initial Nginx configuration..."
    
    cat > /etc/nginx/sites-available/erp.mrx3k1.de-ssl-setup << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF
    
    # Enable the temporary config
    ln -sf /etc/nginx/sites-available/erp.mrx3k1.de-ssl-setup /etc/nginx/sites-enabled/
    
    # Test and reload nginx
    nginx -t
    systemctl reload nginx
    
    log "✅ Initial Nginx configuration ready"
}

# Obtain SSL certificate
obtain_certificate() {
    log "🔒 Obtaining SSL certificate for $DOMAIN..."
    
    # Check if certificate already exists
    if [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
        warn "⚠️  Certificate for $DOMAIN already exists. Use 'renew' to update it."
        return 0
    fi
    
    # Obtain certificate using webroot method
    if certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN" \
        --non-interactive; then
        
        log "✅ SSL certificate obtained successfully"
    else
        error "❌ Failed to obtain SSL certificate"
    fi
}

# Setup certificate renewal
setup_renewal() {
    log "🔄 Setting up automatic certificate renewal..."
    
    # Create renewal configuration
    cat > /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF
    chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh
    
    # Test renewal
    if certbot renew --dry-run; then
        log "✅ Certificate renewal test passed"
    else
        warn "⚠️  Certificate renewal test failed"
    fi
    
    # Setup cron job for renewal (twice daily)
    cat > /etc/cron.d/certbot-renewal << EOF
# Let's Encrypt certificate renewal
# Runs twice daily at random times to avoid load spikes
0 2,14 * * * root /usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
EOF
    
    log "✅ Automatic renewal configured"
}

# Apply production nginx config
apply_production_config() {
    log "📝 Applying production Nginx configuration..."
    
    # Remove temporary SSL setup config
    rm -f /etc/nginx/sites-enabled/erp.mrx3k1.de-ssl-setup
    
    # Copy the production config from project
    if [[ -f /var/www/handwerkos/nginx/erp.mrx3k1.de.conf ]]; then
        cp /var/www/handwerkos/nginx/erp.mrx3k1.de.conf /etc/nginx/sites-available/
        ln -sf /etc/nginx/sites-available/erp.mrx3k1.de.conf /etc/nginx/sites-enabled/
    else
        error "❌ Production Nginx configuration not found!"
    fi
    
    # Test configuration
    if nginx -t; then
        log "✅ Nginx configuration test passed"
        systemctl reload nginx
        log "✅ Nginx reloaded with SSL configuration"
    else
        error "❌ Nginx configuration test failed!"
    fi
}

# Verify SSL setup
verify_ssl() {
    log "🔍 Verifying SSL setup..."
    
    # Check certificate validity
    local cert_info=$(openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -text -noout)
    local expiry_date=$(echo "$cert_info" | grep "Not After" | cut -d: -f2-)
    
    info "📅 Certificate expires: $expiry_date"
    
    # Test HTTPS connection
    if curl -f -s "https://$DOMAIN" > /dev/null; then
        log "✅ HTTPS connection test passed"
    else
        error "❌ HTTPS connection test failed"
    fi
    
    # Test SSL certificate
    local ssl_check=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -subject)
    if [[ $ssl_check == *"$DOMAIN"* ]]; then
        log "✅ SSL certificate verification passed"
    else
        error "❌ SSL certificate verification failed"
    fi
    
    # Test security headers
    local security_headers=$(curl -s -I "https://$DOMAIN" | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options)")
    if [[ -n "$security_headers" ]]; then
        log "✅ Security headers configured"
    else
        warn "⚠️  Security headers not found"
    fi
    
    log "🎉 SSL setup verification completed"
}

# Renew certificate
renew_certificate() {
    log "🔄 Renewing SSL certificate..."
    
    if certbot renew --force-renewal; then
        systemctl reload nginx
        log "✅ Certificate renewed successfully"
    else
        error "❌ Certificate renewal failed"
    fi
}

# Show certificate information
show_certificate_info() {
    log "📋 Certificate Information:"
    
    if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
        error "❌ Certificate not found for $DOMAIN"
    fi
    
    # Certificate details
    openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -text -noout | grep -A2 "Subject:"
    openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -text -noout | grep -A2 "Not Before\|Not After"
    
    # Certificate chain verification
    openssl verify -CAfile "/etc/letsencrypt/live/$DOMAIN/chain.pem" "/etc/letsencrypt/live/$DOMAIN/cert.pem"
    
    # Show renewal information
    if [[ -f "/etc/letsencrypt/renewal/$DOMAIN.conf" ]]; then
        echo ""
        echo "Renewal Configuration:"
        cat "/etc/letsencrypt/renewal/$DOMAIN.conf"
    fi
}

# Backup certificates
backup_certificates() {
    log "💾 Backing up SSL certificates..."
    
    local backup_dir="/var/backups/ssl"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/ssl_backup_$timestamp.tar.gz"
    
    mkdir -p "$backup_dir"
    
    if tar -czf "$backup_file" -C /etc/letsencrypt live/ archive/ renewal/; then
        log "✅ SSL certificates backed up to: $backup_file"
    else
        error "❌ SSL certificate backup failed"
    fi
}

# Main function
main() {
    case "${1:-setup}" in
        "setup")
            log "🚀 Starting SSL certificate setup for $DOMAIN..."
            check_prerequisites
            setup_initial_nginx
            obtain_certificate
            setup_renewal
            apply_production_config
            verify_ssl
            log "🎉 SSL certificate setup completed successfully!"
            ;;
        "renew")
            renew_certificate
            verify_ssl
            ;;
        "verify")
            verify_ssl
            ;;
        "info")
            show_certificate_info
            ;;
        "backup")
            backup_certificates
            ;;
        "test")
            log "🧪 Testing SSL configuration..."
            verify_ssl
            certbot renew --dry-run
            ;;
        *)
            echo "Usage: $0 {setup|renew|verify|info|backup|test}"
            echo ""
            echo "Commands:"
            echo "  setup   - Complete SSL certificate setup (default)"
            echo "  renew   - Force certificate renewal"
            echo "  verify  - Verify SSL configuration"
            echo "  info    - Show certificate information"
            echo "  backup  - Backup SSL certificates"
            echo "  test    - Test SSL configuration and renewal"
            echo ""
            echo "Environment variables:"
            echo "  DOMAIN    - Domain name (default: erp.mrx3k1.de)"
            echo "  SSL_EMAIL - Email for Let's Encrypt (default: admin@mrx3k1.de)"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"