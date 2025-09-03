# Fix Owner Names - Deployment Instructions

## Problem Summary

The transfer page was showing "USR-16F9B5C3" instead of real owner names like "Alexander König" because:
1. Products created via API didn't include the `owner.name` field structure
2. Transfer API was trying to access `product.owner?.name` which returned `null`

## Solution Implemented

### 1. Backend API Fixes (server.js)

**Product Creation API** (Line 332-337):
- Now sets initial `owner` structure when creating products
- Uses `metadata.owner`, `owner.name`, or defaults to 'KiezForm Berlin'

**Transfer API** (Lines 829-845):
- Multi-source fallback for owner names:
  1. `product.owner?.name` (preferred)
  2. `product.metadata?.owner` (fallback)
  3. Latest blockchain block metadata (historical)
  4. 'Alexander König' (default for existing products)

### 2. Database Migration

Two scripts provided to fix existing products:

#### Option A: Node.js Script
```bash
node migration-fix-owner-names.js
```

#### Option B: MongoDB Shell Script  
```bash
mongosh kiezform < fix-owner-names.mongodb
```

## Deployment Steps

### Step 1: Deploy Backend Code
```bash
# Copy server.js to production VPS (requires SSH access)
scp backend/server.js user@69.62.121.168:/path/to/kiezform/backend/
```

### Step 2: Restart Backend Service
```bash
# On VPS, restart the backend service
pm2 restart kiezform-api
# OR
systemctl restart kiezform-backend
```

### Step 3: Run Database Migration
```bash
# On VPS, navigate to backend directory
cd /path/to/kiezform/backend/

# Option A: Run Node.js migration script
npm install mongoose  # if not already installed
node migration-fix-owner-names.js

# Option B: Run MongoDB shell script
mongosh kiezform < fix-owner-names.mongodb
```

### Step 4: Verify Fix
1. Open transfer page: https://kiezform.de/transfer.html?token=YOUR_TOKEN
2. Check that real owner name appears instead of USR pseudonym
3. Test with multiple products to ensure consistency

## Migration Script Details

The migration updates products with this logic:
1. Find products missing `owner.name` field
2. Set `owner.name` from `metadata.owner` if available
3. Default to 'Alexander König' for existing products
4. Set `owner.email` to `null`
5. Set `owner.registrationDate` to product creation date

## Expected Results

**Before Fix:**
```
Aktueller Eigentümer: USR-16F9B5C3
```

**After Fix:**
```
Aktueller Eigentümer: Alexander König
```

## Rollback Plan

If issues occur, restore from backup:
```bash
# Restore server.js backup
cp server.js.backup server.js
pm2 restart kiezform-api

# Restore database (if backup available)
mongorestore --db kiezform /path/to/backup
```

## Testing Commands

Verify fix with API calls:
```bash
# Check product has owner structure
curl "https://kiezform.de/api/verify/PRODUCT_ID" | jq '.owner'

# Check transfer API returns real name
curl "https://kiezform.de/api/transfer/TOKEN" | jq '.fromOwnerName'
```

## Files Modified

- `/backend/server.js` - Lines 332-337, 829-845, 881-889
- `/migration-fix-owner-names.js` - New migration script
- `/fix-owner-names.mongodb` - New MongoDB shell script

## Monitoring

After deployment, monitor:
1. Transfer page displays real owner names
2. No API errors in backend logs
3. Database queries return expected owner data
4. New products created with proper owner structure