# Cicero - VPS-Wide Request Monitor

Cicero is a comprehensive server request monitoring and analytics platform designed for the mrx3k1 ecosystem. It provides real-time tracking, detailed analytics, and beautiful visualizations of HTTP requests across the entire VPS infrastructure with IP geolocation support.

## Features

### 🔍 Real-time Monitoring
- **Live Request Tracking**: See requests as they happen with WebSocket updates
- **VPS-Wide Coverage**: Monitor ALL traffic to https://mrx3k1.de via Nginx log parsing
- **Multi-server Support**: Monitor individual applications with dedicated middleware
- **IP Geolocation**: Real-time location tracking for all client requests
- **Request Details**: Comprehensive view of headers, body, query parameters, and more

### 📊 Analytics Dashboard
- **Request Volume Charts**: Track request patterns over time
- **Response Time Analysis**: Monitor performance trends and identify bottlenecks
- **Status Code Distribution**: Visualize success rates and error patterns
- **Top Endpoints**: Identify most-used and slowest endpoints
- **Geographic Analytics**: See where your visitors are coming from worldwide
- **Server Health Monitoring**: Track individual server performance and activity

### 🔧 Easy Integration
- **Nginx Log Parser**: Automatically captures ALL VPS traffic without code changes
- **Lightweight Middleware**: Simple Express middleware for detailed application monitoring
- **Zero Configuration**: Works out of the box with sensible defaults
- **Flexible Filtering**: Exclude sensitive paths and headers
- **Production Ready**: Optimized for performance and reliability
- **Auto-Restart Protection**: Health checks and cron monitoring ensure 100% uptime

### 🎨 Modern Interface
- **Dark Theme**: Beautiful dark cards theme matching the mrx3k1 portfolio
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Real-time Updates**: Dashboard updates live as new requests come in
- **Interactive Charts**: Detailed analytics with Recharts visualizations
- **Geographic Visualization**: 🌍 See visitor locations with country flags and city names
- **Request Details Modal**: Click any request to see full headers, body, and metadata

## Architecture

```
cicero/
├── frontend/          # React TypeScript dashboard with IP geolocation
├── backend/           # Express server with MongoDB, WebSocket & GeoIP
├── middleware/        # Lightweight logging middleware for applications
├── log-parser/        # Nginx log parser for VPS-wide monitoring
│   ├── nginx-parser.js    # Real-time log parsing service
│   ├── health-check.sh    # Auto-restart monitoring script
│   └── ecosystem.config.js # PM2 configuration with cron restart
├── ecosystem.config.js # Main PM2 configuration for deployment
└── README.md
```

## Quick Start

### 1. Start the Backend

```bash
cd cicero/backend
npm install
npm run dev
```

The server will start on port 5016 with MongoDB connection.

### 2. Start the Frontend

```bash
cd cicero/frontend
npm install
npm start
```

The dashboard will be available at http://localhost:3000

### 3. Integrate with Your Apps

```javascript
const { ciceroMiddleware, registerServer } = require('./cicero/middleware');

app.use(ciceroMiddleware({
  serverName: 'my-api-server',
  serverUrl: 'http://localhost:3001'
}));

// Optional: Register server for better organization
registerServer({
  serverName: 'my-api-server',
  serverUrl: 'http://localhost:3001'
});
```

## Configuration

### Backend Configuration

Environment variables for the backend server:

```bash
NODE_ENV=production          # Environment mode
PORT=5016                    # Server port
MONGODB_URI=mongodb://localhost:27017/cicero  # MongoDB connection
CORS_ORIGIN=https://mrx3k1.de  # CORS origin for frontend
```

### Middleware Configuration

Configure the middleware for your applications:

```javascript
app.use(ciceroMiddleware({
  ciceroUrl: 'http://localhost:5016',     // Cicero server URL
  serverName: 'my-server',                // Server identifier
  serverUrl: 'http://localhost:3000',     // Your server URL
  enabled: true,                          // Enable/disable logging
  excludePaths: ['/health', '/ping'],     // Paths to exclude
  excludeHeaders: ['authorization'],       // Headers to exclude
  timeout: 5000,                          // Request timeout
  logErrors: true                         // Log error responses
}));
```

## API Endpoints

### Backend REST API

- `POST /api/log` - Log a request (used by middleware)
- `GET /api/requests` - Get recent requests with filtering
- `GET /api/analytics` - Get analytics data for dashboard
- `GET /api/servers` - Get registered servers
- `POST /api/servers` - Register/update a server
- `GET /api/health` - Health check endpoint

### Query Parameters

**Requests endpoint:**
- `limit` - Number of requests to return (default: 50)
- `server` - Filter by server name
- `status` - Filter by status code

**Analytics endpoint:**
- `timeframe` - Time period: '1h', '24h', '7d' (default: '1h')

