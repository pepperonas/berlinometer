# Instagram Video Downloader

A web application for downloading Instagram videos, reels, and IGTV content built with React frontend and Node.js backend.

## Features

- ✅ Download Instagram videos, reels, and IGTV posts
- ✅ Clean Material-UI interface with dark theme (#2C2E3B)
- ✅ Real-time download with progress indication
- ✅ Automatic file cleanup after download
- ✅ URL validation and error handling
- ✅ Responsive design for all devices
- ✅ PM2 process management ready

## Technology Stack

**Frontend:**
- React 18
- Material-UI v5
- Responsive CSS Grid/Flexbox

**Backend:**
- Node.js/Express
- yt-dlp for video downloading
- CORS configured for mrx3k1.de
- PM2 ecosystem configuration

## Installation & Deployment

### Prerequisites
```bash
# Install yt-dlp on the server
sudo apt update
sudo apt install yt-dlp

# Or using pip
pip install yt-dlp
```

### Backend Setup
```bash
cd instagram-dl/backend
npm install

# Development
npm run dev

# Production with PM2
npm run pm2:start
```

### Frontend Setup
```bash
cd instagram-dl/frontend
npm install

# Development
npm start

# Production build
npm run build
```

### Deployment

1. **Update ecosystem.config.js** with correct path:
   ```javascript
   cwd: '/your/actual/path/to/instagram-dl/backend'
   ```

2. **Start backend service:**
   ```bash
   cd backend
   pm2 start ecosystem.config.js
   ```

3. **Build and deploy frontend:**
   ```bash
   cd frontend
   npm run build
   # Copy build/ contents to your web server at /instagram-dl path
   ```

4. **Nginx configuration** (add to your server block):
   ```nginx
   location /instagram-dl {
       try_files $uri $uri/ /instagram-dl/index.html;
   }
   
   location /api {
       proxy_pass http://localhost:5080;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/download` - Download video
  ```json
  {
    "url": "https://www.instagram.com/p/your-video-id/"
  }
  ```

## Port Configuration

- Backend API: **5080**
- Frontend Dev: 3000 (with proxy to 5080)
- Production: Served via Nginx reverse proxy

## Security Features

- CORS configured for mrx3k1.de domain
- URL validation to prevent abuse
- Temporary file cleanup
- Error handling and logging
- Input sanitization

## File Structure

```
instagram-dl/
├── frontend/
│   ├── package.json (homepage: "/instagram-dl")
│   ├── src/
│   │   ├── App.js (Main React component)
│   │   └── index.js
│   └── public/
│       ├── index.html
│       └── manifest.json
└── backend/
    ├── server.js (Express API server)
    ├── package.json
    └── ecosystem.config.js (PM2 configuration)
```

## Usage

1. Visit `https://mrx3k1.de/instagram-dl`
2. Paste an Instagram video URL
3. Click "Download Video"
4. File will be automatically downloaded to your device

## Troubleshooting

### Common Issues

1. **yt-dlp not found:**
   ```bash
   sudo apt install yt-dlp
   # or
   pip install yt-dlp
   ```

2. **Port 5080 already in use:**
   ```bash
   sudo lsof -i :5080
   sudo kill -9 <PID>
   ```

3. **CORS errors:**
   - Check backend CORS configuration
   - Ensure frontend is served from correct domain

4. **Download fails:**
   - Check yt-dlp version: `yt-dlp --version`
   - Update yt-dlp: `pip install -U yt-dlp`
   - Check server logs: `pm2 logs instagram-dl-backend`

### Logs
```bash
# View PM2 logs
pm2 logs instagram-dl-backend

# View all processes
pm2 list

# Restart service
pm2 restart instagram-dl-backend
```

## Development

### Adding to Main Portal

The app should be added to the main `index.html` with:

```html
<div class="app-card" onclick="trackAppLaunch('Instagram DL', '/instagram-dl/', 'Tools')">
    <div class="app-icon">📱</div>
    <div class="app-title">Instagram DL</div>
    <div class="app-description">Download Instagram videos and reels</div>
</div>
```

### Environment Variables

Create `.env` file in backend directory:
```env
NODE_ENV=production
PORT=5080
CORS_ORIGIN=https://mrx3k1.de
```

## License

MIT License - Free for personal and commercial use.