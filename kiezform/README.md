# KiezForm

A comprehensive e-commerce and product verification system for a Berlin-based 3D-printed jewelry brand. Combines a static frontend website with a complete backend API for product verification, authentication, and admin management.

## 🌟 Features

- **Product Gallery**: Dynamic showcase of chains and rings with category filtering
- **Blockchain System**: SHA-256 hash-based blockchain for certificate ownership tracking
- **Blockchain Explorer**: Visual blockchain interface with search and block navigation
- **Admin Dashboard**: Secure product management with MongoDB integration
- **Backend API**: Full Express.js REST API with JWT authentication
- **Verification System**: QR codes and secure share links for ownership verification  
- **Transfer System**: Simplified QR-based ownership transfers with confirmation dialogs
- **3D Print Integration**: STL file generation for QR codes (40x40x1mm format)
- **Product Database**: MongoDB with comprehensive product and user management
- **VALUE Section**: Comprehensive dual QR code verification system explanation
- **SHARE Section**: Interactive QR code for site sharing with Web Share API
- **Design System**: Unified CSS component library with 150+ design tokens
- **Mobile-First**: Responsive design with hamburger navigation
- **Clean URLs**: No .html extensions with automatic redirects
- **Dark Theme**: Industrial aesthetic with subtle scanline effects

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **Backend**: Node.js/Express (Port 3000), MongoDB, JWT Authentication
- **3D Printing**: Python integration with qr_to_stl.py script for STL generation
- **Data**: JSON file-based product catalog + MongoDB for verification
- **Styling**: Unified Design System with CSS Grid/Flexbox, dark industrial theme
- **Design Tokens**: 150+ CSS variables for consistent theming across all components
- **Security**: SHA-256 password hashing, bcrypt, constant-time comparison
- **Deployment**: PM2 process management, Nginx static serving + API proxy

### File Structure
```
kiezform/
├── index.html              # Main landing page (German localized)
├── admin.html              # Admin dashboard with custom dialogs
├── blockchain.html         # Blockchain explorer interface
├── transfer.html           # Ownership transfer acceptance page (German)
├── owner-verify.html       # Ownership verification page (German)
├── faq.html                # FAQ with legal page styling (German)
├── impressum.html          # Legal imprint (German)
├── datenschutz.html        # Privacy policy (German)
├── nutzungsbedingungen.html # Terms of Service (German)
├── products.json           # Product catalog data
├── backend/                # Node.js/Express backend API
│   ├── server.js           # Main API server
│   ├── qr_to_stl.py        # Python script for STL generation
│   ├── init-admin.js       # Admin initialization script
│   ├── ecosystem.config.js # PM2 configuration
│   ├── package.json        # Backend dependencies
│   └── .env               # Environment variables
├── public/                 # Static assets for verification
├── admin/                  # Additional admin resources
├── css/
│   ├── kiezform-design-system.css  # Master design system (import this)
│   ├── design-tokens.css           # Global CSS variables and design tokens
│   ├── button-components.css       # Unified button component library
│   ├── modal-components.css        # Unified modal component library
│   ├── form-components.css         # Unified form component library
│   ├── styles.css                  # Legacy main site styles
│   ├── admin.css                   # Legacy admin interface styles
│   ├── blockchain.css              # Legacy blockchain explorer styles
│   └── legal.css                   # Legal pages styles
├── js/
│   ├── main.js             # General functionality + QR generation/sharing + Global Modal History Manager
│   ├── products.js         # Product gallery system with mobile optimization
│   ├── blockchain.js       # Blockchain explorer with ultra-smooth animations + search UX
│   └── admin.js            # Secure admin functionality + custom dialogs + modal integration
└── images/                 # Static assets and favicons
```

## 🚀 Quick Start

### Local Development

#### Frontend Only (Static)
No build process required. Serve files using any static web server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# PHP  
php -S localhost:8000
```

#### Full Stack (Frontend + Backend)
For complete functionality with database:

```bash
# Install backend dependencies
cd backend
npm install

# Start MongoDB (required)
brew services start mongodb-community

# Initialize admin user (first time only)
node init-admin.js

# Start backend API
npm start
# or with PM2: pm2 start ecosystem.config.js

# Serve frontend (separate terminal)
cd ..
python -m http.server 8000
```

### Admin Access

Navigate to `/admin` and login with:
- **Username**: admin
- **Password**: F3antai.led-Armari#a-Redeliv+ery

**Security Features:**
- SHA-256 hashing with salt
- Constant-time comparison to prevent timing attacks
- Salted password storage
- No plaintext credentials in client code

*Note: Frontend uses secure local validation. Backend API provides full database functionality.*

### Database Credentials

**MongoDB Connection:**
- **Host**: localhost:27017
- **Database**: kiezform
- **Username**: kiezform_user
- **Password**: KiezForm2024!SecureDB#MongoDB
- **Connection String**: `mongodb://kiezform_user:KiezForm2024!SecureDB#MongoDB@localhost:27017/kiezform`

