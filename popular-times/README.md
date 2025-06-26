# Popular Times Web Application

A modern React web application for analyzing Google Maps location occupancy data in real-time.

## Features

- 🎨 **Modern Dark Theme**: Professional dark UI with Material Design colors
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔄 **Real-time Progress**: Live progress updates during scraping
- 📊 **Data Export**: Export results to JSON and CSV formats
- 🚀 **Fast Scraping**: Optimized Python backend with Playwright
- 🌐 **Production Ready**: Configured for deployment on VPS

## Architecture

### Frontend (React + Vite)
- **Framework**: React 19 with Vite
- **Styling**: Custom CSS with CSS variables for theming
- **API Communication**: Fetch API with streaming support
- **Build Target**: `/var/www/html/popular-times/`

### Backend (Python Flask)
- **Framework**: Flask with CORS support
- **Scraping**: Playwright for Google Maps data extraction
- **API**: RESTful endpoints with streaming responses
- **Port**: 5044 (production: proxied via nginx)

## Quick Start

### Development

1. **Install dependencies**:
   ```bash
   # Frontend
   cd webapp
   npm install
   
   # Backend
   pip install -r requirements.txt
   python -m playwright install chromium
   ```

2. **Start development servers**:
   ```bash
   # Backend (Terminal 1)
   python server.py
   
   # Frontend (Terminal 2)
   cd webapp
   npm run dev
   ```

3. **Access the app**: http://localhost:3000

### Production Deployment

1. **Build the application**:
   ```bash
   cd webapp
   npm run build
   ```

2. **Deploy to VPS**:
   ```bash
   ./deploy.sh
   ```

3. **Access the app**: https://mrx3k1.de/popular-times

## API Endpoints

- `GET /` - Service information
- `GET /health` - Health check
- `POST /scrape` - Scrape Google Maps locations (streaming)

### Scrape Request Format
```json
{
  "urls": [
    "https://www.google.de/maps/place/...",
    "https://www.google.de/maps/place/..."
  ]
}
```

### Streaming Response Format
```json
{"type": "progress", "progress": 50, "current": 1, "total": 2, "location": "Processing location 1/2"}
{"type": "result", "data": {"location_name": "...", "live_occupancy": "...", ...}}
{"type": "complete", "timestamp": "2025-06-26T..."}
```

## Configuration

### Environment Variables
- `VITE_API_URL`: API base URL (default: http://localhost:5044)

### Deployment Configuration
- **Frontend Path**: `/var/www/html/popular-times/`
- **Backend Path**: `/opt/popular-times/`
- **Service Name**: `popular-times-api`
- **Nginx Proxy**: `/api/popular-times` → `http://localhost:5044`

## Design System

### Color Palette
- **Background Dark**: `#2B2E3B`
- **Background Darker**: `#252830`
- **Card Background**: `#343845`
- **Accent Blue**: `#688db1`
- **Accent Green**: `#9cb68f`
- **Accent Red**: `#e16162`
- **Text Primary**: `#d1d5db`
- **Text Secondary**: `#9ca3af`

### Typography
- **Font Family**: System fonts (Apple System, Segoe UI, Roboto, etc.)
- **Hierarchy**: Clear h1-h4 with consistent spacing
- **Sizes**: Normal (1rem), Small (0.875rem), Extra Small (0.75rem)

### Components
- **Cards**: Rounded containers with subtle shadows
- **Buttons**: Primary, Secondary, Outline, Danger variants
- **Forms**: Consistent input styling with focus states
- **Progress**: Animated gradient progress bars
- **Status**: Color-coded badges for live/data indicators

## File Structure

```
popular-times/
├── maps-playwrite-scraper/     # Original Python scraper
│   ├── gmaps-scraper-fast-robust.py
│   ├── occupancy_data_*.json
│   └── urls.txt
├── webapp/                     # React frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── App.jsx            # Main app component
│   │   ├── App.css            # App-specific styles
│   │   ├── index.css          # Global styles & theme
│   │   └── main.jsx           # App entry point
│   ├── package.json
│   └── vite.config.js
├── server.py                   # Flask backend server
├── requirements.txt            # Python dependencies
├── deploy.sh                   # Deployment script
└── README.md                   # This file
```

## Development Notes

- **Playwright**: Uses Chromium for scraping with resource blocking for performance
- **Rate Limiting**: 3-5 second delays between requests to be respectful
- **Error Handling**: Comprehensive error handling with user feedback
- **Responsive**: Mobile-first design with breakpoints
- **Accessibility**: Focus states and keyboard navigation support

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure Flask-CORS is properly configured
2. **Playwright Issues**: Run `playwright install chromium` 
3. **Service Not Starting**: Check systemd logs with `journalctl -u popular-times-api`
4. **Nginx 502**: Verify backend is running on port 5044

### Logs

- **Backend Logs**: `journalctl -u popular-times-api -f`
- **Nginx Logs**: `/var/log/nginx/error.log`
- **Frontend**: Browser DevTools Console

## License

Private project for personal use.