# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KiezForm is a comprehensive e-commerce and product verification system for a Berlin-based 3D-printed jewelry brand. The project combines a static frontend website showcasing jewelry products with a complete backend API for product verification, authentication, and admin management. The site features two main product categories (chains and rings) with industrial aesthetics and sustainable materials.

**Design System**: Features a unified CSS component library with 150+ design tokens, eliminating design inconsistencies while maintaining simple deployment without build processes.

## Architecture

### File Structure
- `index.html` - Main landing page and product showcase with personalized content ("du" addressing)
- `admin.html` - Admin dashboard for product management with custom themed dialogs
- `blockchain.html` - Blockchain explorer interface with visual block representation
- `transfer.html` - Ownership transfer acceptance page (German localized)
- `owner-verify.html` - Product ownership verification page (complete German translation, enhanced UX)
- `nutzungsbedingungen.html` - Terms of service emphasizing digital certificate as main product
- `faq.html` - Frequently asked questions with legal page styling and "du" addressing
- `impressum.html` - Legal imprint page
- `datenschutz.html` - Privacy policy page
- `products.json` - Product catalog data source
- `js/main.js` - General site functionality + Global Modal History Manager (ModalHistoryManager class)
- `js/products.js` - Product gallery and modal system with mobile optimization
- `js/blockchain.js` - Blockchain explorer with ultra-smooth search animations and UX
- `js/admin.js` - Admin interface with secure authentication and modal integration
- `css/kiezform-design-system.css` - **Master design system** (import this for new projects)
- `css/design-tokens.css` - Global CSS variables and design tokens (150+ variables)
- `css/button-components.css` - Unified button component library (8 variants)
- `css/modal-components.css` - Unified modal component library (4 types)
- `css/form-components.css` - Unified form component library (all input types)
- `css/styles.css` - Legacy main site styles (still supported)
- `css/blockchain.css` - Legacy blockchain explorer styles (still supported)
- `css/admin.css` - Legacy admin dashboard styles (still supported)
- `css/legal.css` - Legal pages (impressum/datenschutz) styles
- `backend/` - Node.js/Express backend API with blockchain functionality
  - `qr_to_stl.py` - Python script for 3D-printable STL generation
- `public/` - Static assets for verification system
- `admin/` - Additional admin resources

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **Backend**: Node.js/Express, MongoDB, JWT Authentication
- **3D Printing**: Python integration with numpy-stl, PIL, qrcode for STL generation
- **Blockchain**: SHA-256 hash-based blockchain simulation with MongoDB storage
- **Data**: JSON file-based product catalog + MongoDB for verification and blockchain
- **Design System**: Unified CSS component library with 150+ design tokens for consistent theming
- **Styling**: CSS Grid/Flexbox, dark industrial theme with scanline effects
- **Security**: SHA-256 password hashing, JWT tokens, bcrypt, blockchain integrity
- **Deployment**: PM2 process management, Nginx reverse proxy

### Core Components

#### ModalHistoryManager Class (js/main.js)
Revolutionary global modal management system for mobile-first web applications:
- **History API Integration**: Uses `pushState`/`popstate` for proper mobile back button handling
- **Samsung S24 Ultra Support**: Device-specific optimizations for 6.8" (1440x3120px) display
- **iPhone 16 Pro Support**: Responsive design for 6.3" (1206x2622px) display  
- **Modal Stack Management**: Supports nested/stacked modals with proper cleanup
- **Global ESC Handler**: Unified keyboard navigation replacing individual modal listeners
- **Body Scroll Prevention**: `modal-active` CSS class prevents background scrolling
- **Touch Optimization**: 44px minimum touch targets for accessibility compliance
- **Hardware Acceleration**: Uses `transform3d` and `will-change` for smooth animations

#### ProductGallery Class (js/products.js)
Central component managing the product catalog interface:
- Loads products from `products.json` via fetch API
- Handles category filtering (all, chains, rings)
- **Modal History Integration**: Uses global ModalHistoryManager for mobile back button support
- Manages product modal with image gallery
- Implements keyboard navigation (ESC to close modal)
- Generates mailto links for product inquiries