**Collections:**
- `products`: Product catalog with blockchain integration
- `blocks`: Blockchain transactions (MINT/TRANSFER)
- `transferrequests`: Pending ownership transfers
- `users`: Admin user management
- `verifications`: Ownership verification logs

## 📱 Core Components

### Product Gallery (`js/products.js`)
- Loads products from `products.json`
- Category filtering (chains, rings, all)
- Modal system with image carousel
- **Global Modal History Manager**: Integrated with browser back button handling
- **Mobile-Optimized**: Samsung S24 Ultra and iPhone 16 Pro responsive design
- mailto link generation

### Admin Dashboard (`js/admin.js`)  
- **Version Display**: Shows current version (v0.0.11) in header
- **Custom Dialog System**: Promise-based async confirmation modals with industrial theme
- **Smart Product Templates**: Cascade dropdown system for quick product creation
- **Auto-Fill Forms**: Load product data from templates with full editability
- **Image URL Support**: Product thumbnail management and display
- **STL Download**: Generate 3D-printable QR codes (owner & transfer) as STL files
- **QR Regeneration**: Force parameter handling for regenerating used QR codes
- **Global Modal History Manager**: Integrated with browser back button handling
- Secure SHA-256 authentication with salt
- Product CRUD operations with MongoDB integration
- Owner management and editing
- Share link generation with secure tokens
- QR code creation for verification
- Unified bottom-center toast notifications
- Real-time statistics dashboard
- Fallback to localStorage for offline mode

### Blockchain Explorer (`js/blockchain.js`)
- Visual blockchain interface with grid and chain views
- Real-time search across blocks, products, and owners
- **Ultra-Smooth Animations**: Monochrome meteor/FastLED style success animations
- **Advanced Search UX**: Fade-out transitions and professional result highlighting
- Pagination and infinite scroll support
- Block detail modals with transaction information
- **Global Modal History Manager**: Integrated with browser back button handling
- **Samsung S24 Ultra Optimized**: Device-specific responsive design
- Mobile-responsive design with KiezForm industrial styling

### Ownership Verification (`owner-verify.html`)
- **Complete German Localization**: Fully translated with informal "du" addressing
- **Enhanced Navbar**: Added VALUE, SHARE, BLOCKCHAIN navigation links
- Token-based verification system
- Product authenticity confirmation
- **Product Image Display**: Shows product thumbnails with error handling
- **Transfer Mode**: Simplified ownership transfer with confirmation dialog
- Owner badge display
- Integration with admin-generated links
- Improved content spacing and mobile responsiveness

### Transfer System (Simplified)
- **Complete German Translation**: Fully localized transfer.html with personal addressing
- **Red QR Code Transfer**: Direct ownership transfer via 3D-printed QR cards
- **Immediate Processing**: No 24-hour waiting period
- **Custom Confirmation Dialog**: Branded warning modals before irreversible transfers
- **Blockchain Integration**: Automatic blockchain recording and QR regeneration
- **Separate QR Cards**: Black for verification, red for transfer
- **Fixed QR Regeneration**: Proper force parameter handling for used QR codes

## 🛡️ Security Features

### Admin Interface
- SHA-256 password hashing with salt (kiezform-admin-salt-2024)
- Constant-time comparison to prevent timing attacks
- XSS protection with HTML escaping
- Secure token generation for share links
- Input validation and sanitization
- Local validation with API fallback

### Verification System
- Base64 encoded tokens with timestamps
- Product ID validation
- Owner information verification
- Cannot be forged or manipulated

## 📊 Product Data Structure

```json
{
  "id": "unique-identifier",
  "name": "PRODUCT NAME", 
  "category": "chains|rings",
  "price": 149,
  "material": "Bio-Resin - Silver Coated",
  "sizes": ["45cm", "50cm", "60cm"],
  "images": {
    "thumb": "thumbnail-url",
    "full": ["full-image-urls"]
  },
  "description": "Product description",
  "featured": true|false,
  "new": true|false
}
```

## 🎨 Unified Design System

### Architecture
KiezForm uses a **component-based CSS architecture** with design tokens for consistent theming across all pages and components.

#### **Import Structure** (Recommended)
```html
<!-- Replace individual CSS imports with unified system -->
<link rel="stylesheet" href="/css/kiezform-design-system.css">
```

