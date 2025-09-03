# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KiezForm is an e-commerce and product verification system for a Berlin-based 3D-printed jewelry brand. The project combines a static frontend website with a complete backend API for product verification, blockchain-based ownership tracking, and admin management.

**Current Version**: v0.0.13 - Transfer System fully operational, all E11000 errors resolved, real owner names displayed throughout admin interface.

## Common Development Commands

### Frontend Development
```bash
# Serve static files (no build process required)
python -m http.server 8000
# or
npx serve .
```

### Full Stack Development
```bash
# Backend setup (first time)
cd backend
npm install
node init-admin.js  # Creates admin user

# Start backend API
npm start  # Production mode on port 3000
npm run dev  # Development mode with nodemon

# MongoDB required - ensure it's running
brew services start mongodb-community  # macOS
```

### Production Deployment
```bash
# PM2 process management on VPS (69.62.121.168)
pm2 start backend/ecosystem.config.js
pm2 status kiezform-api
pm2 logs kiezform-api --lines 20
pm2 restart kiezform-api

# Direct deployment from MacBook (established workflow)
rsync -avz backend/server.js root@69.62.121.168:/var/www/html/kiezform/backend/
rsync -avz js/admin.js root@69.62.121.168:/var/www/html/kiezform/js/
ssh root@69.62.121.168 "cd /var/www/html/kiezform/backend && pm2 restart kiezform-api"
```

### Critical Database Configuration (v0.0.13)
```bash
# MongoDB Transfer QR Index Fix (APPLIED ON VPS)
# Problem: E11000 duplicate key error on productId
# Solution: Partial unique index allowing only one active transfer QR per product

# Remove problematic index:
mongosh kiezform --eval 'db.transferqrs.dropIndex("productId_1")'

# Create intelligent index:
mongosh kiezform --eval 'db.transferqrs.createIndex({"productId": 1, "status": 1}, {"partialFilterExpression": {"status": "active"}, "unique": true})'

# Verify fix:
mongosh kiezform --eval 'db.transferqrs.getIndexes()'
```

### Database Management
```bash
# MongoDB connection
mongosh mongodb://kiezform_user:KiezForm2024!SecureDB#MongoDB@localhost:27017/kiezform

# Common queries
db.products.find({isActive: true})
db.blocks.find().sort({timestamp: -1}).limit(10)
db.transferrequests.find({status: 'active'})
```

### STL Generation (3D Printing)
```bash
# Python dependencies for STL generation
pip install numpy-stl pillow qrcode numpy

# Test STL generation
cd backend
python qr_to_stl.py "https://kiezform.de/test" "test_qr.stl"
```

## High-Level Architecture

### Frontend Architecture
The frontend is a **static multi-page application** with no build process, using vanilla JavaScript with ES6+ modules:

- **Global Modal History Manager** (`js/main.js`): Revolutionary mobile back button handling system using History API. All modals across the site integrate with this for proper mobile navigation.
- **Unified Design System** (`css/kiezform-design-system.css`): 150+ CSS variables and component libraries. Import this single file instead of individual CSS files for new pages.
- **Product Gallery System** (`js/products.js`): Dynamic product loading from `products.json` with category filtering and modal integration.
- **Blockchain Explorer** (`js/blockchain.js`): Visual blockchain interface with ultra-smooth search animations and mobile-optimized grid layouts.
- **Admin Dashboard** (`js/admin.js`): Smart template system with cascade dropdowns for rapid product creation.

### Backend Architecture
Node.js/Express API with MongoDB integration:

- **Authentication Middleware**: JWT-based with 24h expiration, SHA-256 password hashing with salt
- **Blockchain System**: SHA-256 hash-based chain with MINT/TRANSFER transactions, pseudonym system (USR-XXXXXXXX) for privacy
- **Transfer System**: Simplified QR-based ownership transfers with immediate processing
- **Product Management**: CRUD operations with active/inactive status management
- **STL Generation**: Python subprocess integration for 3D-printable QR codes (40x40x1mm format)

### Database Schema
MongoDB collections with relationships:

