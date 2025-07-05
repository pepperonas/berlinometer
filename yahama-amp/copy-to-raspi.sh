#!/bin/bash

# Script to copy Yamaha Receiver App files to Raspberry Pi
# Usage: ./copy-to-raspi.sh [raspberry-pi-ip] [username]

set -e

# Configuration
RASPI_IP="${1:-192.168.1.100}"  # Default IP, can be overridden
RASPI_USER="${2:-pi}"           # Default username, can be overridden
APP_DIR="yahama-amp"
LOCAL_DIR="$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "🚀 Yamaha Receiver App - Copy to Raspberry Pi"
echo "=============================================="
echo "Target: $RASPI_USER@$RASPI_IP"
echo ""

# Check if we can reach the Raspberry Pi
print_step "Testing connection to Raspberry Pi..."
if ! ping -c 1 "$RASPI_IP" &> /dev/null; then
    print_error "Cannot reach Raspberry Pi at $RASPI_IP"
    echo "Please check:"
    echo "1. Raspberry Pi IP address is correct"
    echo "2. Raspberry Pi is powered on and connected to network"
    echo "3. SSH is enabled on Raspberry Pi"
    exit 1
fi
print_success "Raspberry Pi is reachable"

# Test SSH connection
print_step "Testing SSH connection..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$RASPI_USER@$RASPI_IP" exit &> /dev/null; then
    print_warning "SSH connection failed. You may need to:"
    echo "1. Enable SSH on Raspberry Pi: sudo systemctl enable ssh"
    echo "2. Set up SSH keys: ssh-copy-id $RASPI_USER@$RASPI_IP"
    echo "3. Or use password authentication"
    echo ""
    echo "Continuing anyway - you'll be prompted for password..."
fi

# Create directory on Raspberry Pi
print_step "Creating app directory on Raspberry Pi..."
ssh "$RASPI_USER@$RASPI_IP" "mkdir -p ~/$APP_DIR"
print_success "Directory created"

# Copy files
print_step "Copying application files..."

# Copy main files
files_to_copy=(
    "package.json"
    "server.js"
    "index.html"
    "index-advanced.html"
    "deploy-raspi.sh"
    "README.md"
)

for file in "${files_to_copy[@]}"; do
    if [ -f "$LOCAL_DIR/$file" ]; then
        echo "  📄 Copying $file..."
        scp "$LOCAL_DIR/$file" "$RASPI_USER@$RASPI_IP:~/$APP_DIR/"
    else
        print_warning "File $file not found, skipping..."
    fi
done

print_success "Files copied successfully"

# Make deployment script executable
print_step "Making deployment script executable..."
ssh "$RASPI_USER@$RASPI_IP" "chmod +x ~/$APP_DIR/deploy-raspi.sh"
print_success "Deployment script ready"

print_success "All files copied to Raspberry Pi!"
echo ""
echo "🎯 Next steps:"
echo "=============="
echo "1. SSH to your Raspberry Pi:"
echo "   ssh $RASPI_USER@$RASPI_IP"
echo ""
echo "2. Navigate to the app directory:"
echo "   cd ~/$APP_DIR"
echo ""
echo "3. Run the deployment script:"
echo "   ./deploy-raspi.sh"
echo ""
echo "4. Access your app at:"
echo "   http://$RASPI_IP:5001"
echo ""
echo -e "${GREEN}🚀 Ready to deploy on Raspberry Pi!${NC}"