#### **Legacy Support** (Fallback)
```html
<!-- Individual imports still supported for gradual migration -->
<link rel="stylesheet" href="/css/styles.css">
<link rel="stylesheet" href="/css/admin.css">
<link rel="stylesheet" href="/css/blockchain.css">
```

### Design Tokens (150+ CSS Variables)

#### **Color System**
```css
/* Primary Colors */
--kf-black: #000000;           /* OLED-optimized true black */
--kf-dark: #0a0a0a;            /* Primary backgrounds */
--kf-dark-2: #1a1a1a;          /* Secondary backgrounds */
--kf-gray: #404040;            /* Interactive elements */
--kf-white: #ffffff;           /* Primary text */

/* Text Hierarchy */
--kf-text-primary: #f0f0f0;    /* Headlines, important text */
--kf-text-secondary: #e0e0e0;  /* Body text, descriptions */
--kf-text-muted: #909090;      /* Subtle text, placeholders */

/* Accent Colors */
--kf-accent-green: #00ff00;    /* Success, version badges */
--kf-accent-blue: #0096ff;     /* Links, focus states */
--kf-accent-red: #dc2c3f;      /* Errors, transfer QR codes */
--kf-accent-yellow: #ffa500;   /* Warnings, notifications */
```

#### **Typography Scale**
```css
/* Responsive font sizes with mobile optimization */
--kf-text-xs: 0.75rem;         /* 12px */
--kf-text-sm: 0.875rem;        /* 14px */
--kf-text-base: 1rem;          /* 16px - prevents iOS zoom */
--kf-text-lg: 1.125rem;        /* 18px */
--kf-text-xl: 1.25rem;         /* 20px */
--kf-text-2xl: 1.5rem;         /* 24px */
--kf-text-3xl: 1.875rem;       /* 30px */
--kf-text-4xl: 2.25rem;        /* 36px */

/* Font weights */
--kf-weight-thin: 100;          /* Industrial titles */
--kf-weight-light: 300;
--kf-weight-regular: 400;
--kf-weight-medium: 500;
--kf-weight-semibold: 600;
--kf-weight-bold: 700;
```

#### **Spacing System**
```css
/* Consistent spacing scale (4px base) */
--kf-space-1: 0.25rem;         /* 4px */
--kf-space-2: 0.5rem;          /* 8px */
--kf-space-3: 0.75rem;         /* 12px */
--kf-space-4: 1rem;            /* 16px */
--kf-space-6: 1.5rem;          /* 24px */
--kf-space-8: 2rem;            /* 32px */
--kf-space-12: 3rem;           /* 48px */
--kf-space-16: 4rem;           /* 64px */
```

#### **Animation Tokens**
```css
/* Material Design 3 easing functions */
--kf-ease-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
--kf-ease-emphasized-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
--kf-ease-emphasized: cubic-bezier(0.2, 0, 0, 1);

/* Duration scale */
--kf-duration-fast: 150ms;
--kf-duration-normal: 300ms;
--kf-duration-medium: 500ms;
```

### Component Libraries

#### **Button Components** (`button-components.css`)
- **8 Variants**: Primary, Secondary, Outline, Ghost, Success, Danger, Search, Icon
- **3 Sizes**: Small (36px), Default (44px), Large (52px)
- **States**: Hover, Focus, Active, Disabled, Loading
- **Accessibility**: ARIA support, 44px touch targets, focus indicators
- **Mobile**: Samsung S24 Ultra + iPhone 16 Pro optimizations

```html
<!-- Button examples -->
<button class="btn-primary">Primary Action</button>
<button class="btn-secondary">Filter Option</button>
<button class="btn-outline">View Details</button>
<button class="btn-ghost">Subtle Action</button>
```

#### **Modal Components** (`modal-components.css`)
- **4 Types**: Standard, Product Detail, Blockchain Block, Confirmation Dialog
- **Animations**: Fade-scale, Slide-up, Zoom variants
- **Integration**: Works with existing ModalHistoryManager
- **Mobile**: Responsive layouts, safe-area support
- **Performance**: Hardware acceleration, backdrop blur

```html
<!-- Modal structure -->
<div class="modal modal-fade-scale">
    <div class="modal-content">
        <button class="modal-close">×</button>
        <div class="modal-header">
            <h2 class="modal-title">Title</h2>
        </div>
        <div class="modal-body">Content</div>
        <div class="modal-footer">
            <button class="btn-secondary">Cancel</button>
            <button class="btn-primary">Confirm</button>
        </div>
    </div>
</div>
```

