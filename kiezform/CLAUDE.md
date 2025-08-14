# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KiezForm is a comprehensive e-commerce and product verification system for a Berlin-based 3D-printed jewelry brand. The project combines a static frontend website showcasing jewelry products with a complete backend API for product verification, authentication, and admin management. The site features two main product categories (chains and rings) with industrial aesthetics and sustainable materials.

## Architecture

### File Structure
- `index.html` - Main landing page and product showcase with section titles
- `admin.html` - Admin dashboard for product management 
- `blockchain.html` - Blockchain explorer interface with visual block representation
- `transfer.html` - Ownership transfer acceptance page with countdown timer
- `owner-verify.html` - Product ownership verification page
- `products.json` - Product catalog data source
- `js/main.js` - General site functionality (smooth scrolling, animations, QR generation, sharing)
- `js/products.js` - Product gallery and modal system
- `js/blockchain.js` - Blockchain explorer with search and pagination
- `js/admin.js` - Admin interface with secure authentication
- `css/styles.css` - Main site styles with industrial section title styling
- `css/blockchain.css` - Blockchain explorer styles with KiezForm industrial theme
- `css/admin.css` - Admin dashboard styles  
- `css/legal.css` - Legal pages (impressum/datenschutz) styles
- `backend/` - Node.js/Express backend API with blockchain functionality
- `public/` - Static assets for verification system
- `admin/` - Additional admin resources

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **Backend**: Node.js/Express, MongoDB, JWT Authentication
- **Blockchain**: SHA-256 hash-based blockchain simulation with MongoDB storage
- **Data**: JSON file-based product catalog + MongoDB for verification and blockchain
- **Styling**: Custom CSS with CSS Grid/Flexbox, dark theme with scanline effects
- **Security**: SHA-256 password hashing, JWT tokens, bcrypt, blockchain integrity
- **Deployment**: PM2 process management, Nginx reverse proxy

### Core Components

#### ProductGallery Class (js/products.js)
Central component managing the product catalog interface:
- Loads products from `products.json` via fetch API
- Handles category filtering (all, chains, rings)
- Manages product modal with image gallery
- Implements keyboard navigation (ESC to close modal)
- Generates mailto links for product inquiries

#### Blockchain Explorer (js/blockchain.js)
Visual blockchain interface with comprehensive functionality:
- **Multiple Views**: Grid and chain view modes for different perspectives
- **Real-time Search**: Search across blocks, products, owners, and transaction types
- **Visual Highlighting**: Red highlighting for search results with subtle glow effects
- **Block Details**: Modal system showing complete transaction information
- **Pagination**: Efficient loading with page-based navigation
- **Mobile Responsive**: Optimized for all screen sizes with KiezForm industrial styling
- **Live Updates**: Real-time blockchain statistics and block counting

#### Transfer System (transfer.html)
QR-based ownership transfer workflow:
- **24-Hour Expiration**: Secure time-limited transfer links with countdown timer
- **Token Validation**: Server-side verification of transfer tokens
- **Blockchain Integration**: Automatic TRANSFER transaction creation upon acceptance
- **Pseudonym Generation**: Privacy-protected ownership with USR-XXXXXXXX codes
- **Error Handling**: Comprehensive validation and user feedback

#### Admin Dashboard System (js/admin.js)
Comprehensive admin interface with smart features:
- **Smart Template System**: Cascade dropdowns loading from products.json
- **Auto-Fill Forms**: Template-based form population with full editability
- **Product Management**: CRUD operations with MongoDB integration
- **Image URL Support**: Product thumbnail management and display
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
    transferMethod: "QR_CODE|ADMIN_MINT"
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

## Development Workflow

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
- Main styles in `css/styles.css`
- Industrial dark theme with subtle scanline overlay effect
- Uses CSS custom properties for consistent theming
- Responsive grid layout for product gallery

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
- **3D-Printed QR Code**: Physical authenticity proof integrated into jewelry design
- **Red QR Code**: Secure ownership transfer system for gifts and resale
- **Verification Workflow**: Step-by-step process from scanning to certificate
- **Security Features**: Blockchain-based authentication, unique 3D structures
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

### Static Hosting Compatible
- No server-side processing required
- All functionality runs in browser
- Can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages)

### Data Management
- Products stored in JSON file
- No database integration
- Images referenced by URL (currently placeholders)
- Admin interface is client-side only (not persistent)

### Analytics Integration
- Google Analytics configured (placeholder ID)
- IP anonymization enabled for privacy compliance

### Legal Compliance
- Dedicated pages for German legal requirements (Impressum, Datenschutz)
- Privacy-focused analytics configuration

## Version History

### v0.0.4 (Current)
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