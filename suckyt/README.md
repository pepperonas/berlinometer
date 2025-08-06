# Suckyt - YouTube Video Downloader

A powerful web application and API for downloading YouTube videos. Built with React frontend and Node.js backend with full API access for external developers.

## 🚀 Features

### Web Application
- ✅ Download YouTube videos in MP4 format
- ✅ Clean Material-UI interface with YouTube red theme (#FF0000)
- ✅ Real-time download with progress indication
- ✅ Automatic file cleanup after download
- ✅ URL validation and error handling
- ✅ Responsive design for all devices
- ✅ Cookie-based authentication for accessing age-restricted content

### API Access
- 🔑 RESTful API with authentication
- 📊 Rate limiting (10 req/min for API, 30 req/min for frontend)
- 📖 Complete API documentation at `/suckyt/api/docs`
- 🛡️ Secure API key authentication
- 🌐 CORS enabled for all origins
- ⚡ Dual downloader system (yt-dlp + gallery-dl fallback)

## 💻 Technology Stack

**Frontend:**
- React 18
- Material-UI v5
- YouTube red color scheme (#FF0000)
- Responsive CSS Grid/Flexbox
- Social media meta tags for sharing

**Backend:**
- Node.js/Express
- yt-dlp + gallery-dl for video downloading
- Cookie-based YouTube authentication
- API key authentication system
- Rate limiting with in-memory storage
- PM2 ecosystem configuration

## 🔧 Installation & Deployment

### Prerequisites
```bash
# Install yt-dlp on the server
wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp-new
chmod +x /usr/local/bin/yt-dlp-new

# Install gallery-dl as fallback
pip install gallery-dl
```

### Backend Setup
```bash
cd suckyt/backend
npm install

# Development
npm run dev

# Production with PM2
npm run pm2:start
```

### Frontend Setup
```bash
cd suckyt/frontend
npm install

# Development
npm start

# Production build
npm run build
```

### YouTube Cookie Authentication

To enable downloading from age-restricted videos or when YouTube requires login:

1. **Export cookies from browser:**
   - Use browser extension like "Get cookies.txt LOCALLY"
   - Export cookies in Netscape format

2. **Save as `youtube-cookies.txt` in backend directory:**
   ```bash
   scp youtube-cookies.txt root@mrx3k1.de:/var/www/html/suckyt/backend/
   ```

## 🔌 API Documentation

### Base URL
```
https://mrx3k1.de/suckyt/api
```

### Authentication

**For External Applications:**
Include API key in request headers:
```
X-API-Key: your_api_key_here
```
or
```
Authorization: Bearer your_api_key_here
```

**Available API Keys:**
| Key | Purpose | Rate Limit |
|-----|---------|------------|
| `sk_live_51234567890abcdef1234567890abcdef` | Production | 10 req/min |
| `sk_test_abcdef1234567890abcdef1234567890` | Testing | 10 req/min |
| `sk_mrx3k1_dev_1234567890abcdefghijklmnop` | Development | 10 req/min |

### Endpoints

#### 1. Health Check
```http
GET /suckyt/api/health
```
No authentication required

#### 2. API Documentation
```http
GET /suckyt/api/docs
```
No authentication required - returns complete API documentation

#### 3. Download Video
```http
POST /suckyt/api/download
Content-Type: application/json
X-API-Key: your_api_key_here

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

### Code Examples

**cURL:**
```bash
curl -X POST https://mrx3k1.de/suckyt/api/download \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_test_abcdef1234567890abcdef1234567890" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  --output video.mp4
```

**JavaScript:**
```javascript
fetch('https://mrx3k1.de/suckyt/api/download', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sk_test_abcdef1234567890abcdef1234567890'
  },
  body: JSON.stringify({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  })
})
.then(response => response.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'video.mp4';
  a.click();
});
```

**Python:**
```python
import requests