#### **Form Components** (`form-components.css`)
- **All Input Types**: Text, Number, Date, File, Range, Checkbox, Radio
- **Validation States**: Error, Success, Focus, Disabled
- **Input Groups**: With icons, buttons, labels
- **Accessibility**: Screen reader support, high contrast mode
- **Mobile**: 16px font size (prevents iOS zoom), touch-friendly

```html
<!-- Form examples -->
<div class="form-group">
    <label class="form-label required">Product Name</label>
    <input type="text" placeholder="Enter product name">
    <span class="form-help">This will be displayed publicly</span>
</div>
```

### Design Principles

#### **Industrial Aesthetic**
- **Scanline Overlay**: Subtle CRT-style effect for technical feel
- **Ultra-thin Typography**: Font-weight 100 for section titles
- **Wide Letter Spacing**: 0.3em for industrial technical look
- **Monospace Elements**: For technical data (block IDs, serial numbers)

#### **Mobile-First Approach**
- **Touch Targets**: Minimum 44px for accessibility
- **Safe Areas**: Support for notches and Dynamic Island
- **No Horizontal Scroll**: Constrained layouts with proper overflow
- **iOS Zoom Prevention**: 16px minimum font size on inputs

#### **Performance Optimization**
- **Hardware Acceleration**: `will-change` and `transform3d` for animations
- **Reduced Motion**: Respects user accessibility preferences
- **Critical CSS**: Inline critical styles, lazy load non-critical
- **Legacy Support**: Graceful degradation for older browsers

## 🌐 Deployment

### Design System Integration

#### **Quick Setup** (Recommended)
1. **Replace CSS imports** in HTML files:
```html
<!-- Remove old imports -->
<!-- <link rel="stylesheet" href="/css/styles.css"> -->
<!-- <link rel="stylesheet" href="/css/admin.css"> -->
<!-- <link rel="stylesheet" href="/css/blockchain.css"> -->

<!-- Add unified design system -->
<link rel="stylesheet" href="/css/kiezform-design-system.css">
```

2. **Update component classes** (optional for better consistency):
```html
<!-- Old button classes still work, but new classes provide better consistency -->
<button class="btn-primary"><!-- instead of cta-button --></button>
<button class="btn-secondary"><!-- instead of filter-btn --></button>
<button class="btn-outline"><!-- instead of view-btn --></button>
```

3. **Verify mobile compatibility**:
- Samsung S24 Ultra: Special safe-area handling
- iPhone 16 Pro: Dynamic Island support
- Touch targets automatically 44px minimum

#### **Migration Strategy**
- **Gradual**: Legacy CSS files still work alongside design system
- **No Breaking Changes**: Existing components continue functioning
- **Progressive Enhancement**: New features use design system components
- **Performance**: Unified system reduces CSS redundancy

### Static Hosting
Compatible with any static hosting service:
- Netlify
- Vercel  
- GitHub Pages
- Traditional web hosting

**No build process required** - Design system uses pure CSS imports.

### German Localization Notes
- All user-facing content uses informal "du" addressing
- Complete German translations for verification and transfer workflows
- Legal pages follow German DSGVO compliance requirements
- FAQ styled consistently with other legal pages
- Design system supports German character sets and longer text strings

### Production Deployment (VPS: 69.62.121.168)

**Directory Structure (Important!):**
```
/var/www/html/kiezform/        # ← Live production files (served by Nginx)
├── Frontend files (HTML, CSS, JS)
└── backend/
    ├── server.js (Port 3000)
    ├── ecosystem.config.js (PM2)
    └── .env (Environment)

/var/www/kiezform/             # ← Development sync directory (from MacBook)
├── Same structure as above
└── Files need to be copied to /var/www/html/kiezform/ for production
```

**Critical Deployment Note:**
- **Development files sync to**: `/var/www/kiezform/`
- **Production files served from**: `/var/www/html/kiezform/`
- **Manual sync required** between directories for changes to go live
- Always verify changes in `/var/www/html/kiezform/` after deployment