## Data Schema

### Request Log
```javascript
{
  method: String,        // HTTP method
  url: String,          // Request URL
  status: Number,       // Response status code
  responseTime: Number, // Response time in ms
  timestamp: Date,      // Request timestamp
  headers: Object,      // Request headers (filtered)
  query: Object,        // Query parameters
  body: Object,         // Request body
  userAgent: String,    // User agent string
  ip: String,          // Client IP address
  server: String,      // Server identifier
  contentLength: Number, // Response content length
  error: String        // Error message (if applicable)
}
```

### Server Registration
```javascript
{
  name: String,         // Server name
  url: String,         // Server URL
  lastSeen: Date,      // Last activity timestamp
  active: Boolean      // Active status
}
```

## Dashboard Features

### Analytics Views
- **Request Volume**: Line chart showing requests over time
- **Response Times**: Performance trends and averages
- **Status Codes**: Pie chart of response status distribution
- **Top Endpoints**: Bar chart of most active endpoints

### Filtering Options
- **Timeframe**: Last hour, 24 hours, or 7 days
- **Server**: Filter by specific server
- **Status Code**: Filter by HTTP status codes
- **Request Limit**: Number of requests to display

### Real-time Features
- **Live Updates**: New requests appear instantly via WebSocket
- **Connection Status**: Visual indicator of real-time connection
- **Auto-refresh**: Analytics update automatically with new data

## Deployment

### Production Deployment

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Deploy with PM2**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
```

3. **Nginx Configuration**
```nginx
# Frontend static files
location /cicero/ {
    alias /var/www/html/cicero/frontend/;
    try_files $uri $uri/ /cicero/index.html;
}

# Backend API proxy
location /cicero/api/ {
    proxy_pass http://localhost:5016/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Docker Support

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ .
EXPOSE 5016
CMD ["npm", "start"]
```

## Performance Considerations

### Backend Optimization
- MongoDB indexing on timestamp and server fields
- Request aggregation pipelines for analytics
- WebSocket connection pooling
- Configurable request retention periods

### Middleware Efficiency
- Asynchronous, non-blocking logging
- Configurable timeout and retry logic
- Header and path filtering for security
- Silent failure mode for production

### Frontend Performance
- React.memo for component optimization
- Virtual scrolling for large request lists
- Debounced filter updates
- Efficient WebSocket event handling

## Security Features

### Data Protection
- Sensitive header filtering (authorization, cookies, API keys)
- Configurable path exclusions for private endpoints
- Request body size limits
- IP address anonymization options

### Access Control
- CORS configuration for frontend access
- Environment-based configuration
- Production security headers
- MongoDB connection security

## Integration Examples

### Express.js Application
```javascript
const express = require('express');
const { ciceroMiddleware, registerServer } = require('./cicero/middleware');

const app = express();

// Add body parsing middleware first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add Cicero monitoring
app.use(ciceroMiddleware({
  serverName: 'my-api',
  serverUrl: 'http://localhost:3000',
  excludePaths: ['/health', '/internal/*']
}));

// Your application routes
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

const server = app.listen(3000, () => {
  console.log('Server running on port 3000');
  
  // Register with Cicero
  registerServer({
    serverName: 'my-api',
    serverUrl: 'http://localhost:3000'
  });
});
```

### Multiple Server Setup
```javascript
// API Server (Port 3001)
app.use(ciceroMiddleware({
  serverName: 'api-server',
  serverUrl: 'http://localhost:3001'
}));

// Web Server (Port 3000)  
app.use(ciceroMiddleware({
  serverName: 'web-server',
  serverUrl: 'http://localhost:3000'
}));

// Background Service (Port 3002)
app.use(ciceroMiddleware({
  serverName: 'worker-service',
  serverUrl: 'http://localhost:3002'
}));
```

## Troubleshooting

### Common Issues

**Middleware not logging requests:**
- Check if Cicero backend is running on port 5016
- Verify MongoDB connection
- Ensure request paths are not in excludePaths

**Dashboard not updating:**
- Check WebSocket connection status
- Verify CORS configuration
- Check browser console for errors

**Performance issues:**
- Review excludePaths configuration
- Adjust request retention settings
- Consider MongoDB indexing

### Debug Mode

Enable debug logging in development:

```javascript
// Backend
process.env.NODE_ENV = 'development';

// Middleware
app.use(ciceroMiddleware({
  enabled: process.env.NODE_ENV !== 'test',
  logErrors: true
}));
```

## Contributing

Cicero is part of the mrx3k1 ecosystem. To contribute:

1. Follow the dark-cards theme specification
2. Maintain TypeScript types for frontend
3. Ensure backward compatibility for middleware
4. Add comprehensive tests for new features
5. Update documentation for API changes

## License

Part of the mrx3k1 project ecosystem.