response = requests.post(
    'https://mrx3k1.de/suckyt/api/download',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'sk_test_abcdef1234567890abcdef1234567890'
    },
    json={'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
)

if response.status_code == 200:
    with open('video.mp4', 'wb') as f:
        f.write(response.content)
```

## 🌐 Deployment

### Nginx Configuration
```nginx
# Suckyt API Routes
location /suckyt/api/ {
    proxy_pass http://127.0.0.1:5081/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}

# Suckyt frontend
location /suckyt {
    alias /var/www/html/suckyt/;
    try_files $uri $uri/ /suckyt/index.html;
}
```

### PM2 Commands
```bash
# Start service
pm2 start ecosystem.config.js

# View logs
pm2 logs suckyt-backend

# Restart service
pm2 restart suckyt-backend

# Stop service
pm2 stop suckyt-backend
```

## 📁 File Structure

```
suckyt/
├── frontend/
│   ├── package.json (homepage: "/suckyt")
│   ├── src/
│   │   ├── App.js (Main React component)
│   │   └── index.js
│   └── public/
│       ├── index.html
│       ├── manifest.json
│       ├── thumbnail.jpg (Social media preview)
│       └── favicons (Various sizes)
└── backend/
    ├── server.js (Express API server with auth)
    ├── package.json
    ├── ecosystem.config.js (PM2 configuration)
    ├── youtube-cookies.txt (Optional, for auth)
    └── logs/ (PM2 log files)
```

## 🎯 Usage

### Web Application
1. Visit `https://mrx3k1.de/suckyt`
2. Paste a YouTube video URL
3. Click "Download Video"
4. File will be automatically downloaded to your device

### API Usage
1. Get your API key from the documentation
2. Make POST request to `/suckyt/api/download` with the YouTube URL
3. Receive the video file in the response

## 🐛 Troubleshooting

### Common Issues

1. **yt-dlp not found:**
   ```bash
   wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp
   chmod +x yt-dlp
   sudo mv yt-dlp /usr/local/bin/yt-dlp-new
   ```

2. **Port 5081 already in use:**
   ```bash
   sudo lsof -i :5081
   sudo kill -9 <PID>
   ```

3. **YouTube authentication required:**
   - Export cookies from browser
   - Save as `youtube-cookies.txt` in backend directory

4. **API authentication errors:**
   - Check API key is included in headers
   - Verify API key is valid
   - Check rate limiting (10 requests per minute)

### Logs
```bash
# View PM2 logs
pm2 logs suckyt-backend

# View error logs
tail -f backend/logs/err.log

# View access logs
tail -f backend/logs/out.log
```

## 🔒 Security Features

- API key authentication for external access
- Rate limiting per API key
- CORS configured for cross-origin requests
- URL validation to prevent abuse
- Temporary file cleanup
- Cookie-based YouTube authentication
- Input sanitization and error handling

## 📊 Port Configuration

- Backend API: **5081**
- Frontend Dev: 3000 (with proxy to 5081)
- Production: Served via Nginx reverse proxy

## 🤝 Development

### Environment Variables

Create `.env` file in backend directory:
```env
NODE_ENV=production
PORT=5081
```

### Adding New API Keys

Edit `server.js` and add to the `API_KEYS` Set:
```javascript
const API_KEYS = new Set([
    'sk_live_51234567890abcdef1234567890abcdef',
    'your_new_api_key_here'
]);
```

## 📝 License

MIT License - Free for personal and commercial use.

## 🔗 Links

- **Web App:** https://mrx3k1.de/suckyt/
- **API Docs:** https://mrx3k1.de/suckyt/api/docs
- **Health Check:** https://mrx3k1.de/suckyt/api/health

## 💡 Support

For issues or questions about the API, please contact the administrator at mrx3k1.de.

## 🆚 Related Projects

- **Suckinsta**: Instagram video downloader - https://mrx3k1.de/suckinsta/
- **Main Portfolio**: https://mrx3k1.de/