const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const geoip = require('geoip-lite');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5016;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cicero';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom Morgan format for detailed logging
morgan.token('custom-data', (req, res) => {
  return JSON.stringify({
    headers: req.headers,
    query: req.query,
    body: req.body,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  });
});

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :custom-data'));

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Request Schema
const requestSchema = new mongoose.Schema({
  method: String,
  url: String,
  status: Number,
  responseTime: Number,
  timestamp: { type: Date, default: Date.now },
  headers: Object,
  query: Object,
  body: Object,
  userAgent: String,
  ip: String,
  server: String,
  contentLength: Number,
  error: String,
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String,
    coordinates: [Number] // [lat, lon]
  }
});

const Request = mongoose.model('Request', requestSchema);

// Server Schema for multi-server tracking
const serverSchema = new mongoose.Schema({
  name: String,
  url: String,
  lastSeen: { type: Date, default: Date.now },
  active: { type: Boolean, default: true }
});

const Server = mongoose.model('Server', serverSchema);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API Routes

// Helper function to get real client IP
function getRealClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
}

// Log a request
app.post('/api/log', async (req, res) => {
  try {
    const data = req.body;
    
    // Get real client IP (override if provided by middleware)
    const clientIP = data.ip || getRealClientIP(req);
    
    // Get location data from IP
    let locationData = null;
    if (clientIP && clientIP !== '127.0.0.1' && clientIP !== '::1') {
      const geo = geoip.lookup(clientIP);
      if (geo) {
        locationData = {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          timezone: geo.timezone,
          coordinates: [geo.ll[0], geo.ll[1]] // [lat, lon]
        };
      }
    }
    
    const requestData = new Request({
      ...data,
      ip: clientIP,
      location: locationData
    });
    
    await requestData.save();
    
    // Emit to all connected clients
    io.emit('new-request', requestData);
    
    res.status(201).json({ success: true, id: requestData._id });
  } catch (error) {
    console.error('Error logging request:', error);
    res.status(500).json({ error: 'Failed to log request' });
  }
});

// Get recent requests
app.get('/api/requests', async (req, res) => {
  try {
    const { limit = 50, server, status } = req.query;
    const filter = {};
    
    if (server) filter.server = server;
    if (status) filter.status = parseInt(status);
    
    const requests = await Request
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
      
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get analytics data
app.get('/api/analytics', async (req, res) => {
  try {
    const { timeframe = '1h' } = req.query;
    const now = new Date();
    let startTime;
    
    switch (timeframe) {
      case '1h':
        startTime = new Date(now - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now - 60 * 60 * 1000);
    }
    
    const analytics = await Request.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          statusCodes: {
            $push: '$status'
          },
          methods: {
            $push: '$method'
          },
          servers: {
            $push: '$server'
          }
        }
      }
    ]);
    
    // Status code distribution
    const statusDistribution = await Request.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Request volume over time
    const timeSeriesData = await Request.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: timeframe === '1h' ? '%H:%M' : '%m-%d %H:00',
              date: '$timestamp'
            }
          },
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Top endpoints
    const topEndpoints = await Request.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      {
        $group: {
          _id: { method: '$method', url: '$url' },
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      summary: analytics[0] || {
        totalRequests: 0,
        avgResponseTime: 0,
        statusCodes: [],
        methods: [],
        servers: []
      },
      statusDistribution,
      timeSeriesData,
      topEndpoints
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get servers
app.get('/api/servers', async (req, res) => {
  try {
    const servers = await Server.find({ active: true });
    res.json(servers);
  } catch (error) {
    console.error('Error fetching servers:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// Register/update server
app.post('/api/servers', async (req, res) => {
  try {
    const { name, url } = req.body;
    
    const server = await Server.findOneAndUpdate(
      { name },
      { name, url, lastSeen: new Date(), active: true },
      { upsert: true, new: true }
    );
    
    res.json(server);
  } catch (error) {
    console.error('Error updating server:', error);
    res.status(500).json({ error: 'Failed to update server' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

server.listen(PORT, () => {
  console.log(`Cicero server running on port ${PORT}`);
  console.log(`WebSocket server ready for real-time monitoring`);
});

module.exports = { app, server, io };