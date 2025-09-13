#!/bin/bash

# Universal User Tracking Installation Script
# Installs the complete analytics system (access logging + Chart.js reports) for any web app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${PURPLE}============================================${NC}"
    echo -e "${PURPLE}🔧 Universal User Tracking Installer${NC}"
    echo -e "${PURPLE}============================================${NC}\n"
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_question() {
    echo -e "${CYAN}[QUESTION]${NC} $1"
}

# Configuration variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/tracking-templates"
TARGET_DIR=""
APP_NAME=""
APP_TYPE=""
SERVER_FILE=""
ANALYTICS_ENABLED="true"
CRON_ENABLED="false"

# Create templates directory if it doesn't exist
mkdir -p "$TEMPLATE_DIR"

detect_app_type() {
    local dir="$1"
    
    if [[ -f "$dir/server.py" ]] || [[ -f "$dir/app.py" ]] || [[ -f "$dir/main.py" ]]; then
        echo "python-flask"
    elif [[ -f "$dir/server.js" ]] || [[ -f "$dir/app.js" ]] || [[ -f "$dir/index.js" ]]; then
        echo "node-express"
    elif [[ -f "$dir/package.json" ]] && grep -q "react" "$dir/package.json" 2>/dev/null; then
        echo "react"
    elif [[ -f "$dir/index.html" ]]; then
        echo "static"
    else
        echo "unknown"
    fi
}

detect_server_file() {
    local dir="$1"
    local app_type="$2"
    
    case $app_type in
        "python-flask")
            if [[ -f "$dir/server.py" ]]; then
                echo "server.py"
            elif [[ -f "$dir/app.py" ]]; then
                echo "app.py"
            elif [[ -f "$dir/main.py" ]]; then
                echo "main.py"
            fi
            ;;
        "node-express")
            if [[ -f "$dir/server.js" ]]; then
                echo "server.js"
            elif [[ -f "$dir/app.js" ]]; then
                echo "app.js"
            elif [[ -f "$dir/index.js" ]]; then
                echo "index.js"
            fi
            ;;
        *)
            echo ""
            ;;
    esac
}

interactive_setup() {
    print_header
    
    # Get target directory
    print_question "Enter the path to your web application directory:"
    read -r TARGET_DIR
    
    if [[ ! -d "$TARGET_DIR" ]]; then
        print_error "Directory does not exist: $TARGET_DIR"
        exit 1
    fi
    
    TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"  # Get absolute path
    print_status "Target directory: $TARGET_DIR"
    
    # Detect app type
    local detected_type=$(detect_app_type "$TARGET_DIR")
    print_status "Detected app type: $detected_type"
    
    # Confirm or choose app type
    print_question "Select application type:"
    echo "1) Python Flask Server"
    echo "2) Node.js Express Server"
    echo "3) React Application"
    echo "4) Static HTML Application"
    echo "5) Custom/Other"
    
    read -r -p "Choice (1-5) [detected: $detected_type]: " choice
    
    case $choice in
        1) APP_TYPE="python-flask" ;;
        2) APP_TYPE="node-express" ;;
        3) APP_TYPE="react" ;;
        4) APP_TYPE="static" ;;
        5) APP_TYPE="custom" ;;
        "") APP_TYPE="$detected_type" ;;
        *) print_error "Invalid choice"; exit 1 ;;
    esac
    
    print_status "App type: $APP_TYPE"
    
    # Get app name
    local default_name=$(basename "$TARGET_DIR")
    print_question "Enter application name [$default_name]:"
    read -r APP_NAME
    APP_NAME="${APP_NAME:-$default_name}"
    
    # Detect server file
    if [[ "$APP_TYPE" == "python-flask" ]] || [[ "$APP_TYPE" == "node-express" ]]; then
        local detected_server=$(detect_server_file "$TARGET_DIR" "$APP_TYPE")
        
        if [[ -n "$detected_server" ]]; then
            print_status "Detected server file: $detected_server"
            print_question "Server file name [$detected_server]:"
            read -r SERVER_FILE
            SERVER_FILE="${SERVER_FILE:-$detected_server}"
        else
            print_question "Enter server file name (e.g., server.py, app.js):"
            read -r SERVER_FILE
        fi
    fi
    
    # Analytics options
    print_question "Enable daily analytics reports with Chart.js? (y/N):"
    read -r -p "" enable_analytics
    if [[ "$enable_analytics" =~ ^[Yy]$ ]]; then
        ANALYTICS_ENABLED="true"
        
        print_question "Setup daily cron job for analytics? (y/N):"
        read -r -p "" enable_cron
        if [[ "$enable_cron" =~ ^[Yy]$ ]]; then
            CRON_ENABLED="true"
        fi
    else
        ANALYTICS_ENABLED="false"
    fi
    
    # Summary
    echo -e "\n${BLUE}Installation Summary:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📁 Target Directory: $TARGET_DIR"
    echo "🏷️  App Name: $APP_NAME"
    echo "🔧 App Type: $APP_TYPE"
    [[ -n "$SERVER_FILE" ]] && echo "📄 Server File: $SERVER_FILE"
    echo "📊 Analytics: $ANALYTICS_ENABLED"
    echo "⏰ Cron Job: $CRON_ENABLED"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    print_question "Proceed with installation? (y/N):"
    read -r -p "" confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        print_warning "Installation cancelled"
        exit 0
    fi
}