**Nginx Configuration:**
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name kiezform.de www.kiezform.de;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name kiezform.de www.kiezform.de;
    root /var/www/html/kiezform;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/kiezform.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kiezform.de/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # API Routes - Direct backend proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Clean URLs without .html extensions
    if ($request_uri ~ ^/(.*)\.html(\?.*)?$) {
        return 301 /$1$2;
    }
    location / {
        try_files $uri $uri.html $uri/ =404;
    }
}
```

**PM2 Process:**
```bash
pm2 start /var/www/html/kiezform/backend/ecosystem.config.js
# Process: kiezform-api (Port 3000)
```

## 📱 Mobile Optimization

### Global Modal History Manager (`js/main.js`)
- **ModalHistoryManager Class**: Complete browser history integration for mobile back button
- **Samsung S24 Ultra Support**: 6.8" (1440x3120px) device-specific optimizations
- **iPhone 16 Pro Support**: 6.3" (1206x2622px) responsive design
- **History API Integration**: `pushState`/`popstate` for modal navigation
- **Modal Stack Management**: Support for nested/stacked modals
- **Body Scroll Prevention**: `modal-active` class prevents background scrolling
- **ESC Key Global Handler**: Unified keyboard navigation across all modals
- **Touch-Optimized**: 44px minimum touch targets for accessibility

### Mobile-First Features
- **Responsive Grid Layouts**: CSS Grid/Flexbox with device breakpoints
- **Touch-Friendly Navigation**: Hamburger menu with haptic feedback
- **Hardware Acceleration**: `transform3d` and `will-change` for smooth animations
- **Safe Area Support**: CSS `env()` for modern device notches/Dynamic Island
- **No Horizontal Scrolling**: Constrained layouts with proper overflow handling
- **Optimized Form Inputs**: Mobile-friendly input types and validation
- **Smooth Scrolling**: Enhanced with mobile offset calculations

## 📊 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/verify/:id` - Product verification
- `GET /api/qrcode/:id` - QR code generation with force parameter support

### Blockchain Endpoints
- `GET /api/blockchain/blocks` - Get blockchain blocks
- `GET /api/blockchain/search/:query` - Search blockchain
- `GET /api/blockchain/stats` - Blockchain statistics
- `POST /api/transfer/simple` - Simplified immediate ownership transfer

### Admin Endpoints (Authentication required)
- `POST /api/admin/login` - Admin login
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/stats` - Get statistics
- `GET /api/admin/generate-stl-qr/:type/:productId` - Generate STL files for QR codes
- `POST /api/admin/qr/regenerate` - Force regenerate QR codes (with force parameter)

## 🔐 Security & Authentication

### Admin Security
- SHA-256 password hashing with salt (`kiezform-admin-salt-2024`)
- Constant-time comparison to prevent timing attacks
- JWT tokens with 24h validity
- bcrypt server-side password hashing (12 salt rounds)
- Secure HTTP headers and HTTPS enforcement

### Blockchain Security
- SHA-256 hash-based chain integrity
- Pseudonym system (USR-XXXXXXXX) for privacy
- Immutable transaction records
- Hash validation for block authenticity

### Product Verification
- Unique serial numbers for each product
- QR codes linking to verification pages
- Base64 encoded tokens with timestamps
- Input sanitization and schema validation

## 🎨 Product Verification Workflow

1. **Production**: Jewelry piece is 3D-printed
2. **Registration**: Admin creates product entry in system
3. **QR Card Generation**: System generates two separate 3D-printed QR cards
4. **Packaging**: Customer receives jewelry + two QR cards (black + red)
5. **Verification**: Customer scans black code → authenticity certificate
6. **Transfer**: Customer scans red code → ownership transfer interface

## 📱 QR Code System

### Two-QR Code System
- **Black QR Code (Verification)**: `https://kiezform.de/owner-verify?token={token}&product={productId}`
- **Red QR Code (Transfer)**: `https://kiezform.de/owner-verify?token={token}&product={productId}&mode=transfer`
- **3D-Printed Cards**: Separate physical cards shipped with jewelry
- **Error Correction**: Medium (M) level for scanning reliability
- **Size**: 300x300px via QR Server API
- **STL Generation**: 40x40x1mm 3D-printable format for jewelry integration

### Critical Warning System
- **Loss Prevention**: Prominent warnings about red QR code importance (German)
- **Custom Confirmation Dialog**: Branded modal warnings before irreversible transfers
- **Single Use**: Red codes become invalid after transfer, new ones auto-generated
- **Force Regeneration**: Admin can regenerate used QR codes with force parameter

## 🔧 Configuration

### Environment Variables (.env)
```bash
PORT=3000
JWT_SECRET=kiezform-jwt-secret-2024-very-secure-random-string-for-production
MONGODB_URI=mongodb://localhost:27017/kiezform
BASE_URL=https://kiezform.de
NODE_ENV=production
```

### Google Analytics
Update the tracking ID in `index.html`:
```javascript
gtag('config', 'YOUR-GA-TRACKING-ID');
```

### Contact Information  
Update email addresses in:
- Product inquiry mailto links (`js/products.js`)
- Legal pages contact details

## 🖨️ 3D Printing Integration

