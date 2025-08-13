# KiezForm

A static e-commerce website for a Berlin-based 3D-printed jewelry brand showcasing industrial aesthetics and sustainable materials.

## 🌟 Features

- **Product Gallery**: Dynamic showcase of chains and rings with category filtering
- **Admin Dashboard**: Complete product management system with owner verification
- **Authenticity System**: QR codes and share links for ownership verification  
- **Mobile-First**: Responsive design with hamburger navigation
- **Clean URLs**: No .html extensions with automatic redirects
- **Dark Theme**: Industrial aesthetic with subtle scanline effects

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **Data**: JSON file-based product catalog
- **Styling**: Custom CSS with Grid/Flexbox, dark industrial theme
- **Build**: No build process - direct file serving

### File Structure
```
kiezform/
├── index.html              # Main landing page
├── admin.html              # Admin dashboard
├── owner-verify.html       # Ownership verification page
├── impressum.html          # Legal imprint (German)
├── datenschutz.html        # Privacy policy (German)
├── products.json           # Product catalog data
├── css/
│   ├── styles.css          # Main site styles
│   ├── admin.css           # Admin interface styles
│   └── legal.css           # Legal pages styles
├── js/
│   ├── main.js             # General functionality
│   ├── products.js         # Product gallery system
│   └── admin.js            # Admin panel functionality
└── images/                 # Static assets and favicons
```

## 🚀 Quick Start

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

### Admin Access

Navigate to `/admin` and login with:
- **Username**: admin
- **Password**: admin123

*Note: This is demo mode with localStorage persistence*

## 📱 Core Components

### Product Gallery (`js/products.js`)
- Loads products from `products.json`
- Category filtering (chains, rings, all)
- Modal system with image carousel
- Keyboard navigation (ESC to close)
- mailto link generation

### Admin Dashboard (`js/admin.js`)  
- Product CRUD operations
- Owner management and editing
- Share link generation with secure tokens
- QR code creation for verification
- localStorage persistence for demo mode

### Ownership Verification (`owner-verify.html`)
- Token-based verification system
- Product authenticity confirmation
- Owner badge display
- Integration with admin-generated links

## 🛡️ Security Features

### Admin Interface
- Demo authentication with fallback to API
- XSS protection with HTML escaping
- Secure token generation for share links
- Input validation and sanitization

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
- **Accent**: Neon green (#00ff00)
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

### Nginx Configuration
For clean URLs without .html extensions:

```nginx
# Remove .html extensions
if ($request_uri ~ ^/(.*)\.html(\?.*)?$) {
    return 301 /$1$2;
}

# Serve files with .html extension
location / {
    try_files $uri $uri.html $uri/ =404;
}
```

## 📱 Mobile Optimization

- Responsive grid layouts
- Touch-friendly navigation
- Optimized form inputs
- No horizontal scrolling
- Hamburger menu for small screens

## 🔧 Configuration

### Google Analytics
Update the tracking ID in `index.html`:
```javascript
gtag('config', 'YOUR-GA-TRACKING-ID');
```

### Contact Information  
Update email addresses in:
- Product inquiry mailto links (`js/products.js`)
- Legal pages contact details

### Product Images
Replace placeholder URLs in `products.json` with actual image paths.

## 🏷️ Version History

### v2.0 (Latest)
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