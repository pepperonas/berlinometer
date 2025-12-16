#!/bin/bash

# ============================================================================
# SAFE DEPLOYMENT SCRIPT FOR BERLINOMETER.DE
# ============================================================================
# This script safely deploys ONLY frontend files without touching backend
#
# Author: Claude Code
# Last Updated: 2025-11-10
#
# CRITICAL LEARNING:
# - NEVER use rsync --delete with mixed frontend/backend deployment
# - ALWAYS use whitelist approach (only copy what's needed)
# - ALWAYS backup before deployment
# - ALWAYS verify after deployment
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="root@69.62.121.168"
VPS_PATH="/var/www/html/popular-times"
LOCAL_BUILD_DIR="./build"
BACKUP_DIR="$VPS_PATH/deployment-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Frontend files to deploy (WHITELIST APPROACH)
FRONTEND_FILES=(
  "index.html"
  "manifest.json"
  "sw.js"
  "vite.svg"
  "favicon.ico"
  "favicon-16x16.png"
  "favicon-32x32.png"
  "apple-touch-icon.png"
  "android-chrome-192x192.png"
  "android-chrome-512x512.png"
  "popular-times.jpg"
  "default-locations.csv"
  "assets/"
)

# Backend files to NEVER touch (PROTECTION LIST)
PROTECTED_FILES=(
  "server.py"
  "requirements.txt"
  "schedule_scraper.sh"
  "run_scraper.sh"
  "process_json_to_db.py"
  "gmaps-scraper-fast-robust.py"
  "run_analytics.sh"
  "venv/"
  "analytics/"
  "popular-times-scrapings/"
  "maps-playwrite-scraper/"
  "*.db"
  "*.log"
  "__pycache__/"
)

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   BERLINOMETER SAFE DEPLOYMENT SCRIPT             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check if build directory exists
echo -e "${YELLOW}[1/7] Checking local build directory...${NC}"
if [ ! -d "$LOCAL_BUILD_DIR" ]; then
    echo -e "${RED}❌ Build directory not found: $LOCAL_BUILD_DIR${NC}"
    echo -e "${YELLOW}Please run: npm run build${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build directory found${NC}"
echo ""

# Step 2: Verify all frontend files exist
echo -e "${YELLOW}[2/7] Verifying frontend files...${NC}"
MISSING_FILES=()
for file in "${FRONTEND_FILES[@]}"; do
    if [[ "$file" == */ ]]; then
        # Directory check
        if [ ! -d "$LOCAL_BUILD_DIR/${file}" ]; then
            MISSING_FILES+=("$file")
        fi
    else
        # File check
        if [ ! -f "$LOCAL_BUILD_DIR/${file}" ]; then
            MISSING_FILES+=("$file")
        fi
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing files in build:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    exit 1
fi
echo -e "${GREEN}✅ All frontend files verified${NC}"
echo ""

# Step 3: Create backup on VPS
echo -e "${YELLOW}[3/7] Creating backup on VPS...${NC}"
ssh $VPS_HOST "mkdir -p $BACKUP_DIR/frontend-$TIMESTAMP"

# Backup only frontend files
for file in "${FRONTEND_FILES[@]}"; do
    ssh $VPS_HOST "if [ -e $VPS_PATH/$file ]; then cp -r $VPS_PATH/$file $BACKUP_DIR/frontend-$TIMESTAMP/; fi" 2>/dev/null || true
done

echo -e "${GREEN}✅ Backup created: $BACKUP_DIR/frontend-$TIMESTAMP${NC}"
echo ""

# Step 4: Verify protected files are NOT in build directory
echo -e "${YELLOW}[4/7] Verifying protected files are not being deployed...${NC}"
CONFLICT_FILES=()
for file in "${PROTECTED_FILES[@]}"; do
    if [[ "$file" == *\* ]]; then
        continue  # Skip wildcards
    fi
    if [ -e "$LOCAL_BUILD_DIR/$file" ]; then
        CONFLICT_FILES+=("$file")
    fi