### STL Generation System
- **Python Script**: `qr_to_stl.py` converts QR codes to 3D-printable STL files
- **File Format**: 40x40x1mm STL files optimized for 3D printing
- **QR Code Types**: Both owner verification and transfer QR codes supported
- **Admin Interface**: STL download buttons in QR code modals
- **File Naming**: Timestamped files with product identification
- **Dependencies**: numpy-stl, PIL, qrcode, numpy

### STL File Specifications
- **Base Size**: 40mm x 40mm x 1mm
- **QR Height**: 0.5mm raised above base
- **Material**: Compatible with PLA+, PETG, ABS
- **Print Settings**: 0.2mm layer height, 100% infill recommended
- **Support**: No supports needed for optimal print quality

### Integration Workflow
1. **Admin Panel**: Click STL download button in QR modal
2. **Backend Processing**: Python script generates STL from QR URL
3. **File Download**: Browser downloads ready-to-print STL file
4. **3D Printing**: Print file with standard FDM printer settings
5. **Integration**: Embed 3D-printed QR code into jewelry piece

## 🏷️ Version History

### v0.0.11 (Latest) - Confirmation Dialog & Owner Name Fix  
- ✅ **Transfer Confirmation Dialog**: Added missing security confirmation to transfer.html
  - **Unified UX**: Both transfer.html and owner-verify.html now have identical confirmation dialogs
  - **Security Warning**: "ENDGÜLTIG und kann NICHT rückgängig gemacht werden!" with visual warning
  - **Promise-based Implementation**: Clean async/await with ESC key and button handling
  - **Industrial Theme**: Consistent dark theme with red accent borders
- ✅ **Owner Name Display Fix**: Resolved USR- pseudonym showing instead of real names
  - **Backend Enhancement**: `/api/transfer/complete` returns both `newOwner` and `newOwnerName`
  - **Frontend Update**: Success screen shows "Neuer Eigentümer: [Real Name]" 
  - **Fallback Support**: Maintains compatibility with existing transfer systems
- ✅ **E11000 Database Error Resolution**: Fixed critical MongoDB indexing issue
  - **Schema Fix**: Removed unique constraint on `productId` in transferQRSchema
  - **Index Optimization**: Proper compound index with partial filter for active status only
  - **Transfer QR Generation**: Multiple QRs per product now supported correctly

### v0.0.10 - Transfer System Fix
- 🔧 **Critical Production Bug Fix**: Resolved transfer token parsing error
  - **Root Cause**: VPS had two directories - dev sync (`/var/www/kiezform/`) vs production (`/var/www/html/kiezform/`)
  - **Problem**: Production `transfer.html` contained old, defective `getTransferTokenFromURL()` function
  - **Solution**: Copied fixed transfer.html from dev to production directory
  - **Impact**: Transfer URLs like `/transfer?token=TQR-XXXXXXXXX` now work correctly
- ✅ **Transfer Token System Refresh**: Complete QR code regeneration
  - Deleted all 8 existing transfer tokens from MongoDB
  - Generated 45 new transfer tokens for all products via bulk API
  - All Cash4Love, Agama, Aurora, etc. products have fresh working tokens
  - **Example**: Cash4Love now uses `TQR-D9C0B2077CEE` (was `TQR-020F4D3908F6`)
- 📁 **Documentation Update**: Clarified VPS directory structure
  - Added critical deployment notes about manual sync requirement
  - Documented `/var/www/kiezform/` (dev) vs `/var/www/html/kiezform/` (production)
  - Prevents future deployment confusion and debugging

### v0.0.9
- ✅ **Global Modal History Manager**: Complete mobile back button handling system
  - ModalHistoryManager class with History API integration (`pushState`/`popstate`)
  - Samsung S24 Ultra (6.8", 1440x3120px) and iPhone 16 Pro (6.3", 1206x2622px) optimizations
  - Modal stack management for nested/stacked modals with proper cleanup
  - Body scroll prevention with `modal-active` CSS class
  - ESC key global handler replacing individual modal implementations
- ✅ **Ultra-Smooth Search Animations**: Professional AAA-quality animations
  - Monochrome meteor/FastLED style animations replacing red/green color scheme
  - Fade-out transitions for existing search results before new searches
  - Silky-smooth 3-step keyframe animations with hardware acceleration
  - 40ms stagger timing for block result animations
  - Clean white text without emoji for search result headers
- ✅ **Complete Modal Integration**: All modals use global history manager
  - Blockchain Explorer: Block details modal with back button support
  - Product Gallery: Product detail modal with mobile optimization
  - Admin Interface: Edit product and confirmation dialogs integrated
  - Custom themed dialogs with Promise-based async handling
- ✅ **Samsung S24 Ultra Mobile Optimization**: Device-specific enhancements
  - CSS media queries for 1440x3120px display resolution
  - Touch-optimized 44px minimum target sizes for accessibility
  - Hardware-accelerated animations with `transform3d` and `will-change`
  - Safe area support for modern device features (notch/Dynamic Island)