#### Blockchain Explorer (js/blockchain.js)
Visual blockchain interface with ultra-smooth professional UX:
- **Multiple Views**: Grid and chain view modes for different perspectives
- **Ultra-Smooth Search**: Monochrome meteor/FastLED style animations with AAA-quality polish
- **Advanced Search UX**: Professional fade-out transitions and clean white text (no emoji)
- **Silky-Smooth Animations**: 3-step keyframes with hardware acceleration and 40ms stagger
- **Modal History Integration**: Block details modal uses global ModalHistoryManager
- **Samsung S24 Ultra Optimized**: Device-specific responsive design and touch targets
- **Block Details**: Modal system showing complete transaction information
- **Pagination**: Efficient loading with page-based navigation
- **Mobile Responsive**: Optimized for all screen sizes with KiezForm industrial styling
- **Live Updates**: Real-time blockchain statistics and block counting

#### Transfer System (Simplified)
Immediate QR-based ownership transfer via owner-verify.html with mode=transfer:
- **Simplified Workflow**: Red QR codes lead to unified verification page with transfer mode
- **Immediate Processing**: No 24-hour waiting period, instant transfers
- **Confirmation Dialog**: Modal warning with security confirmation before irreversible action
- **Blockchain Integration**: Automatic TRANSFER transaction creation and QR regeneration
- **Separate QR Cards**: 3D-printed black (verification) and red (transfer) cards

#### Admin Dashboard System (js/admin.js)
Comprehensive admin interface with smart features:
- **Smart Template System**: Cascade dropdowns loading from products.json
- **Auto-Fill Forms**: Template-based form population with full editability
- **Product Management**: CRUD operations with MongoDB integration
- **Image URL Support**: Product thumbnail management and display
- **STL Download System**: Generate 3D-printable QR codes as STL files (40x40x1mm)
- **Verification Links**: QR code and share link generation
- **Security**: SHA-256 authentication with salt and JWT tokens
- **Real-time Stats**: Dashboard with live product statistics
- **Offline Fallback**: localStorage support when API unavailable

#### Blockchain Data Structures

**Block Schema (MongoDB):**
```javascript
{
  blockId: "BLK-001",           // Unique block identifier
  blockNumber: 1,               // Sequential block number
  previousHash: "sha256-hash",  // Hash of previous block
  currentHash: "sha256-hash",   // Hash of current block
  productId: "uuid",            // Associated product ID
  transactionType: "MINT|TRANSFER", // Transaction type
  fromOwner: "USR-XXXXXXXX",    // Previous owner (null for MINT)
  toOwner: "USR-XXXXXXXX",      // New owner pseudonym
  timestamp: Date,              // Transaction timestamp
  metadata: {                   // Additional transaction data
    productName: "Product Name",
    serialNumber: "TC-2024-001",
    transferMethod: "SIMPLE_QR|ADMIN_MINT"
  },
  isValid: true                 // Blockchain validation status
}
```

**Product Data Structure (MongoDB + JSON):**
```json
{
  "_id": "uuid",                // MongoDB product ID
  "serialNumber": "TC-2024-001", // Unique product serial
  "productName": "PRODUCT NAME",
  "category": "chains|rings", 
  "imageUrl": "thumbnail-url",
  "manufacturingDate": "Date",
  "owner": {
    "name": "Owner Name",
    "email": "owner@email.com",
    "registrationDate": "Date"
  },
  "metadata": {
    "material": "Bio-Resin - Silver Coated",
    "size": "50cm",
    "color": "Black",
    "price": 149,
    "notes": "Product notes"
  },
  "blockchainInfo": {
    "currentOwner": "USR-XXXXXXXX", // Current owner pseudonym
    "mintBlock": "BLK-001",         // Initial mint block
    "lastBlock": "BLK-003",         // Latest transaction block
    "transferCount": 2              // Number of transfers
  },
  "isValid": true,
  "createdAt": "Date",
  "lastVerified": "Date"
}
```

## Unified Design System

### Architecture Overview
KiezForm features a **component-based CSS architecture** that eliminates design inconsistencies while maintaining the simplicity of static deployment (no build process required).

#### **Design Token System** (css/design-tokens.css)
- **150+ CSS Variables**: `--kf-black`, `--kf-text-primary`, `--kf-accent-green`, etc.
- **Color Hierarchy**: Primary, secondary, muted text with accent colors
- **Typography Scale**: Responsive font sizes with mobile optimization
- **Spacing System**: Consistent 4px-based spacing scale (`--kf-space-1` to `--kf-space-24`)
- **Animation Tokens**: Material Design 3 easing functions
- **Z-Index Scale**: Organized layer management (`--kf-z-modal`, `--kf-z-toast`, etc.)

