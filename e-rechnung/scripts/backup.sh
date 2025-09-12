#!/bin/bash

# HandwerkOS Backup Script
# This script creates backups of the database and important files

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/www/handwerkos/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] BACKUP: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] BACKUP ERROR: $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] BACKUP WARNING: $1${NC}"
}

# Load environment variables
if [[ -f /var/www/handwerkos/.env.prod ]]; then
    export $(cat /var/www/handwerkos/.env.prod | grep -v '^#' | xargs)
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
backup_database() {
    log "🗄️  Starting database backup..."
    
    local db_backup_file="$BACKUP_DIR/handwerkos_db_$TIMESTAMP.sql"
    
    # Create database dump
    if docker exec handwerkos_postgres_prod pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$db_backup_file"; then
        # Compress the backup
        gzip "$db_backup_file"
        log "✅ Database backup completed: ${db_backup_file}.gz"
        
        # Verify backup integrity
        if ! gzip -t "${db_backup_file}.gz"; then
            error "❌ Database backup verification failed!"
        fi
        
        # Get backup size
        local backup_size=$(du -h "${db_backup_file}.gz" | cut -f1)
        log "💾 Database backup size: $backup_size"
        
    else
        error "❌ Database backup failed!"
    fi
}

# Files backup
backup_files() {
    log "📁 Starting files backup..."
    
    local files_backup_file="$BACKUP_DIR/handwerkos_files_$TIMESTAMP.tar.gz"
    local base_dir="/var/www/handwerkos"
    
    # Create files backup (uploads, logs, configurations)
    if tar -czf "$files_backup_file" \
        -C "$base_dir" \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='dist' \
        --exclude='.git' \
        --exclude='backups' \
        uploads/ \
        logs/ \
        .env.prod \
        ecosystem.config.js \
        nginx/ \
        docker-compose.prod.yml 2>/dev/null; then
        
        log "✅ Files backup completed: $files_backup_file"
        
        # Get backup size
        local backup_size=$(du -h "$files_backup_file" | cut -f1)
        log "💾 Files backup size: $backup_size"
        
    else
        error "❌ Files backup failed!"
    fi
}

# MinIO/S3 backup
backup_storage() {
    log "☁️  Starting MinIO storage backup..."
    
    local storage_backup_file="$BACKUP_DIR/handwerkos_storage_$TIMESTAMP.tar.gz"
    
    # Backup MinIO data
    if docker run --rm \
        --volumes-from handwerkos_minio_prod \
        -v "$BACKUP_DIR:/backup" \
        alpine tar -czf "/backup/handwerkos_storage_$TIMESTAMP.tar.gz" -C / data; then
        
        log "✅ Storage backup completed: $storage_backup_file"
        
        # Get backup size
        local backup_size=$(du -h "$storage_backup_file" | cut -f1)
        log "💾 Storage backup size: $backup_size"
        
    else
        warn "⚠️  Storage backup failed (non-critical)"
    fi
}

# SSL certificates backup
backup_ssl() {
    log "🔒 Starting SSL certificates backup..."
    
    local ssl_backup_file="$BACKUP_DIR/handwerkos_ssl_$TIMESTAMP.tar.gz"
    
    if [[ -d /etc/letsencrypt/live ]]; then
        if tar -czf "$ssl_backup_file" -C /etc/letsencrypt live/ archive/ renewal/; then
            log "✅ SSL certificates backup completed: $ssl_backup_file"
        else
            warn "⚠️  SSL certificates backup failed"
        fi
    else
        log "ℹ️  No SSL certificates found to backup"
    fi
}

# Configuration backup
backup_config() {
    log "⚙️  Starting configuration backup..."
    
    local config_backup_file="$BACKUP_DIR/handwerkos_config_$TIMESTAMP.tar.gz"
    
    # Backup Nginx configuration
    tar -czf "$config_backup_file" \
        -C /etc/nginx \
        sites-available/erp.mrx3k1.de.conf \
        2>/dev/null || warn "⚠️  Nginx config backup failed"
    
    # Add crontab to backup
    crontab -l > "$BACKUP_DIR/crontab_$TIMESTAMP.txt" 2>/dev/null || warn "⚠️  Crontab backup failed"
    
    log "✅ Configuration backup completed"
}