- **products**: Main product catalog with `isActive` field for visibility control
- **blocks**: Blockchain transactions linked to products via `productId`
- **transferrequests**: QR tokens for ownership transfers with expiration
- **users**: Admin user management with bcrypt hashed passwords
- **verifications**: Logs of all verification attempts

### Security Architecture
Multiple layers of security:

- **Frontend**: SHA-256 with salt for local admin validation (fallback)
- **Backend**: bcrypt (12 rounds) for API authentication, JWT tokens
- **Blockchain**: SHA-256 hash chains with integrity validation
- **Transfer System**: Unique tokens with status tracking, force regeneration support
- **Constant-time comparison**: Prevents timing attacks on password verification

## Critical Configuration

### Environment Variables
Backend requires `.env` file:
```bash
PORT=3000
JWT_SECRET=kiezform-jwt-secret-2024-very-secure-random-string-for-production
MONGODB_URI=mongodb://localhost:27017/kiezform
BASE_URL=https://kiezform.de
NODE_ENV=production
```

### Admin Credentials
- Username: `admin`  
- Password: **[REMOVED FOR SECURITY]** - Run `node backend/init-admin.js` to reset

### MongoDB Credentials
- Database: `kiezform`
- User: `kiezform_user`
- Password: `KiezForm2024!SecureDB#MongoDB`

### Production Deployment Paths
**Critical**: Two separate directories on VPS (69.62.121.168):
- `/var/www/kiezform/` - Development sync directory
- `/var/www/html/kiezform/` - **Production files served by Nginx**
- Manual sync required between directories for changes to go live

## Key Features & Workflows

### Product Active/Inactive Management
Products have an `isActive` field controlling visibility:
- Active products: Shown on main page, verifiable via QR
- Inactive products: Hidden from main page, still verifiable via QR
- Admin toggle: Checkbox in admin panel with visual indicators
- API endpoint: `/api/products/active` returns only active products

### QR Code System
Two-QR system with 3D-printed cards:
- **Black QR**: Verification - `/owner-verify?token={token}&product={productId}`
- **Red QR**: Transfer - `/owner-verify?token={token}&product={productId}&mode=transfer`
- **Force Regeneration**: Admin can regenerate used QR codes with `force` parameter
- **STL Generation**: Python script creates 3D-printable files (40x40x1mm)

### Transfer Workflow
1. Customer scans red QR code
2. Confirmation dialog with security warning (German)
3. Backend processes transfer immediately
4. Blockchain records TRANSFER transaction
5. New QR codes auto-generated for new owner

### Smart Product Templates
Admin efficiency feature:
1. Select category → loads products from `products.json`
2. Select product → auto-fills all form fields
3. All fields remain editable for customization
4. Notes field intentionally left empty

## Mobile Optimization

### ModalHistoryManager Integration
All modals must integrate with the global history manager:
```javascript
// Opening a modal
modalHistoryManager.push('modal-id', () => closeModalFunction());

// Modal will automatically handle:
// - Browser back button
// - ESC key
// - Body scroll prevention
// - Cleanup on close
```

### Device-Specific Support
- **Samsung S24 Ultra**: 1440x3120px, 6.8" display optimizations
- **iPhone 16 Pro**: 1206x2622px, 6.3" display with Dynamic Island support
- **Touch Targets**: Minimum 44px for accessibility compliance
- **Safe Areas**: CSS env() for notches and rounded corners

## German Localization

All user-facing content uses:
- **Informal "du" addressing** (not formal "Sie")
- **Personal, engaging tone** for younger audience
- **Complete German translations** for verification/transfer flows
- **DSGVO compliance** in legal pages (Impressum, Datenschutz, Nutzungsbedingungen)

## Design System Usage

### Recommended Approach
```html
<!-- Replace individual CSS imports with unified system -->
<link rel="stylesheet" href="/css/kiezform-design-system.css">
```

### Component Classes
```html
<!-- Buttons -->
<button class="btn-primary">Primary Action</button>
<button class="btn-secondary">Secondary</button>
<button class="btn-danger">Delete</button>

<!-- Modals -->
<div class="modal modal-fade-scale">
  <div class="modal-content">...</div>
</div>

<!-- Forms -->
<div class="form-group">
  <label class="form-label required">Label</label>
  <input type="text" class="form-input">
  <span class="form-help">Help text</span>
</div>
```