#### **Component Libraries**

**Button Components** (css/button-components.css):
- **8 Variants**: Primary, Secondary, Outline, Ghost, Success, Danger, Search, Icon
- **3 Sizes**: Small (36px), Default (44px), Large (52px)
- **States**: Hover, Focus, Active, Disabled, Loading
- **Accessibility**: ARIA support, 44px touch targets, screen reader friendly
- **Mobile**: Samsung S24 Ultra (1440x3120px) + iPhone 16 Pro optimizations

**Modal Components** (css/modal-components.css):
- **4 Types**: Standard, Product Detail, Blockchain Block, Confirmation Dialog
- **Animations**: Fade-scale, Slide-up, Zoom with Material Design 3 easing
- **Integration**: Compatible with existing ModalHistoryManager
- **Responsive**: Mobile-first with safe-area support for notches/Dynamic Island
- **Performance**: Hardware acceleration, backdrop blur effects

**Form Components** (css/form-components.css):
- **All Input Types**: Text, Number, Date, File, Range, Checkbox, Radio, Select
- **Validation States**: Error, Success, Focus, Disabled with consistent styling
- **Input Groups**: With icons, buttons, help text, labels
- **Accessibility**: High contrast support, reduced motion, screen reader friendly
- **Mobile**: 16px font size (prevents iOS zoom), touch-friendly interactions

#### **Master Import** (css/kiezform-design-system.css)
```html
<!-- Recommended: Single import for new projects -->
<link rel="stylesheet" href="/css/kiezform-design-system.css">

<!-- Legacy: Individual imports still supported -->
<link rel="stylesheet" href="/css/styles.css">
<link rel="stylesheet" href="/css/admin.css">
<link rel="stylesheet" href="/css/blockchain.css">
```

#### **Design Principles**
- **Industrial Aesthetic**: Ultra-thin typography, wide letter spacing, scanline overlays
- **Mobile-First**: 44px touch targets, safe-area support, no horizontal scroll
- **Performance**: Hardware acceleration, reduced motion support, legacy browser fallbacks
- **Consistency**: Unified spacing, typography, and color systems across all components
- **Accessibility**: WCAG 2.1 AA compliance, screen reader support, keyboard navigation

#### **Migration Strategy**
- **Backward Compatible**: Existing CSS classes continue working
- **Gradual Migration**: Can replace CSS imports incrementally
- **No Breaking Changes**: Legacy components function alongside new design system
- **Performance Improvement**: Unified system reduces CSS redundancy and inconsistencies

## Development Workflow

### Local Development

#### Frontend Only (Static)
No build process required. Design system uses pure CSS imports:
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

### Testing
- Manual testing in multiple browsers
- Test product gallery filtering and modal functionality
- Verify responsive design across device sizes
- Test admin interface (if applicable)

### Making Changes

#### Adding New Products
1. Edit `products.json` to add product data
2. Follow existing structure for consistency
3. Ensure images are accessible (currently using placeholder URLs)
4. Test category filtering works with new products

#### Styling Modifications
- **Recommended**: Use unified design system (`css/kiezform-design-system.css`)
- **Legacy**: Individual CSS files still supported (`css/styles.css`, `css/admin.css`, etc.)
- **Design Tokens**: Modify CSS variables in `css/design-tokens.css` for global changes
- **Components**: Add new components following existing patterns in component libraries
- **Theme**: Industrial dark theme with subtle scanline overlay effect maintained
- **Responsive**: CSS Grid/Flexbox with mobile-first approach

#### JavaScript Enhancements
- Modern ES6+ syntax throughout
- Uses native Intersection Observer API for animations
- Event delegation pattern for dynamic content
- Async/await for data loading

## Key Features

### Smart Product Template System
The admin interface includes an intelligent template system for rapid product creation:

#### Workflow:
1. **Category Selection**: Admin selects product category from dropdown (loads from products.json)
2. **Product Template**: Second dropdown shows all products in selected category
3. **Auto-Fill**: Selecting a product auto-fills form fields (name, category, material, price, size, imageUrl)
4. **Manual Override**: All fields remain fully editable after template loading
5. **Notes Field**: Stays empty for manual input (no template auto-fill)