# Cleanup old backups
cleanup_old_backups() {
    log "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "handwerkos_*" -type f -mtime +$RETENTION_DAYS -print0)
    
    if [[ $deleted_count -gt 0 ]]; then
        log "🗑️  Deleted $deleted_count old backup files"
    else
        log "ℹ️  No old backups to delete"
    fi
}

# Create backup manifest
create_manifest() {
    log "📄 Creating backup manifest..."
    
    local manifest_file="$BACKUP_DIR/backup_manifest_$TIMESTAMP.txt"
    
    cat > "$manifest_file" << EOF
HandwerkOS Backup Manifest
Generated: $(date)
Hostname: $(hostname)
Backup Directory: $BACKUP_DIR

Files in this backup:
EOF
    
    # List all files created in this backup session
    find "$BACKUP_DIR" -name "*_$TIMESTAMP.*" -exec ls -lh {} \; >> "$manifest_file"
    
    # Calculate total backup size
    local total_size=$(find "$BACKUP_DIR" -name "*_$TIMESTAMP.*" -exec du -ch {} + | tail -1 | cut -f1)
    echo "Total Backup Size: $total_size" >> "$manifest_file"
    
    log "✅ Backup manifest created: $manifest_file"
}

# Send notification (if configured)
send_notification() {
    local status="$1"
    local message="$2"
    
    # Add your notification logic here
    # Examples: email, Slack webhook, Discord, etc.
    
    if [[ -n "$BACKUP_NOTIFICATION_EMAIL" ]]; then
        echo "$message" | mail -s "HandwerkOS Backup $status" "$BACKUP_NOTIFICATION_EMAIL" 2>/dev/null || true
    fi
    
    # Example Slack webhook (uncomment and configure)
    # if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
    #     curl -X POST -H 'Content-type: application/json' \
    #         --data "{\"text\":\"HandwerkOS Backup $status: $message\"}" \
    #         "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    # fi
}

# Main backup function
main() {
    local start_time=$(date +%s)
    log "🚀 Starting HandwerkOS backup process..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "❌ Docker is not running!"
    fi
    
    # Check if containers are running
    if ! docker ps | grep -q handwerkos_postgres_prod; then
        error "❌ HandwerkOS database container is not running!"
    fi
    
    # Perform backups
    backup_database
    backup_files
    backup_storage
    backup_ssl
    backup_config
    create_manifest
    cleanup_old_backups
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Calculate total backup size
    local total_size=$(find "$BACKUP_DIR" -name "*_$TIMESTAMP.*" -exec du -ch {} + | tail -1 | cut -f1)
    
    local success_message="Backup completed successfully in ${duration}s. Total size: $total_size"
    log "🎉 $success_message"
    
    # Send success notification
    send_notification "SUCCESS" "$success_message"
    
    # Display backup summary
    echo ""
    echo "📊 BACKUP SUMMARY"
    echo "================="
    echo "Timestamp: $TIMESTAMP"
    echo "Duration: ${duration} seconds"
    echo "Total Size: $total_size"
    echo "Backup Location: $BACKUP_DIR"
    echo ""
    echo "Files created:"
    find "$BACKUP_DIR" -name "*_$TIMESTAMP.*" -exec ls -lh {} \;
}

# Error handling
trap 'error "❌ Backup failed due to an error on line $LINENO"' ERR

# Handle script arguments
case "${1:-main}" in
    "main"|"")
        main
        ;;
    "database")
        backup_database
        ;;
    "files")
        backup_files
        ;;
    "storage")
        backup_storage
        ;;
    "ssl")
        backup_ssl
        ;;
    "config")
        backup_config
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "test")
        log "🧪 Running backup test..."
        # Test database connection
        docker exec handwerkos_postgres_prod pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
        log "✅ Database connection test passed"
        ;;
    *)
        echo "Usage: $0 {main|database|files|storage|ssl|config|cleanup|test}"
        echo ""
        echo "Commands:"
        echo "  main      - Full backup (default)"
        echo "  database  - Database only"
        echo "  files     - Files only"
        echo "  storage   - MinIO storage only"
        echo "  ssl       - SSL certificates only"
        echo "  config    - Configuration files only"
        echo "  cleanup   - Remove old backups only"
        echo "  test      - Test backup prerequisites"
        exit 1
        ;;
esac