# KiezForm

A comprehensive e-commerce and product verification system for a Berlin-based 3D-printed jewelry brand. Combines a static frontend website with a complete backend API for product verification, authentication, and admin management.

## 🌟 Features

- **Product Gallery**: Dynamic showcase of chains and rings with category filtering
- **Blockchain System**: SHA-256 hash-based blockchain for certificate ownership tracking
- **Blockchain Explorer**: Visual blockchain interface with search and block navigation
- **Admin Dashboard**: Secure product management with MongoDB integration
- **Backend API**: Full Express.js REST API with JWT authentication
- **Verification System**: QR codes and secure share links for ownership verification  
- **Transfer System**: QR-based ownership transfers with 24-hour expiration
- **Product Database**: MongoDB with comprehensive product and user management
- **VALUE Section**: Comprehensive dual QR code verification system explanation
- **SHARE Section**: Interactive QR code for site sharing with Web Share API
- **Mobile-First**: Responsive design with hamburger navigation
- **Clean URLs**: No .html extensions with automatic redirects
- **Dark Theme**: Industrial aesthetic with subtle scanline effects

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **Backend**: Node.js/Express (Port 3000), MongoDB, JWT Authentication
- **Data**: JSON file-based product catalog + MongoDB for verification
- **Styling**: Custom CSS with Grid/Flexbox, dark industrial theme
- **Security**: SHA-256 password hashing, bcrypt, constant-time comparison
- **Deployment**: PM2 process management, Nginx static serving + API proxy

### File Structure
```
kiezform/
├── index.html              # Main landing page
├── admin.html              # Admin dashboard
├── blockchain.html         # Blockchain explorer interface
├── transfer.html           # Ownership transfer acceptance page
├── owner-verify.html       # Ownership verification page
├── impressum.html          # Legal imprint (German)
├── datenschutz.html        # Privacy policy (German)
├── products.json           # Product catalog data
├── backend/                # Node.js/Express backend API
│   ├── server.js           # Main API server
│   ├── init-admin.js       # Admin initialization script
│   ├── ecosystem.config.js # PM2 configuration
│   ├── package.json        # Backend dependencies
│   └── .env               # Environment variables
├── public/                 # Static assets for verification
├── admin/                  # Additional admin resources
├── css/
│   ├── styles.css          # Main site styles with section title styling
│   ├── admin.css           # Admin interface styles
│   ├── blockchain.css      # Blockchain explorer styles
│   └── legal.css           # Legal pages styles
├── js/
│   ├── main.js             # General functionality + QR generation/sharing
│   ├── products.js         # Product gallery system
│   ├── blockchain.js       # Blockchain explorer functionality
│   └── admin.js            # Secure admin functionality
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
- Keyboard navigation (ESC to close)
- mailto link generation

### Admin Dashboard (`js/admin.js`)  
- **Version Display**: Shows current version (v0.0.2) in header
- **Smart Product Templates**: Cascade dropdown system for quick product creation
- **Auto-Fill Forms**: Load product data from templates with full editability
- **Image URL Support**: Product thumbnail management and display
- Secure SHA-256 authentication with salt
- Product CRUD operations with MongoDB integration
- Owner management and editing
- Share link generation with secure tokens
- QR code creation for verification
- Toast notifications for better UX
- Real-time statistics dashboard
- Fallback to localStorage for offline mode

### Blockchain Explorer (`js/blockchain.js`)
- Visual blockchain interface with grid and chain views
- Real-time search across blocks, products, and owners
- Pagination and infinite scroll support
- Red highlighting for search results
- Block detail modals with transaction information
- Mobile-responsive design with KiezForm industrial styling

### Ownership Verification (`owner-verify.html`)
- Token-based verification system
- Product authenticity confirmation
- **Product Image Display**: Shows product thumbnails with error handling
- Owner badge display
- Integration with admin-generated links

### Transfer System (`transfer.html`)
- QR-based ownership transfer acceptance
- 24-hour expiration system with countdown timer
- Blockchain integration for permanent ownership records
- Pseudonym-based privacy protection

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

## 🎨 Design System

### Color Palette
- **Background**: Dark grays (#0a0a0a, #1a1a1a)
- **Text**: White (#fff) and light gray (#e0e0e0)
- **Accent**: Neon green (#00ff00) - used for version badges and highlights
- **Version Display**: Green (#00ff00) with 80% opacity
- **Borders**: Semi-transparent white

### Typography
- **Primary Font**: Helvetica Neue
- **Fallbacks**: Arial, sans-serif
- **Weights**: 300 (light), 400 (normal), 600 (semibold), 700 (bold)

### Effects
- Subtle scanline overlay for industrial aesthetic
- Smooth CSS transitions (0.3s)
- Intersection Observer animations
- Box shadows for depth

## 🌐 Deployment

### Static Hosting
Compatible with any static hosting service:
- Netlify
- Vercel  
- GitHub Pages
- Traditional web hosting

### Production Deployment (VPS: 69.62.121.168)

**Unified Directory Structure:**
```
/var/www/html/kiezform/
├── Frontend files (HTML, CSS, JS)
└── backend/
    ├── server.js (Port 3000)
    ├── ecosystem.config.js (PM2)
    └── .env (Environment)
```

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

- Responsive grid layouts
- Touch-friendly navigation
- Optimized form inputs
- No horizontal scrolling
- Hamburger menu for small screens

## 📊 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/verify/:id` - Product verification
- `GET /api/qrcode/:id` - QR code generation

### Blockchain Endpoints
- `GET /api/blockchain/blocks` - Get blockchain blocks
- `GET /api/blockchain/search/:query` - Search blockchain
- `GET /api/blockchain/stats` - Blockchain statistics
- `GET /api/transfer/:token` - Get transfer request
- `POST /api/transfer/:token/accept` - Accept ownership transfer

### Admin Endpoints (Authentication required)
- `POST /api/admin/login` - Admin login
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/stats` - Get statistics

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
3. **QR Code**: System generates unique QR code
4. **Packaging**: QR code is printed on packaging/card
5. **Sale**: Customer receives product with QR code
6. **Verification**: Customer scans code → authenticity certificate

## 📱 QR Code Integration

QR codes contain links to verification page:
- Format: `https://kiezform.de/owner-verify?token={token}&product={productId}`
- Error correction: Medium (M) level
- Size: 300x300px via QR Server API
- High contrast black/white for maximum readability

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

## 🏷️ Version History

### v0.0.5 (Latest)
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
- ✅ **Transfer System**: QR-based ownership transfers (/transfer)
  - 24-hour expiration with countdown timer
  - Transfer acceptance workflow with blockchain integration
  - Automatic pseudonym generation for new owners
  - Secure token-based transfer links
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