#### Technical Implementation:
```javascript
// Template loading from products.json
async function loadProductTemplates() {
    const response = await fetch('/products.json');
    productTemplates = await response.json();
    populateCategoryDropdown();
}

// Auto-fill form fields with template data
function loadProductData() {
    const selectedProduct = productTemplates.products.find(p => p.id === selectedProductId);
    document.getElementById('productName').value = selectedProduct.name;
    document.getElementById('imageUrl').value = selectedProduct.images?.thumb || '';
    // Notes field deliberately left empty for manual input
}
```

### VALUE Section - Verification System
- Comprehensive explanation of dual QR code verification mechanism
- **Separate 3D-Printed QR Cards**: Black card for verification, red card for transfer
- **Black QR Code**: Ownership verification system showing current owner
- **Red QR Code**: Immediate transfer system with confirmation dialogs
- **Verification Workflow**: Step-by-step process from scanning to certificate
- **Security Features**: Blockchain-based authentication, loss prevention warnings
- **Complete Integration**: Matches KiezForm industrial aesthetic with grid system
- **Mobile Responsive**: Optimized layouts for all screen sizes

### SHARE Section - Site Promotion
- **Interactive QR Code**: Generates QR code linking to main site (https://kiezform.de)
- **Web Share API**: Native sharing with fallback to clipboard
- **Toast Notifications**: User feedback for copy and share actions
- **QR Server Integration**: Uses QR Server API for reliable code generation
- **Consistent Theming**: Industrial dark aesthetic with hover effects
- **Social Sharing**: Copy-to-clipboard and native share functionality

### Product Gallery System
- Dynamic loading from JSON data
- Category-based filtering
- Image modal with thumbnail navigation
- Smooth animations and transitions
- Mobile-responsive grid layout
- Contact system via mailto links for product inquiries

### Navigation Structure
- **Restructured Navbar**: Removed legal links (Impressum/Datenschutz) from main navigation
- **Legal Footer Links**: Preserved legal compliance links in footer section
- **New Sections**: Added VALUE and SHARE links to main navigation
- **Smooth Scrolling**: Enhanced navigation with proper navbar offset calculation

### Admin Interface
- **Version Display**: Shows current version (v0.0.2) in green below header
- **Smart Product Templates**: Cascade dropdown system for quick product creation
- **Auto-Fill Forms**: Load product data from templates with full editability
- **Image URL Support**: Product thumbnail management and verification display
- **Enhanced Edit Modal**: Consistent field structure with add product form
- Secure SHA-256 authentication with salted password hashing
- Product creation and management with MongoDB integration
- Statistics dashboard with real-time data
- QR code generation for product verification
- Owner verification link system
- Toast notifications for better UX
- **Credentials**: Username: admin, Password: F3antai.led-Armari#a-Redeliv+ery

### Design System
- **Industrial Aesthetic**: Dark theme with subtle scanline overlay effects
- **Grid System**: 1px white line separators for consistent visual structure
- **Typography**: Helvetica Neue with uppercase styling and letter-spacing
- **Color Scheme**: Dark overlays (rgba(10, 10, 10, 0.8)) with white borders (rgba(255, 255, 255, 0.05))
- **Hover Effects**: Gradient overlays and border color transitions
- **Animations**: Intersection Observer for scroll-triggered animations
- **Icon Treatment**: Grayscale filters for consistent monochrome appearance
- **Version Badge Styling**: Green (#00ff00) with 80% opacity, positioned below subtitle
- **Mobile Optimization**: Responsive grid layouts and touch-friendly navigation

## Important Notes

### Current Version: v0.0.11

### Production Deployment
- **VPS IP Address**: 69.62.121.168
- **Live Site**: https://kiezform.de
- **Backend API**: Port 3000 with PM2 process management (kiezform-api)
- **Database**: MongoDB with real product data and blockchain transactions


### Product Catalog (Updated)
- **6 Chain Products**: Agama (€149), Aurora (€179), Cash4Love (€129), Cruella (€499), Goldelse (€79), Snake-Eater (€89)
- **1 Ring Product**: Brutalist Ring (€169)
- **Standardized Sizes**: All chains use ["40cm", "50cm", "60cm"]
- **Material**: All chains use "Premium-Quality PLA+"
- **Real Images**: Product URLs point to actual product photos at kiezform.de/images/products/

### Blockchain System
- **Sorting**: Fixed to chronological order by timestamp (not block number)
- **Transaction History**: 60 purchases + 4 transfers since 01.04.2025
- **All Products**: Each product has been bought at least once with realistic history
- **Explorer**: Available at /blockchain with search and filtering
- **API Endpoint**: Updated server.js to sort by `.sort({ timestamp: -1 })`

### Social Media Icons
- **Implementation**: Professional SVG icons for Instagram, Facebook, X (Twitter)
- **State**: Disabled with grayscale filter and "Coming Soon" tooltips
- **Styling**: `pointer-events: none`, `opacity: 0.3`, `filter: grayscale(100%) brightness(0.6)`
- **Applied To**: index.html and blockchain.html footers
- **X Logo**: Updated to modern X branding (replaced old Twitter bird)

### Data Management
- **Primary Storage**: MongoDB with blockchain integration
- **Product Data**: JSON file synchronized with database
- **Images**: Real product URLs (not placeholders)
- **Admin Interface**: Full CRUD operations with database persistence
- **Blockchain Integrity**: SHA-256 hash chains with validation

### Analytics Integration
- Google Analytics configured (placeholder ID - needs real tracking ID)
- IP anonymization enabled for privacy compliance

### Legal Compliance
- Dedicated pages for German legal requirements (Impressum, Datenschutz)
- Privacy-focused analytics configuration

## Version History

### v0.0.12 (Current) - UI/UX Improvements & Product Management
- ✅ **Removed Price Toggle from Blockchain**: Prices no longer shown/toggleable on blockchain page
- ✅ **Enhanced Transfer Page Display**: 
  - Shows product price prominently (€ amount in green)
  - Displays both USR pseudonym AND real owner name for transparency
  - Enhanced product information (serial number, category)
  - Improved visual styling with color-coded information
- ✅ **Redesigned Blockchain Block Details Dialog**:
  - New responsive grid layout (2 columns desktop, 1 column mobile) 
  - No collapsible sections - all information immediately visible
  - Better space utilization across all device sizes
  - 4 organized cards: Main info, Timestamp, Ownership transfer, Technical details
- ✅ **Product Active/Inactive Management**:
  - Admin interface: checkbox to toggle product visibility on main page
  - Inactive products hidden from main page but still verifiable via QR codes
  - Visual indicators in admin panel (red "INACTIVE" badge)
- ✅ **Backend API Enhancements**:
  - New `/api/products/active` endpoint for filtering active products
  - Extended transfer API to include price and real owner names
  - Added `isActive` field to product schema (default: true)

### v0.0.11 - Transfer Flow Improvements
- ✅ **Confirmation Dialog Implementation**: Added missing security confirmation to transfer.html
  - **Unified UX**: Both transfer.html and owner-verify.html now have identical confirmation dialogs
  - **Security Warning**: "ENDGÜLTIG und kann NICHT rückgängig gemacht werden!" with visual warning
  - **Promise-based Dialog**: Clean async/await implementation with ESC key and button handling
  - **Industrial Theme**: Consistent dark theme with red accent borders and proper animations
- ✅ **Owner Name Display Fix**: Resolved USR- pseudonym showing instead of real names
  - **Backend Enhancement**: `/api/transfer/complete` now returns both `newOwner` (pseudonym) and `newOwnerName` (real name)
  - **Frontend Update**: Success screen displays "Neuer Eigentümer: [Real Name]" instead of cryptic USR- codes
  - **Fallback Support**: `${data.newOwnerName || data.newOwner}` ensures backward compatibility
  - **Improved UX**: Clear separation between user-friendly names and technical blockchain identifiers
- ✅ **E11000 Duplicate Key Error Resolution**: Fixed critical MongoDB indexing issue
  - **Root Cause**: Mongoose schema had `unique: true` on `productId` preventing multiple transfer QRs per product
  - **Schema Fix**: Removed unique constraint and implemented proper compound index with partial filter
  - **Collection Recreation**: Complete MongoDB collection rebuild to eliminate problematic indexes
  - **Index Optimization**: Only `qrToken` remains unique, multiple transfer QRs per product now supported
  - **Transfer QR Generation**: Force regeneration now works correctly without database conflicts
- ✅ **Complete Transfer Flow Testing**: End-to-end verification of ownership transfer system
  - **Confirmation Flow**: Dialog → Backend API → Blockchain Update → Success Display
  - **Data Integrity**: Proper pseudonym generation, blockchain recording, and QR invalidation/regeneration
  - **User Experience**: Smooth transition from security warning to successful completion message
  - **Mobile Compatibility**: Touch-optimized dialogs with proper safe-area support

### v0.0.9 - Global Modal History Manager
- ✅ **Complete Design System Implementation**: Eliminated all design inconsistencies
  - **150+ Design Tokens**: Comprehensive CSS variable system (`--kf-*` namespace)
  - **Component Libraries**: Unified buttons, modals, forms with consistent styling
  - **Master Import**: Single CSS file import for entire design system
  - **Backward Compatibility**: Legacy CSS files still supported for gradual migration
  - **No Build Process**: Pure CSS imports maintain simple deployment workflow
- ✅ **Button Component Library**: 8 variants with accessibility and mobile optimization
  - Primary, Secondary, Outline, Ghost, Success, Danger, Search, Icon buttons
  - 3 sizes (Small 36px, Default 44px, Large 52px) with touch-friendly targets
  - Loading states, focus indicators, keyboard navigation support
  - Samsung S24 Ultra and iPhone 16 Pro specific optimizations
- ✅ **Modal Component Library**: 4 specialized modal types with advanced animations
  - Standard, Product Detail, Blockchain Block, Confirmation Dialog variants
  - Material Design 3 compliant animations (emphasized easing, proper timing)
  - Integration with existing ModalHistoryManager for mobile back button support
  - Hardware acceleration and performance optimizations
- ✅ **Form Component Library**: Complete form system with validation and accessibility
  - All input types (text, number, date, file, range, checkbox, radio, select)
  - Validation states (error, success, focus, disabled) with consistent styling
  - Input groups with icons, buttons, help text, and labels
  - Mobile optimizations (16px font size prevents iOS zoom, touch-friendly)
- ✅ **Industrial Design Consistency**: Maintained aesthetic while improving structure
  - Scanline overlay effects preserved across all components
  - Ultra-thin typography and wide letter spacing for technical aesthetic
  - Monospace elements for technical data (block IDs, serial numbers)
  - Dark theme with consistent color hierarchy
- ✅ **Performance & Accessibility Enhancements**:
  - Hardware acceleration for animated elements (`will-change`, `transform3d`)
  - Reduced motion support for accessibility preferences
  - High contrast mode support for vision accessibility
  - WCAG 2.1 AA compliance with proper focus indicators and screen reader support
  - Legacy browser fallbacks with graceful degradation
- ✅ **Migration Strategy**: Zero breaking changes with progressive enhancement
  - Existing CSS classes continue functioning (`.cta-button`, `.filter-btn`, etc.)
  - New unified classes available for better consistency (`.btn-primary`, `.btn-secondary`)
  - Gradual migration path allows incremental adoption
  - Documentation updated with integration examples and best practices

### v0.0.9
- **Global Modal History Manager**: Revolutionary mobile back button handling system
  - `ModalHistoryManager` class in `main.js` with complete History API integration
  - Samsung S24 Ultra (6.8", 1440x3120px) and iPhone 16 Pro (6.3", 1206x2622px) specific optimizations  
  - Browser `pushState`/`popstate` handling for proper modal navigation on mobile
  - Modal stack management supporting nested/stacked modals with proper cleanup
  - Body scroll prevention with `modal-active` CSS class during modal display
  - Global ESC key handler replacing individual modal keyboard listeners
- **Ultra-Smooth AAA-Quality Search Animations**: Professional blockchain search experience
  - Complete redesign from red/green to elegant monochrome color scheme
  - Meteor/FastLED style animations with silky-smooth 3-step keyframes
  - Hardware-accelerated animations using `transform3d` and `will-change`
  - Fade-out transitions for existing search results before new searches
  - 40ms stagger timing for ultra-smooth block result animations
  - Removed emoji from search headers, using clean white text
- **Complete Modal Integration Across All Pages**: Unified modal behavior
  - Blockchain Explorer: Block details modal integrated with history manager
  - Product Gallery: Product detail modal with mobile back button support
  - Admin Interface: Edit product and confirmation dialogs fully integrated
  - Custom themed dialogs with Promise-based async handling
- **Samsung S24 Ultra Mobile Optimization**: Device-specific enhancements
  - CSS media queries targeting 1440x3120px display resolution  
  - Touch-optimized 44px minimum target sizes for accessibility compliance
  - Safe area support for modern device features (notch/Dynamic Island)
  - Hardware-accelerated transitions and animations
- **Advanced Search UX Improvements**: Professional search interface
  - Removed all red/reddish colors from blockchain page (now white)
  - Professional fade-out animations when clearing search results
  - Enhanced search loading states with proper input feedback
  - Haptic feedback patterns for mobile success/error states
  - Clean, emoji-free search result displays with better typography

### v0.0.8
- **Terms of Service Implementation**: Complete legal framework for digital certificate sales
  - Created comprehensive `nutzungsbedingungen.html` emphasizing digital certificate as main product
  - Jewelry positioned as free gift/addition to digital blockchain certificate
  - Professional legal language with friendly tone, German law compliance
  - Consistent styling with other legal pages (impressum/datenschutz)
  - Footer navigation updated across all pages to include "Nutzungsbedingungen"
- **Complete German Localization & Personalization**:
  - **Formal to Informal Addressing**: Converted all "Sie/Ihren" to "du/deinen" across entire site
  - **Personal Content Enhancement**: Added direct user addressing for emotional connection
    - "Präzisionsdruck": "für perfekte Details, die dich begeistern werden"
    - "Einzigartige Formen": "die dich zum Staunen bringen"
    - "Made in Berlin": "jedes Stück ein Unikat aus deiner Hauptstadt"
  - **Owner-Verify Translation**: Complete German translation with consistent "du" form
  - **Transfer Page Translation**: Unified informal addressing, footer localization
- **Custom Themed Dialog System**: Professional replacement for browser dialogs
  - **Admin Interface**: Custom confirmation dialogs matching KiezForm industrial theme
  - **Features**: Dark backdrop, blur effects, smooth animations, ESC key support
  - **German Localization**: "Bestätigung erforderlich", "JA, FORTFAHREN", "ABBRECHEN"
  - **Theme Integration**: rgba borders, glow effects, consistent typography
- **Owner-Verify Page Optimization**: Enhanced user experience and navigation
  - **Complete Navbar**: Added missing menu items (VALUE, SHARE, BLOCKCHAIN)
  - **Professional Layout**: Improved spacing, larger containers, better visual hierarchy
  - **Enhanced Verification Display**: Larger checkmark, better typography, glow effects
  - **Responsive Design**: Optimized margins, paddings, and mobile layouts
- **FAQ Complete Redesign**: Unified styling with legal pages
  - **Layout Overhaul**: Removed hero section, implemented legal page structure
  - **Theme Consistency**: Uses legal.css for unified appearance with impressum/datenschutz
  - **German Localization**: "Sie" to "du" conversion, German footer ("Alle Rechte vorbehalten")
  - **Professional Structure**: Added "Stand: August 2025", consistent content hierarchy

### v0.0.7
- **Simplified Transfer System**: Complete overhaul of ownership transfer mechanism
  - Eliminated complex 24-hour email system in favor of immediate transfers
  - Red QR codes now lead to owner-verify.html with mode=transfer parameter
  - Unified verification/transfer interface with modal confirmation dialogs
  - Clear security warnings before irreversible transfers
  - Automatic QR regeneration after successful transfers
  - Backend endpoint `/api/transfer/simple` for immediate processing
- **Separate QR Cards Documentation**: Updated all documentation for 3D-printed card system
  - FAQs completely rewritten with transfer process prioritized
  - Strong warnings about red QR code loss prevention
  - Clear explanation of black (verification) vs red (transfer) card purposes
  - Support procedures for lost red QR codes (critical situation)
  - README.md and CLAUDE.md updated with new system details

### v0.0.6
- **3D Print Integration**: Complete STL generation system for QR codes
  - Python script `qr_to_stl.py` for converting QR codes to 3D-printable STL files
  - Admin panel STL download buttons for both owner and transfer QR codes
  - 40x40x1mm format optimized for jewelry integration with 0.5mm QR height
  - Backend API endpoint `/api/admin/generate-stl-qr/:type/:productId`
  - Child process integration with Python script execution
  - Automatic file naming with timestamps and product identification
  - Error handling and temporary file cleanup system
- **VPS Deployment**: Complete Python environment setup on production VPS
  - Installed numpy-stl, PIL, qrcode dependencies via apt and pip
  - Fixed authentication middleware (`authenticateAdmin`) for STL endpoints
  - Tested and verified STL generation functionality in production
  - PM2 process management maintains backend API stability
- **Red Border Fix**: Removed thin red border from transfer QR codes
  - Changed QR Server API parameters from `bgcolor=dc2c3f` to `bgcolor=ffffff&color=dc2c3f`
- **QR Regeneration Fix**: Allow creating new QR codes after invalidation
  - Modified duplicate prevention logic to only check `status: 'active'`
- **FAQ Updates**: Complete rewrite for 3D-printed QR codes
  - Updated all references from PVC cards to 3D-printed QR codes integrated into jewelry
  - Revised support procedures and cost structure for physical QR damage

### v0.0.5
- **Product Catalog Standardization**: Updated products.json with real chains
  - 6 new chain products: Agama, Aurora, Cash4Love, Cruella, Goldelse, Snake-Eater
  - 1 ring product: Brutalist Ring with real product images
  - Standardized all chains: ["40cm", "50cm", "60cm"] sizes, "Premium-Quality PLA+" material
  - Removed placeholder products and Binary/Techno chains
  - Updated pricing: Cruella (€499), Goldelse (€79), Snake-Eater (€89), Brutalist Ring (€169)
- **VPS Deployment**: Fixed IP address and blockchain sorting
  - Corrected VPS IP from 194.164.72.75 to 69.62.121.168
  - Fixed blockchain explorer sorting: chronological by timestamp instead of block number
  - Updated database with real products and 60 purchases + 4 transfers since 01.04.2025
  - All products bought at least once with realistic transaction history
- **Social Media Icons**: Professional SVG implementation
  - Replaced emoji links (📷📘🐦) with disabled SVG logos
  - Instagram, Facebook, and X (modern Twitter) SVG icons
  - Grayscale disabled state with "Coming Soon" tooltips
  - Applied across index.html and blockchain.html
  - CSS styling: pointer-events: none, opacity: 0.3, grayscale filter
- **VERIFIKATIONSPROZESS**: Fixed to exactly 6 security features
  - Removed redundant "Live Blockchain Explorer" item
  - Clean 6-step verification workflow as requested

### v0.0.4
- **Blockchain System**: Complete SHA-256 hash-based blockchain implementation
  - MongoDB schemas for blocks, products, and transfer requests
  - Pseudonym system (USR-XXXXXXXX) for privacy protection
  - MINT and TRANSFER transaction types with hash validation
  - Genesis block initialization with chain integrity
- **Blockchain Explorer**: Visual blockchain interface (/blockchain)
  - Grid and chain view modes with pagination
  - Real-time search across blocks, products, and owners
  - Red highlighting for search results with subtle glow effects
  - Block detail modals with complete transaction information
  - Mobile-responsive with industrial KiezForm styling
- **Transfer System**: QR-based ownership transfers (/transfer)
  - 24-hour expiration with countdown timer
  - Transfer acceptance workflow with blockchain integration
  - Automatic pseudonym generation for new owners
  - Secure token-based transfer links
- **Section Title Styling**: Industrial theme for all page headlines
  - Ultra-thin typography (font-weight: 100) with wide letter-spacing (0.3em)
  - Gradient underline effects with subtle glow
  - Mobile-responsive with consistent spacing
  - Matches existing VALUE and SHARE section styling

### v0.0.3
- **VALUE Section**: Comprehensive dual QR code verification system explanation
  - Physical 3D-printed QR code for authenticity verification
  - Red QR code for secure ownership transfer
  - Step-by-step verification workflow
  - Security features with blockchain-based authentication
- **SHARE Section**: Interactive site sharing functionality
  - QR code generation linking to main site (kiezform.de)
  - Web Share API integration with clipboard fallback
  - Toast notification system for user feedback
- **Navigation Restructure**: Removed legal links from navbar, added VALUE/SHARE
- **Complete Theme Integration**: Industrial KiezForm aesthetic across all sections
  - Grid system with 1px white separators
  - Dark overlays and hover effects
  - Consistent typography and animations
  - Mobile-responsive design

### v0.0.2
- **Smart Product Template System**: Cascade dropdowns for quick product creation
- **Auto-Fill Forms**: Template-based form population with full editability
- **Image URL Support**: Product thumbnail management and verification display
- **Enhanced Edit Modal**: Consistent field structure with add product form
- **Improved Styling**: Consistent input field styling across all types
- Admin panel displays version number in header
- Unified project structure (merged kiezform-verification)
- Complete backend API with MongoDB integration
- Secure SHA-256 authentication with salt
- Toast notifications system
- PM2 process management configuration

### Previous Versions
- v3.0: Backend API integration
- v2.0: Admin panel and verification system
- v1.0: Basic product gallery