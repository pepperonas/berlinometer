# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KiezForm is a comprehensive e-commerce and product verification system for a Berlin-based 3D-printed jewelry brand. The project combines a static frontend website showcasing jewelry products with a complete backend API for product verification, authentication, and admin management. The site features two main product categories (chains and rings) with industrial aesthetics and sustainable materials.

## Architecture

### File Structure
- `index.html` - Main landing page and product showcase
- `admin.html` - Admin dashboard for product management 
- `owner-verify.html` - Product ownership verification page
- `products.json` - Product catalog data source
- `js/main.js` - General site functionality (smooth scrolling, animations)
- `js/products.js` - Product gallery and modal system
- `js/admin.js` - Admin interface with secure authentication
- `css/styles.css` - Main site styles with dark industrial theme
- `css/admin.css` - Admin dashboard styles  
- `css/legal.css` - Legal pages (impressum/datenschutz) styles
- `backend/` - Node.js/Express backend API
- `public/` - Static assets for verification system
- `admin/` - Additional admin resources

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **Backend**: Node.js/Express, MongoDB, JWT Authentication
- **Data**: JSON file-based product catalog + MongoDB for verification
- **Styling**: Custom CSS with CSS Grid/Flexbox, dark theme with scanline effects
- **Security**: SHA-256 password hashing, JWT tokens, bcrypt
- **Deployment**: PM2 process management, Nginx reverse proxy

### Core Components

#### ProductGallery Class (js/products.js)
Central component managing the product catalog interface:
- Loads products from `products.json` via fetch API
- Handles category filtering (all, chains, rings)
- Manages product modal with image gallery
- Implements keyboard navigation (ESC to close modal)
- Generates mailto links for product inquiries

#### Product Data Structure (products.json)
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

### Product Gallery System
- Dynamic loading from JSON data
- Category-based filtering
- Image modal with thumbnail navigation
- Smooth animations and transitions
- Mobile-responsive grid layout
- Contact system via mailto links for product inquiries

### Admin Interface
- **Version Display**: Shows current version (v0.0.2) in green below header
- Secure SHA-256 authentication with salted password hashing
- Product creation and management with MongoDB integration
- Statistics dashboard with real-time data
- QR code generation for product verification
- Owner verification link system
- Toast notifications for better UX
- **Credentials**: Username: admin, Password: F3antai.led-Armari#a-Redeliv+ery

### Design System
- Dark industrial aesthetic with subtle scanline effects
- Consistent typography using Helvetica Neue
- **Version Badge Styling**: Green (#00ff00) with 80% opacity, positioned below subtitle
- Smooth scroll navigation
- Intersection Observer animations for feature cards

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

### v0.0.2 (Current)
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