install_python_flask_tracking() {
    print_status "Installing Python Flask tracking module..."
    
    local tracking_code="# User Tracking Module - Auto-generated by install_user_tracking.sh
import os
import requests
from datetime import datetime
from flask import request

# Geolocation cache to avoid repeated API calls
geolocation_cache = {}

def get_geolocation(ip):
    \"\"\"Get geolocation info for IP address using ipapi.co\"\"\"
    # Skip private/local IPs
    if ip in ['unknown', '127.0.0.1', 'localhost'] or ip.startswith('192.168.') or ip.startswith('10.'):
        return 'Local', 'Local'
    
    # Check cache first
    if ip in geolocation_cache:
        return geolocation_cache[ip]
    
    try:
        # Use ipapi.co free API (30k requests/month)
        response = requests.get(f\"https://ipapi.co/{ip}/json/\", timeout=2)
        if response.status_code == 200:
            data = response.json()
            country = data.get('country_name', 'unknown')
            city = data.get('city', 'unknown')
            
            # Cache the result
            geolocation_cache[ip] = (country, city)
            return country, city
        else:
            print(f\"Geolocation API failed for {ip}: {response.status_code}\")
            return 'unknown', 'unknown'
            
    except Exception as e:
        print(f\"Geolocation lookup failed for {ip}: {e}\")
        return 'unknown', 'unknown'

def log_access(endpoint):
    \"\"\"Log access to endpoints with timestamp, IP, and geolocation info\"\"\"
    try:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
        user_agent = request.headers.get('User-Agent', 'unknown')
        
        # Clean up IP (remove port if present)
        if ',' in client_ip:
            client_ip = client_ip.split(',')[0].strip()
        if ':' in client_ip and not client_ip.startswith('['):  # IPv4 with port
            client_ip = client_ip.split(':')[0]
        
        # Try to get geolocation info from headers first (Cloudflare)
        country = request.headers.get('CF-IPCountry', None)
        city = request.headers.get('CF-IPCity', None)
        
        # If not available from headers, use IP geolocation API
        if not country or country == 'unknown':
            country, city = get_geolocation(client_ip)
        
        log_entry = f\"{timestamp} | {client_ip} | {country} | {city} | {endpoint} | {user_agent}\\n\"
        
        # Write to access log file
        script_dir = os.path.dirname(os.path.abspath(__file__))
        log_file = os.path.join(script_dir, 'access.log')
        
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(log_entry)
            
        print(f\"📊 Access: {client_ip} ({country}, {city}) -> {endpoint}\")
        
    except Exception as e:
        print(f\"Error logging access: {e}\")"
    
    # Create tracking module file
    echo "$tracking_code" > "$TARGET_DIR/user_tracking.py"
    
    # Add import and usage to server file
    local server_path="$TARGET_DIR/$SERVER_FILE"
    if [[ -f "$server_path" ]]; then
        # Check if tracking is already installed
        if grep -q "from user_tracking import log_access" "$server_path" 2>/dev/null; then
            print_warning "Tracking already installed in $SERVER_FILE"
        else
            print_status "Adding tracking imports to $SERVER_FILE..."
            
            # Add import after existing imports
            sed -i '1i from user_tracking import log_access' "$server_path"
            
            print_status "✅ Tracking module installed"
            print_warning "⚠️  Manual step required: Add log_access('endpoint-name') calls to your routes"
            print_status "Example: log_access('api-endpoint') at the start of route functions"
        fi
    else
        print_error "Server file not found: $server_path"
    fi
}

install_nodejs_tracking() {
    print_status "Installing Node.js Express tracking module..."
    
    local tracking_code="// User Tracking Module - Auto-generated by install_user_tracking.sh
const fs = require('fs');
const path = require('path');

function logAccess(endpoint) {
    return (req, res, next) => {
        try {
            const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
            const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            
            // Try to get geolocation info from headers (if available from proxy)
            const country = req.headers['cf-ipcountry'] || 'unknown';  // Cloudflare
            const city = req.headers['cf-ipcity'] || 'unknown';        // Cloudflare
            
            const logEntry = \`\${timestamp} | \${clientIp} | \${country} | \${city} | \${endpoint} | \${userAgent}\\n\`;
            
            // Write to access log file
            const logFile = path.join(__dirname, 'access.log');
            fs.appendFileSync(logFile, logEntry, 'utf8');
            
            console.log(\`📊 Access: \${clientIp} -> \${endpoint}\`);
            
        } catch (error) {
            console.error('Error logging access:', error);
        }
        
        next();
    };
}

module.exports = { logAccess };"
    
    # Create tracking module file
    echo "$tracking_code" > "$TARGET_DIR/user_tracking.js"
    
    # Add require to server file
    local server_path="$TARGET_DIR/$SERVER_FILE"
    if [[ -f "$server_path" ]]; then
        # Check if tracking is already installed
        if grep -q "require('./user_tracking')" "$server_path" 2>/dev/null; then
            print_warning "Tracking already installed in $SERVER_FILE"
        else
            print_status "Adding tracking require to $SERVER_FILE..."
            
            # Add require after existing requires
            sed -i '1i const { logAccess } = require('"'"'./user_tracking'"'"');' "$server_path"
            
            print_status "✅ Tracking module installed"
            print_warning "⚠️  Manual step required: Add logAccess('endpoint-name') middleware to your routes"
            print_status "Example: app.get('/api/data', logAccess('api-data'), (req, res) => { ... })"
        fi
    else
        print_error "Server file not found: $server_path"
    fi
}

install_analytics_system() {
    if [[ "$ANALYTICS_ENABLED" != "true" ]]; then
        return
    fi
    
    print_status "Installing Chart.js analytics system..."
    
    # Copy analytics script
    cp "$SCRIPT_DIR/analyze_users.py" "$TARGET_DIR/"
    
    # Create custom analytics script
    local analytics_script="$TARGET_DIR/analyze_users.py"
    
    # Update app name in analytics script
    sed -i "s/Berlinometer/$APP_NAME/g" "$analytics_script"
    
    # Create run script
    local run_script="$TARGET_DIR/run_analytics.sh"
    
    cat > "$run_script" << EOF
#!/bin/bash

# $APP_NAME Daily Analytics Script
# This script runs the user analytics and generates daily reports

set -e

# Configuration
SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
ANALYTICS_SCRIPT="\$SCRIPT_DIR/analyze_users.py"
LOG_FILE="\$SCRIPT_DIR/analytics.log"

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

print_status() {
    echo -e "\${GREEN}[\$(date '+%Y-%m-%d %H:%M:%S')]\${NC} \$1" | tee -a "\$LOG_FILE"
}

print_warning() {
    echo -e "\${YELLOW}[\$(date '+%Y-%m-%d %H:%M:%S')]\${NC} \$1" | tee -a "\$LOG_FILE"
}

print_error() {
    echo -e "\${RED}[\$(date '+%Y-%m-%d %H:%M:%S')]\${NC} \$1" | tee -a "\$LOG_FILE"
}

# Change to script directory
cd "\$SCRIPT_DIR"

print_status "🚀 Starting $APP_NAME Daily Analytics"

# Check if analytics script exists
if [ ! -f "\$ANALYTICS_SCRIPT" ]; then
    print_error "Analytics script not found at \$ANALYTICS_SCRIPT"
    exit 1
fi

# Check if access log exists
if [ ! -f "\$SCRIPT_DIR/access.log" ]; then
    print_warning "Access log not found. Creating empty log file."
    touch "\$SCRIPT_DIR/access.log"
fi

# Run analytics
print_status "📊 Running user analytics..."
if python3 "\$ANALYTICS_SCRIPT"; then
    print_status "✅ Analytics completed successfully!"
    
    # List generated files
    if [ -d "\$SCRIPT_DIR/analytics/reports" ]; then
        LATEST_REPORT=\$(ls -t "\$SCRIPT_DIR/analytics/reports"/*.html 2>/dev/null | head -1)
        if [ -n "\$LATEST_REPORT" ]; then
            print_status "📋 Latest report: \$(basename "\$LATEST_REPORT")"
        fi
    fi
    
else
    print_error "❌ Analytics failed!"
    exit 1
fi

# Cleanup old files (keep last 30 days)
print_status "🧹 Cleaning up old files..."
find "\$SCRIPT_DIR/analytics/reports" -name "*.html" -mtime +30 -delete 2>/dev/null || true
find "\$SCRIPT_DIR/analytics/data" -name "*.json" -mtime +30 -delete 2>/dev/null || true

print_status "🎉 Daily analytics completed!"
echo "" | tee -a "\$LOG_FILE"
EOF
    
    chmod +x "$run_script"
    
    print_status "✅ Analytics system installed"
}

setup_cron_job() {
    if [[ "$CRON_ENABLED" != "true" ]]; then
        return
    fi
    
    print_status "Setting up daily cron job..."
    
    local cron_time="0 3 * * *"  # 3:00 AM daily
    local cron_command="$TARGET_DIR/run_analytics.sh >> $TARGET_DIR/analytics.log 2>&1"
    local cron_entry="# $APP_NAME Daily Analytics - 3:00 AM"
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$cron_entry"; echo "$cron_time $cron_command") | crontab -
    
    print_status "✅ Cron job installed (runs daily at 3:00 AM)"
}

create_readme() {
    local readme_file="$TARGET_DIR/USER_TRACKING_README.md"
    
    cat > "$readme_file" << EOF
# User Tracking System - $APP_NAME

This directory now includes a complete user tracking and analytics system.

## 📊 What was installed:

### 1. Access Logging
- **File**: \`user_tracking.py\` (Python) or \`user_tracking.js\` (Node.js)
- **Purpose**: Logs user visits with timestamp, IP, country, endpoint, and user agent
- **Log file**: \`access.log\`

### 2. Analytics System (Chart.js)
- **Script**: \`analyze_users.py\`
- **Purpose**: Processes access logs and generates interactive HTML reports
- **Output**: \`analytics/reports/\` directory
- **Charts**: Interactive Chart.js visualizations

### 3. Automation
- **Script**: \`run_analytics.sh\`
- **Purpose**: Daily analytics processing with logging
- **Cron**: $(if [[ "$CRON_ENABLED" == "true" ]]; then echo "✅ Configured (3:00 AM daily)"; else echo "❌ Not configured"; fi)

## 🚀 Usage:

### Manual Analytics Run:
\`\`\`bash
./run_analytics.sh
\`\`\`

### View Reports:
Open files in \`analytics/reports/\` in your browser

### Add Tracking to Routes:

$(if [[ "$APP_TYPE" == "python-flask" ]]; then
cat << 'PYTHON_EXAMPLE'
**Python Flask:**
```python
from user_tracking import log_access

@app.route('/api/data')
def api_data():
    log_access('api-data')  # Add this line
    return jsonify({"data": "example"})
```
PYTHON_EXAMPLE
elif [[ "$APP_TYPE" == "node-express" ]]; then
cat << 'NODE_EXAMPLE'
**Node.js Express:**
```javascript
const { logAccess } = require('./user_tracking');

app.get('/api/data', logAccess('api-data'), (req, res) => {
    res.json({"data": "example"});
});
```
NODE_EXAMPLE
fi)

## 📁 File Structure:
\`\`\`
$APP_NAME/
├── user_tracking.$(if [[ "$APP_TYPE" == "python-flask" ]]; then echo "py"; else echo "js"; fi)           # Tracking module
├── analyze_users.py        # Analytics processor
├── run_analytics.sh        # Analytics runner
├── access.log              # User access logs
├── analytics.log           # Analytics processing logs
└── analytics/              # Generated reports
    ├── reports/            # HTML reports
    ├── charts/             # (unused - charts embedded in HTML)
    └── data/               # JSON analytics data
\`\`\`

## 🔧 Configuration:
- **App Name**: $APP_NAME
- **App Type**: $APP_TYPE
- **Analytics**: $(if [[ "$ANALYTICS_ENABLED" == "true" ]]; then echo "✅ Enabled"; else echo "❌ Disabled"; fi)
- **Cron Job**: $(if [[ "$CRON_ENABLED" == "true" ]]; then echo "✅ Enabled"; else echo "❌ Disabled"; fi)

---
Generated by Universal User Tracking Installer
EOF
    
    print_status "📝 Created documentation: USER_TRACKING_README.md"
}

main() {
    interactive_setup
    
    echo -e "\n${BLUE}🔧 Starting Installation...${NC}\n"
    
    # Install tracking based on app type
    case $APP_TYPE in
        "python-flask")
            install_python_flask_tracking
            ;;
        "node-express")
            install_nodejs_tracking
            ;;
        "react"|"static"|"custom")
            print_warning "For $APP_TYPE apps, manual integration required"
            print_status "Access logging templates created in: $TEMPLATE_DIR"
            ;;
    esac
    
    # Install analytics system
    install_analytics_system
    
    # Setup cron job
    setup_cron_job
    
    # Create documentation
    create_readme
    
    echo -e "\n${GREEN}🎉 Installation Complete!${NC}\n"
    
    print_status "📋 Next Steps:"
    if [[ "$APP_TYPE" == "python-flask" ]] || [[ "$APP_TYPE" == "node-express" ]]; then
        echo "   1. Add log_access() calls to your route handlers"
        echo "   2. Restart your server"
    fi
    if [[ "$ANALYTICS_ENABLED" == "true" ]]; then
        echo "   3. Run ./run_analytics.sh to generate first report"
        echo "   4. Check analytics/reports/ for HTML reports"
    fi
    echo "   5. Read USER_TRACKING_README.md for full documentation"
    
    print_status "🔗 Integration examples and docs: $TARGET_DIR/USER_TRACKING_README.md"
}

# Run main function
main "$@"