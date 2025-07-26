#!/bin/bash

# Cicero Nginx Parser Health Check Script
# This script ensures the parser is always running and processing logs

LOG_FILE="/var/www/html/cicero/log-parser/logs/health-check.log"
PARSER_NAME="cicero-nginx-parser"
NGINX_LOG="/var/log/nginx/access.log"
TEST_URL="https://mrx3k1.de/cicero-health-check-$(date +%s)"
MAX_LOG_AGE_MINUTES=5

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Function to check if parser is running
check_parser_running() {
    pm2 list | grep -q "$PARSER_NAME.*online"
    return $?
}

# Function to check if parser is processing logs
check_parser_active() {
    # Get the last modified time of the parser log
    if [ -f "/var/www/html/cicero/log-parser/logs/nginx-parser-out-40.log" ]; then
        LAST_LOG_TIME=$(stat -c %Y "/var/www/html/cicero/log-parser/logs/nginx-parser-out-40.log")
        CURRENT_TIME=$(date +%s)
        TIME_DIFF=$((CURRENT_TIME - LAST_LOG_TIME))
        
        # If no activity for more than 5 minutes, consider it stuck
        if [ $TIME_DIFF -gt $((MAX_LOG_AGE_MINUTES * 60)) ]; then
            return 1
        fi
        return 0
    else
        return 1
    fi
}

# Function to restart the parser
restart_parser() {
    log_message "Restarting $PARSER_NAME..."
    pm2 restart "$PARSER_NAME" >> "$LOG_FILE" 2>&1
    sleep 5
}

# Function to generate test traffic
generate_test_traffic() {
    # Generate a test request to ensure there's traffic
    curl -s "$TEST_URL" -H "User-Agent: Cicero-Health-Check" > /dev/null 2>&1
}

# Main health check logic
log_message "Starting health check for $PARSER_NAME"

# Check if parser is running
if ! check_parser_running; then
    log_message "ERROR: $PARSER_NAME is not running! Starting it..."
    cd /var/www/html/cicero/log-parser && pm2 start ecosystem.config.js >> "$LOG_FILE" 2>&1
    sleep 5
    
    if ! check_parser_running; then
        log_message "CRITICAL: Failed to start $PARSER_NAME!"
        exit 1
    fi
    log_message "Successfully started $PARSER_NAME"
fi

# Check if nginx log exists and is writable
if [ ! -r "$NGINX_LOG" ]; then
    log_message "ERROR: Cannot read nginx log at $NGINX_LOG"
    exit 1
fi

# Generate test traffic to verify processing
NGINX_SIZE_BEFORE=$(stat -c %s "$NGINX_LOG")
generate_test_traffic
sleep 2
NGINX_SIZE_AFTER=$(stat -c %s "$NGINX_LOG")

# Check if nginx log grew (new entries)
if [ "$NGINX_SIZE_AFTER" -gt "$NGINX_SIZE_BEFORE" ]; then
    log_message "Nginx log is growing, checking parser activity..."
    
    # Give parser time to process
    sleep 3
    
    # Check if parser is actively processing
    if ! check_parser_active; then
        log_message "WARNING: Parser seems stuck, restarting..."
        restart_parser
        
        # Generate another test to verify it's working
        generate_test_traffic
        sleep 3
        
        if check_parser_active; then
            log_message "Parser successfully restarted and processing"
        else
            log_message "ERROR: Parser still not processing after restart!"
            # Force restart with delete/start
            pm2 delete "$PARSER_NAME" >> "$LOG_FILE" 2>&1
            cd /var/www/html/cicero/log-parser && pm2 start ecosystem.config.js >> "$LOG_FILE" 2>&1
            log_message "Performed force restart"
        fi
    else
        log_message "Parser is running and processing normally"
    fi
else
    log_message "INFO: No new nginx log entries"
fi

# Clean up old health check logs (keep last 1000 lines)
if [ $(wc -l < "$LOG_FILE") -gt 1000 ]; then
    tail -n 1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
    log_message "Cleaned up old log entries"
fi

log_message "Health check completed"
log_message "----------------------------------------"