done

if [ ${#CONFLICT_FILES[@]} -gt 0 ]; then
    echo -e "${RED}⚠️  WARNING: Protected files found in build directory:${NC}"
    for file in "${CONFLICT_FILES[@]}"; do
        echo "  - $file"
    done
    echo -e "${RED}This should NEVER happen. Aborting deployment.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ No conflicts detected${NC}"
echo ""

# Step 5: Clean old JavaScript bundles
echo -e "${YELLOW}[5/8] Cleaning old JavaScript bundles...${NC}"
ssh $VPS_HOST "find $VPS_PATH/assets/ -name 'index-*.js' -type f -delete 2>/dev/null || true"
echo -e "${GREEN}✅ Old bundles cleaned${NC}"
echo ""

# Step 6: Deploy frontend files (WHITELIST ONLY)
echo -e "${YELLOW}[6/8] Deploying frontend files...${NC}"
for file in "${FRONTEND_FILES[@]}"; do
    echo "  → Copying $file..."
    if [[ "$file" == */ ]]; then
        # Directory
        rsync -av "$LOCAL_BUILD_DIR/$file" "$VPS_HOST:$VPS_PATH/"
    else
        # File
        rsync -av "$LOCAL_BUILD_DIR/$file" "$VPS_HOST:$VPS_PATH/"
    fi
done
echo -e "${GREEN}✅ Frontend files deployed${NC}"
echo ""

# Step 7: Verify deployment
echo -e "${YELLOW}[7/8] Verifying deployment...${NC}"

# Check website loads
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' https://berlinometer.de/)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Website loads (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Website error (HTTP $HTTP_CODE)${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    ssh $VPS_HOST "cp -r $BACKUP_DIR/frontend-$TIMESTAMP/* $VPS_PATH/"
    exit 1
fi

# Check critical backend files still exist
echo "  → Checking protected files..."
MISSING_PROTECTED=()
for file in "server.py" "schedule_scraper.sh" "run_scraper.sh" "venv/"; do
    if ! ssh $VPS_HOST "[ -e $VPS_PATH/$file ]"; then
        MISSING_PROTECTED+=("$file")
    fi
done

if [ ${#MISSING_PROTECTED[@]} -gt 0 ]; then
    echo -e "${RED}❌ CRITICAL: Protected files missing after deployment!${NC}"
    for file in "${MISSING_PROTECTED[@]}"; do
        echo "  - $file"
    done
    echo -e "${YELLOW}Rolling back...${NC}"
    ssh $VPS_HOST "cp -r $BACKUP_DIR/frontend-$TIMESTAMP/* $VPS_PATH/"
    exit 1
fi

echo -e "${GREEN}✅ All protected files intact${NC}"
echo ""

# Step 8: Cleanup old backups (keep last 10)
echo -e "${YELLOW}[8/8] Cleaning up old backups...${NC}"
ssh $VPS_HOST "cd $BACKUP_DIR && ls -t | tail -n +11 | xargs -r rm -rf"
echo -e "${GREEN}✅ Old backups cleaned${NC}"
echo ""

# Final summary
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           DEPLOYMENT SUCCESSFUL! ✅                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
echo -e "${GREEN}✅ Backend files untouched${NC}"
echo -e "${GREEN}✅ Backup available at: $BACKUP_DIR/frontend-$TIMESTAMP${NC}"
echo -e "${GREEN}✅ Website verified: https://berlinometer.de${NC}"
echo ""
echo -e "${BLUE}Next scraping in 20-30 minutes (automatic)${NC}"
echo ""

# Display rollback command
echo -e "${YELLOW}💡 To rollback this deployment:${NC}"
echo "   ssh $VPS_HOST 'cp -r $BACKUP_DIR/frontend-$TIMESTAMP/* $VPS_PATH/'"
echo ""
