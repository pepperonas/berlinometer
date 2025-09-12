# Popular Times App - Private Setup Documentation

**⚠️ PRIVATE - NOT FOR PUBLIC REPO**

## Overview
Popular Times ist eine Dual-Domain Web-Applikation zum Scraping von Google Maps Auslastungsdaten. Die App läuft auf zwei separaten Domains mit identischer Funktionalität aber unterschiedlichen Konfigurationen.

## Domain Architecture

### Production Domains
- **Primary**: `https://mrx3k1.de/popular-times/` 
- **Mirror**: `https://berlinometer.de/`
- **Server IP**: `69.62.121.168`

### Domain Configuration
```
mrx3k1.de/popular-times/     ← Subdirectory deployment
berlinometer.de/             ← Root deployment
```

## Technical Stack

### Frontend
- **Framework**: React + Vite
- **Build System**: Dual Vite configs für beide Domains
- **Service Worker**: PWA mit Cache-Management
- **Styling**: CSS Custom Properties + Responsive Design

### Backend API
- **Server**: Node.js auf Port `5044`
- **Endpoints**: 
  - `/default-locations` - Standard Location Liste
  - `/latest-scraping` - Letzte Scraping-Ergebnisse
  - `/scrape` - Scraping Start-Endpoint

### Server Setup
- **OS**: Linux VPS
- **Webserver**: Nginx (Reverse Proxy)
- **Process Manager**: PM2 für Backend Service
- **SSL**: Let's Encrypt Certificates

## Build Configuration

### mrx3k1 Domain
**File**: `vite.config.mrx3k1.js`
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/popular-times/',
  build: {
    outDir: 'build-mrx3k1',
    assetsDir: 'assets',
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://mrx3k1.de/api/popular-times')
  }
})
```

### berlinometer Domain  
**File**: `vite.config.berlinometer.js`
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'build-berlinometer',
    assetsDir: 'assets',
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://berlinometer.de')
  }
})
```

## API Endpoint Mapping

### mrx3k1.de API Structure
```
https://mrx3k1.de/api/popular-times/default-locations
https://mrx3k1.de/api/popular-times/latest-scraping
https://mrx3k1.de/api/popular-times/scrape
```

### berlinometer.de API Structure  
```
https://berlinometer.de/default-locations
https://berlinometer.de/latest-scraping
https://berlinometer.de/scrape
```

## Nginx Configuration

### mrx3k1.de
**Path**: Standard Apache/Nginx serving from `/var/www/html/popular-times/webapp/build/`

### berlinometer.de
**Path**: `/etc/nginx/sites-available/berlinometer.de`
```nginx
server {
    listen 443 ssl http2;
    server_name berlinometer.de www.berlinometer.de;
    
    root /var/www/html/berlinometer;
    
    # API Proxy zu localhost:5044
    location /default-locations {
        proxy_pass http://localhost:5044/default-locations;
        # CORS headers...
    }
    
    location /latest-scraping {
        proxy_pass http://localhost:5044/latest-scraping;
        # CORS headers...
    }
    
    # API Weiterleitung für Kompatibilität
    location /api/popular-times/ {
        proxy_pass https://mrx3k1.de/api/popular-times/;
        proxy_set_header Host mrx3k1.de;
        # CORS headers...
    }
    
    # Frontend catch-all
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Deployment Structure

### Server File Structure
```
/var/www/html/
├── popular-times/
│   ├── webapp/
│   │   └── build/          ← mrx3k1 deployment
│   ├── server.py           ← Backend service
│   ├── latest_results.json ← Static results (legacy)
│   └── ...
└── berlinometer/           ← berlinometer deployment
    ├── index.html
    ├── assets/
    └── ...
```

### Build Commands
```bash
# mrx3k1 build
npm run build -- --config vite.config.mrx3k1.js

# berlinometer build  
npm run build -- --config vite.config.berlinometer.js

