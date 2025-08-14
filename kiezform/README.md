# KiezForm

A comprehensive e-commerce and product verification system for a Berlin-based 3D-printed jewelry brand. Combines a static frontend website with a complete backend API for product verification, authentication, and admin management.

## 🌟 Features

- **Product Gallery**: Dynamic showcase of chains and rings with category filtering
- **Admin Dashboard**: Secure product management with MongoDB integration
- **Backend API**: Full Express.js REST API with JWT authentication
- **Verification System**: QR codes and secure share links for ownership verification  
- **Product Database**: MongoDB with comprehensive product and user management
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
│   ├── styles.css          # Main site styles
│   ├── admin.css           # Admin interface styles
│   └── legal.css           # Legal pages styles
├── js/
│   ├── main.js             # General functionality
│   ├── products.js         # Product gallery system
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
- `products`: Product catalog with metadata
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
- Secure SHA-256 authentication with salt
- Product CRUD operations with MongoDB integration
- Owner management and editing
- Share link generation with secure tokens
- QR code creation for verification
- Toast notifications for better UX
- Real-time statistics dashboard
- Fallback to localStorage for offline mode

### Ownership Verification (`owner-verify.html`)
- Token-based verification system
- Product authenticity confirmation
- Owner badge display
- Integration with admin-generated links

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

### Production Deployment (VPS)

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
server {
    listen 80;
    server_name kiezform.de;
    root /var/www/html/kiezform;
    
    # API Routes - Direct backend proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
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

### v0.0.2 (Latest)
- ✅ Admin panel version display with v0.0.2 badge
- ✅ Unified project structure (merged kiezform-verification)
- ✅ Complete backend API with MongoDB integration
- ✅ Secure SHA-256 authentication system with salt
- ✅ JWT token-based API authentication
- ✅ Toast notifications replacing alert dialogs
- ✅ PM2 process management for production
- ✅ Enhanced admin dashboard with real-time statistics

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