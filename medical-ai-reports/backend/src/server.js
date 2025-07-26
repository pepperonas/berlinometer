require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ciceroMiddleware, registerServer } = require('../../../cicero/middleware');

const app = express();

// CORS Konfiguration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://mrx3k1.de',
      'https://www.mrx3k1.de', 
      'http://localhost:5173',
      'http://localhost:5063'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Nicht erlaubt durch CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cicero Request Monitoring
app.use(ciceroMiddleware({
  serverName: 'medical-ai-reports',
  serverUrl: `http://localhost:${process.env.PORT || 5063}`,
  ciceroUrl: 'https://mrx3k1.de/cicero/api',
  excludePaths: ['/health', '/favicon.ico']
}));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Routes
const authRoutes = require('../routes/auth');
const workflowRoutes = require('../routes/workflow');

app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Ein Fehler ist aufgetreten',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-ai-reports', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB verbunden');
}).catch(err => {
  console.error('❌ MongoDB Verbindungsfehler:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5063;
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Register with Cicero for monitoring
  registerServer({
    serverName: 'medical-ai-reports',
    serverUrl: `http://localhost:${PORT}`
  });
});
