#!/bin/bash

# Berlinometer Daily Analytics Script
# This script runs the user analytics and generates daily reports

set -e

# Configuration
SCRIPT_DIR="/var/www/html/popular-times"
VENV_PATH="$SCRIPT_DIR/venv"
ANALYTICS_SCRIPT="$SCRIPT_DIR/analyze_users.py"
LOG_FILE="$SCRIPT_DIR/analytics.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

# Change to script directory
cd "$SCRIPT_DIR"

print_status "🚀 Starting Berlinometer Daily Analytics"

# Check if virtual environment exists
if [ ! -d "$VENV_PATH" ]; then
    print_error "Virtual environment not found at $VENV_PATH"
    exit 1
fi

# Activate virtual environment
source "$VENV_PATH/bin/activate"

# Install analytics dependencies if not already installed
print_status "📦 Installing analytics dependencies..."
# Chart.js is loaded via CDN - no matplotlib dependencies needed

# Check if analytics script exists
if [ ! -f "$ANALYTICS_SCRIPT" ]; then
    print_error "Analytics script not found at $ANALYTICS_SCRIPT"
    exit 1
fi

# Check if access log exists
if [ ! -f "$SCRIPT_DIR/access.log" ]; then
    print_warning "Access log not found. Creating empty log file."
    touch "$SCRIPT_DIR/access.log"
fi

# Run analytics
print_status "📊 Running user analytics..."
if python "$ANALYTICS_SCRIPT"; then
    print_status "✅ Analytics completed successfully!"
    
    # List generated files
    if [ -d "$SCRIPT_DIR/analytics/reports" ]; then
        LATEST_REPORT=$(ls -t "$SCRIPT_DIR/analytics/reports"/*.html 2>/dev/null | head -1)
        if [ -n "$LATEST_REPORT" ]; then
            print_status "📋 Latest report: $(basename "$LATEST_REPORT")"
        fi
    fi
    
    if [ -d "$SCRIPT_DIR/analytics/charts" ]; then
        CHART_COUNT=$(ls "$SCRIPT_DIR/analytics/charts"/*.png 2>/dev/null | wc -l)
        print_status "📈 Generated $CHART_COUNT chart(s)"
    fi
    
else
    print_error "❌ Analytics failed!"
    exit 1
fi

# Cleanup old files (keep last 30 days)
print_status "🧹 Cleaning up old files..."
find "$SCRIPT_DIR/analytics/reports" -name "*.html" -mtime +30 -delete 2>/dev/null || true
find "$SCRIPT_DIR/analytics/charts" -name "*.png" -mtime +30 -delete 2>/dev/null || true
find "$SCRIPT_DIR/analytics/data" -name "*.json" -mtime +30 -delete 2>/dev/null || true

print_status "🎉 Daily analytics completed!"
echo "" | tee -a "$LOG_FILE"

# Deactivate virtual environment
deactivate