- ✅ **Advanced Search UX**: Professional search experience
  - Removed all red/reddish colors from blockchain page (now white)
  - Professional fade-out animations for search result clearing
  - Enhanced search loading states with disabled input feedback
  - Haptic feedback patterns for mobile success/error states

### v0.0.8
- ✅ **Terms of Service Implementation**: Professional legal framework
  - Created comprehensive `/nutzungsbedingungen` page emphasizing digital certificates
  - Legal focus: Digital certificate as main product, jewelry as free accessory
  - DSGVO-compliant privacy protection and liability limitation
  - Clear refund, warranty, and intellectual property policies
  - Footer integration with Impressum, Datenschutz, FAQ links
- ✅ **Complete German Localization & Personalization**:
  - Changed all formal "Sie" addressing to informal "du" throughout the app
  - Made text more personal and engaging for younger target audience
  - Translated `owner-verify.html` and `transfer.html` completely to German
  - Updated FAQ text: "Der neue vereinfachte Transfer-Prozess" → "Der Transfer-Prozess"
  - Enhanced navbar on owner-verify page with VALUE, SHARE, BLOCKCHAIN links
- ✅ **Custom Themed Dialog System**: Replaced browser alerts with branded modals
  - Promise-based async confirmation dialogs matching industrial theme
  - Backdrop blur effects and fade-in animations
  - Custom styling with KiezForm color scheme and typography
  - Applied across admin.js for consistent user experience
- ✅ **Owner-Verify Page Optimization**: Enhanced UX and German content
  - Complete German translation with personal "du" addressing
  - Improved content spacing and navbar alignment
  - Better visual hierarchy and mobile responsiveness
  - Enhanced verification display with clearer messaging
- ✅ **FAQ Complete Redesign**: Legal page theme consistency
  - Removed hero section for clean professional layout
  - Applied legal.css styling to match Impressum/Datenschutz/Nutzungsbedingungen
  - Fixed remaining formal "Sie" to informal "du" addressing
  - Consistent typography and spacing with other legal pages
- ✅ **Toast Notification Unification**: Bottom-center positioning
  - Updated all toast implementations across admin.js, blockchain.js, main.js
  - Consistent `bottom: 30px; left: 50%; transform: translateX(-50%)` positioning
  - Smooth slide-up animations with proper z-index layering
- ✅ **QR Code Regeneration Fix**: Force parameter implementation
  - Fixed issue where "used" QR codes couldn't be regenerated
  - Added force parameter logic to distinguish regeneration from new generation
  - Updated duplicate prevention to only check `status: 'active'`
  - Proper invalidation of existing QR codes before creating new ones
- ✅ **Transfer URL Migration**: Updated all transfer endpoints
  - Migrated from `/transfer` to `/owner-verify?mode=transfer`
  - Fixed 404 errors on transfer QR code usage
  - Updated backend endpoints and frontend URL handling

### v0.0.7
- ✅ **3D Print Integration Enhancements**: Production-ready STL system
  - Fixed backend authentication middleware for STL endpoints
  - Completed VPS Python environment setup with all dependencies
  - Tested and verified STL generation in production environment
  - Improved error handling and temporary file cleanup
  - Updated FAQ documentation for 3D-printed QR codes

### v0.0.6
- ✅ **3D Print Integration**: Complete STL generation system for QR codes
  - Python script `qr_to_stl.py` for converting QR codes to 3D-printable STL files
  - Admin panel STL download buttons for both owner and transfer QR codes
  - 40x40x1mm format optimized for jewelry integration
  - Automatic file naming with timestamps and product identification
  - Error handling and temporary file cleanup
- ✅ **VPS Deployment**: Complete Python environment setup
  - Installed numpy-stl, PIL, qrcode dependencies on production VPS
  - Fixed authentication middleware for STL endpoints
  - Tested and verified STL generation functionality
  - PM2 process management for backend API stability

### v0.0.5
- ✅ **Product Catalog Standardization**: Updated products.json with real chains
  - 6 new chain products: Agama, Aurora, Cash4Love, Cruella, Goldelse, Snake-Eater
  - 1 ring product: Brutalist Ring with real product images
  - Standardized all chains: ["40cm", "50cm", "60cm"] sizes, "Premium-Quality PLA+" material
  - Removed placeholder products and Binary/Techno chains
  - Updated pricing: Cruella (€499), Goldelse (€79), Snake-Eater (€89), Brutalist Ring (€169)