# Deploy both
scp -r build-mrx3k1/* root@69.62.121.168:/var/www/html/popular-times/webapp/build/
scp -r build-berlinometer/* root@69.62.121.168:/var/www/html/berlinometer/
```

## Service Worker Configuration

### Cache Strategy
```javascript
const CACHE_NAME = 'popular-times-v4';

// Skip API requests from caching
if (event.request.url.includes('/api/') || 
    event.request.url.includes('/default-locations') ||
    event.request.url.includes('/latest_results.json') ||
    event.request.url.includes('localhost:')) {
  return; // Let network handle it
}
```

## Component Architecture

### App Layout Order
1. **Header** - Title + Description
2. **ProgressBar** (während Scraping)
3. **MoodBarometer** (wenn Results vorhanden)
4. **ResultsDisplay** (mit eingebauter Suchleiste unterhalb Export-Buttons)
5. **DefaultLocations** (am Ende der Seite)
6. **Footer**

### Key Components
- `App.jsx` - Main app logic, loads existing results
- `DefaultLocations.jsx` - Standard location management
- `ResultsDisplay.jsx` - Results display with search
- `SearchBar.jsx` - Reusable search component  
- `MoodBarometer.jsx` - Visual occupancy overview

## Data Flow

### App Initialization
```javascript
// App.jsx loads existing results
useEffect(() => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/latest-scraping`)
  // Parse {data: {results: [...]}} format
}, [])
```

### Search Functionality
- **Location**: unterhalb Export-Buttons in ResultsDisplay
- **Search Fields**: location_name, address, live_occupancy, rating
- **Real-time filtering** via useMemo hook

## Environment Variables

### Development
```bash
# .env.mrx3k1
VITE_API_URL=https://mrx3k1.de/api/popular-times

# .env.berlinometer  
VITE_API_URL=https://berlinometer.de
```

### Production
Environment variables werden über Vite `define` Config injected, nicht über .env files.

## Backend Service

### Popular-Times Server
- **Port**: 5044
- **Process Manager**: PM2
- **Language**: Python
- **Endpoints**: REST API für Scraping und Data Retrieval

### API Response Formats
```javascript
// /default-locations
{
  "count": 70,
  "locations": [
    {
      "aktiv": 1,
      "name": "Poison Karaoke Rock Bar", 
      "url": "https://www.google.de/maps/place/..."
    }
  ]
}

// /latest-scraping  
{
  "data": {
    "results": [
      {
        "location_name": "...",
        "address": "...", 
        "live_occupancy": "...",
        "rating": "...",
        "is_live_data": true,
        "timestamp": "..."
      }
    ]
  }
}
```

## Troubleshooting Guide

### Common Issues
1. **Service Worker Crashes** - API requests werden cached
   - Solution: Skip API URLs in SW fetch handler
   
2. **Environment Variables Not Applied** - Vite not loading .env
   - Solution: Use `define` in vite config statt .env
   
3. **CORS Errors** - Multiple domains
   - Solution: Proper CORS headers in nginx
   
4. **JSON Parsing Errors** - Wrong API endpoint  
   - Solution: Use `/latest-scraping` not `/latest_results.json`

### Hard Refresh Requirements
Nach Deployment neuer Versionen müssen Benutzer Hard-Refresh machen (Ctrl+F5) um Service Worker Cache zu umgehen.

## Security Considerations

- **CORS**: Proper origin validation
- **API Keys**: Backend handles Google Maps authentication  
- **Rate Limiting**: Server-side implementation
- **HTTPS**: Enforced via nginx redirects

## Monitoring

### Logs
- **Nginx Access**: `/var/log/nginx/berlinometer.de.access.log`
- **Nginx Error**: `/var/log/nginx/berlinometer.de.error.log`
- **Backend**: PM2 managed logs

### Performance
- **Bundle Size**: ~555KB (chunking recommended)
- **API Response Times**: <2s typical
- **Scraping Duration**: Variable per location count

---
**Document Version**: 1.0  
**Last Updated**: September 2025  
**Maintainer**: Martin Pfeffer