### Design Tokens
Use CSS variables for consistency:
- Colors: `--kf-black`, `--kf-accent-green`, `--kf-text-primary`
- Spacing: `--kf-space-1` through `--kf-space-24`
- Typography: `--kf-text-base`, `--kf-weight-thin`
- Animations: `--kf-ease-emphasized`, `--kf-duration-normal`

## Important Notes

- **No build process**: Pure HTML/CSS/JS - can be served statically
- **Industrial theme**: Dark backgrounds, ultra-thin typography, scanline effects
- **Version**: Currently v0.0.13 - Transfer system fully operational
- **API routes**: All backend endpoints prefixed with `/api/`
- **Clean URLs**: Nginx configured to serve `.html` files without extension
- **Toast notifications**: Unified bottom-center positioning across all pages
- **Blockchain sorting**: Always by timestamp (chronological), not block number

## Recent Critical Updates (v0.0.13)

### Transfer System Issues Resolved
- ✅ **E11000 Duplicate Key Error**: Fixed MongoDB index configuration
- ✅ **Owner Name Display**: Real names now shown instead of USR pseudonyms
- ✅ **Transfer QR Management**: Multiple QRs per product supported (expired, used, active)
- ✅ **URL Parsing**: Fixed transfer.html token parameter parsing

### Admin Interface Enhancements
- ✅ **Copy Verification Link**: New button in QR code dialogs
- ✅ **Improved Button Visibility**: Darkened green buttons for better contrast
- ✅ **Transfer List Enhancement**: Shows both real names and blockchain IDs
- ✅ **UI Cleanup**: Removed unnecessary share buttons from product list

### Backend API Improvements
- ✅ **Multi-source Fallback**: Owner name resolution from multiple sources
- ✅ **Enhanced Transfer Endpoint**: Better error handling and data structure
- ✅ **Admin API Extensions**: Transfer codes now include both owner identifiers

### Database State (Production VPS)
```javascript
// Current MongoDB indexes on transferqrs collection:
[
  { "_id": 1 },
  { "qrToken": 1, "unique": true },
  { 
    "productId": 1, 
    "status": 1, 
    "unique": true,
    "partialFilterExpression": { "status": "active" }
  }
]
```

### Deployment Status
- **VPS**: 69.62.121.168 - All systems operational
- **Backend**: PM2 kiezform-api running on port 3000
- **Database**: MongoDB with optimized indexes
- **Frontend**: Static files served by Nginx
- **Code Sync**: Local MacBook ↔ VPS synchronized

## Troubleshooting Learnings

### Critical SSH/Server Identification
- ⚠️ **Wrong Server Confusion**: 192.168.2.134 is the Raspberry Pi weather station, NOT KiezForm VPS
- ✅ **Correct KiezForm VPS**: 69.62.121.168 (accessible via `ssh root@69.62.121.168`)
- 🔧 **Connection Method**: Direct SSH without key files, password authentication works

### Backend Service Issues
- 🐛 **502 Bad Gateway**: Indicates PM2 backend service is down/disabled
- 🔍 **Diagnosis**: `pm2 list | grep kiezform` shows service status
- ⚡ **Fix**: `pm2 restart kiezform-api` resolves most backend issues
- 📊 **Monitoring**: `pm2 logs kiezform-api --lines 10` for error tracking

### Database vs Code Issues
- 💡 **Insight**: Owner name problem was NOT in database data structure
- ✅ **Reality**: Database had correct `owner.name` fields already populated  
- 🎯 **Root Cause**: Backend API logic wasn't accessing existing data correctly
- 🚀 **Solution**: Multi-source fallback resolved without data migration

### MongoDB Index Management
- ⚠️ **Dangerous Commands**: `dropIndex()` on production requires extreme caution
- 🎯 **Partial Indexes**: Superior to simple unique constraints for complex business logic
- 🔍 **Verification**: Always run `getIndexes()` after index changes
- 📈 **Performance**: Partial indexes reduce storage and improve query speed