- ✅ **VPS Deployment**: Fixed IP address and blockchain sorting
  - Corrected VPS IP from 194.164.72.75 to 69.62.121.168
  - Fixed blockchain explorer sorting: chronological by timestamp instead of block number
  - Updated database with real products and 60 purchases + 4 transfers since 01.04.2025
  - All products bought at least once with realistic transaction history
- ✅ **Social Media Icons**: Professional SVG implementation
  - Replaced emoji links (📷📘🐦) with disabled SVG logos
  - Instagram, Facebook, and X (modern Twitter) SVG icons
  - Grayscale disabled state with "Coming Soon" tooltips
  - Applied across index.html and blockchain.html
  - CSS styling: pointer-events: none, opacity: 0.3, grayscale filter
- ✅ **VERIFIKATIONSPROZESS**: Fixed to exactly 6 security features
  - Removed redundant "Live Blockchain Explorer" item
  - Clean 6-step verification workflow as requested

### v0.0.4
- ✅ **Blockchain System**: Complete SHA-256 hash-based blockchain implementation
  - MongoDB schemas for blocks, products, and transfer requests
  - Pseudonym system (USR-XXXXXXXX) for privacy protection
  - MINT and TRANSFER transaction types with hash validation
  - Genesis block initialization with chain integrity
- ✅ **Blockchain Explorer**: Visual blockchain interface (/blockchain)
  - Grid and chain view modes with pagination
  - Real-time search across blocks, products, and owners
  - Red highlighting for search results
  - Block detail modals with transaction information
  - Mobile-responsive with industrial KiezForm styling
- ✅ **Transfer System**: Simplified QR-based ownership transfers
  - Immediate transfer processing via red QR cards
  - Confirmation dialog with security warnings
  - Automatic blockchain recording and QR regeneration
  - Separate 3D-printed QR cards for verification and transfer
- ✅ **Section Title Styling**: Industrial theme for all page headlines
  - Ultra-thin typography (font-weight: 100)
  - Wide letter-spacing (0.3em) for technical aesthetic
  - Gradient underline effects with subtle glow
  - Mobile-responsive with consistent spacing

### v0.0.3
- ✅ **VALUE Section**: Comprehensive dual QR code verification system explanation
  - Physical 3D-printed QR code for authenticity verification
  - Red QR code for secure ownership transfer
  - Step-by-step verification workflow
  - Security features with blockchain-based authentication
- ✅ **SHARE Section**: Interactive site sharing functionality
  - QR code generation linking to main site (kiezform.de)
  - Web Share API integration with fallback
  - Copy-to-clipboard functionality with toast notifications
- ✅ **Navigation Restructure**: Removed legal links from navbar (kept in footer)
- ✅ **Complete Theme Integration**: Industrial KiezForm aesthetic across all sections
  - Grid system with 1px white separators
  - Dark overlays and hover effects
  - Consistent typography and animations
  - Mobile-responsive design

### v0.0.2
- ✅ **Smart Product Template System**: Cascade dropdowns for quick product creation
- ✅ **Auto-Fill Forms**: Template-based form population with full editability
- ✅ **Image URL Support**: Product thumbnail management and verification display
- ✅ **Enhanced Edit Modal**: Consistent field structure with add product form
- ✅ **Improved Styling**: Consistent input field styling across all types
- ✅ Admin panel version display with v0.0.2 badge
- ✅ Unified project structure (merged kiezform-verification)
- ✅ Complete backend API with MongoDB integration
- ✅ Secure SHA-256 authentication system with salt
- ✅ JWT token-based API authentication
- ✅ Toast notifications replacing alert dialogs
- ✅ PM2 process management for production
- ✅ Enhanced admin dashboard with real-time statistics
- ✅ HTTPS/SSL security with Let's Encrypt certificates
- ✅ Product verification workflow with QR codes

### v3.0
- ✅ Complete backend API with MongoDB
- ✅ Secure SHA-256 authentication system
- ✅ JWT token-based API authentication
- ✅ Unified project structure (merged verification system)
- ✅ Toast notifications replacing alert dialogs
- ✅ PM2 process management for production

### v2.0
- ✅ Admin panel with product editing
- ✅ Owner verification system  
- ✅ QR code generation
- ✅ Clean URLs without .html
- ✅ Mobile navigation improvements
- ✅ Authenticity verification feature

### v1.0
- ✅ Basic product gallery
- ✅ Category filtering  
- ✅ Responsive design
- ✅ Legal pages

## 📞 Support

For questions or issues:
- **Email**: martin.pfeffer@celox.io
- **Website**: https://kiezform.de

## 📄 License

© 2025 KiezForm. All rights reserved.

---

**Built with ❤️ in Berlin**