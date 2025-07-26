/**
 * Express server with MongoDB for Bartender App
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./server/config/db');
const { ciceroMiddleware, registerServer } = require('../cicero/middleware');
require('dotenv').config();

// Temporäres Verzeichnis erstellen, falls es nicht existiert
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
  console.log('Temporäres Verzeichnis erstellt:', tempDir);
}

// Datenbankverbindung herstellen
connectDB();

const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 5024;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Erlaube Anfragen ohne Origin-Header (z.B. von Postman, curl, usw.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' ? 
      ['https://mrx3k1.de', 'http://69.62.121.168', 'http://mrx3k1.de', 'https://bartender.mrx3k1.de'] : 
      ['http://localhost:3000', 'http://localhost:5024', 'http://127.0.0.1:3000'];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('CORS rejected origin:', origin);
      callback(null, true); // Allow all origins in development for ease of debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Cookie-Parser hinzufügen

// Cicero Request Monitoring
app.use(ciceroMiddleware({
  serverName: 'bartender',
  serverUrl: `http://localhost:${PORT}`,
  ciceroUrl: 'https://mrx3k1.de/cicero/api',
  excludePaths: ['/health', '/favicon.ico', '/static/']
}));

app.use(morgan('dev')); // Logging middleware

// In Production brauchen wir beide Varianten der Routen, um flexibel zu sein
// In Development reicht die /api-Variante
// Routen mit /api-Präfix für direkte Anfragen
app.use('/api/drinks', require('./server/routes/drinks'));
app.use('/api/staff', require('./server/routes/staff'));
// Alte Sales-Route wird durch die verbesserte ersetzt
// app.use('/api/sales', require('./server/routes/sales'));
// Neue verbesserte Sales-Route verwenden
app.use('/api/sales', require('./server/routes/better_sales'));
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/users', require('./server/routes/users'));
app.use('/api/inventory', require('./server/routes/inventory'));
app.use('/api/suppliers', require('./server/routes/suppliers'));
app.use('/api/dashboard', require('./server/routes/dashboard'));
// Debug-Route für Finanzen-API
app.get('/api/finances/test', (req, res) => {
  console.log('Finances-Test-Endpunkt aufgerufen');
  res.json({ message: 'Finances-API ist aktiv', time: new Date() });
});

// Eigentliche Finanzen-Routen
app.use('/api/finances', require('./server/routes/finances'));

// Admin-Routen
app.use('/api/admin', require('./server/routes/admin'));

// In Production brauchen wir auch Routen ohne /api-Präfix für Proxy-Weiterleitungen
if (process.env.NODE_ENV === 'production') {
  console.log('Registering routes without /api prefix for production environment');
  app.use('/drinks', require('./server/routes/drinks'));
  app.use('/staff', require('./server/routes/staff'));
  // Auch für Production die verbesserte Sales-Route verwenden
  app.use('/sales', require('./server/routes/better_sales'));
  app.use('/auth', require('./server/routes/auth'));
  app.use('/users', require('./server/routes/users'));
  app.use('/inventory', require('./server/routes/inventory'));
  app.use('/suppliers', require('./server/routes/suppliers'));
  app.use('/dashboard', require('./server/routes/dashboard'));
  
  // Debug-Route für Finanzen-API in Production
  app.get('/finances/test', (req, res) => {
    console.log('Finances-Test-Endpunkt in Production aufgerufen');
    res.json({ message: 'Finances-API ist aktiv (Production)', time: new Date() });
  });
  
  app.use('/finances', require('./server/routes/finances'));
  app.use('/admin', require('./server/routes/admin'));
}

// Basis API-Endpunkte - mit und ohne /api prefix, um flexibel zu sein
function healthCheck(req, res) {
  res.json({ status: 'ok', message: 'Bartender API is running' });
}

function infoResponse(req, res) {
  res.json({
    appName: 'Bartender',
    version: '1.1.0',
    apiStatus: 'active',
    database: 'MongoDB',
    multiTenant: true,
    environment: process.env.NODE_ENV || 'development'
  });
}

// Mit /api Prefix (für direkte Anfragen)
app.get('/api/health', healthCheck);
app.get('/api/info', infoResponse);

// Ohne /api Prefix (für Proxy-Weiterleitungen)
app.get('/health', healthCheck);
app.get('/info', infoResponse);

// Nur im Produktionsmodus statische Dateien bereitstellen
if (process.env.NODE_ENV === 'production') {
  // Statische Ordner festlegen
  app.use(express.static(path.join(__dirname, 'build')));

  // Alle unbekannten Routen zum React-Frontend leiten
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
} else {
  // Im Entwicklungsmodus nur API-Endpunkte bereitstellen,
  // keine Frontend-Dateien oder Fallback-Routen
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Bartender API Server läuft im Entwicklungsmodus', 
      info: 'Die React-App sollte auf einem separaten Entwicklungsserver laufen (npm start)'
    });
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Bartender API server running on port ${PORT}`);
  
  // Register with Cicero for monitoring
  registerServer({
    serverName: 'bartender',
    serverUrl: `http://localhost:${PORT}`
  });
});