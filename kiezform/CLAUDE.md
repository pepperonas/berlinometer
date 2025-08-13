# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KiezForm is a static e-commerce website for a Berlin-based 3D-printed jewelry brand. The site showcases two main product categories (chains and rings) with a focus on industrial aesthetics and sustainable materials. The application is built as a client-side single-page application using vanilla JavaScript with no build process required.

## Architecture

### File Structure
- `index.html` - Main landing page and product showcase
- `admin.html` - Admin dashboard for product management (demo/prototype)
- `products.json` - Product catalog data source
- `js/main.js` - General site functionality (smooth scrolling, animations)
- `js/products.js` - Product gallery and modal system
- `js/admin.js` - Admin interface functionality
- `css/styles.css` - Main site styles with dark industrial theme
- `css/admin.css` - Admin dashboard styles  
- `css/legal.css` - Legal pages (impressum/datenschutz) styles

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **Data**: JSON file-based product catalog
- **Styling**: Custom CSS with CSS Grid/Flexbox, dark theme with scanline effects
- **No Build Process**: Direct file serving, no bundler or compiler needed

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
No build process required. Serve files using any static web server:
```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
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

### Admin Interface (Prototype)
- Basic authentication with hardcoded credentials (admin/admin123)
- Product creation form with API integration
- Statistics dashboard
- Tab-based interface
- **Important**: Admin interface makes API calls to non-existent endpoints (/api/admin/login, /api/products, /api/stats) - this is a prototype UI demonstration only

### Design System
- Dark industrial aesthetic with subtle scanline effects
- Consistent typography using Helvetica Neue
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