/**
 * Express server with MongoDB for Bartender App
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./server/config/db');
require('dotenv').config();

// Datenbankverbindung herstellen
connectDB();

const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 5024;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://mrx3k1.de', 'http://69.62.121.168', 'http://mrx3k1.de'] : ['http://localhost:3000', 'http://localhost:5024'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Cookie-Parser hinzufügen
app.use(morgan('dev')); // Logging middleware

// In Production brauchen wir beide Varianten der Routen, um flexibel zu sein
// In Development reicht die /api-Variante
// Routen mit /api-Präfix für direkte Anfragen
app.use('/api/drinks', require('./server/routes/drinks'));
app.use('/api/staff', require('./server/routes/staff'));
app.use('/api/sales', require('./server/routes/sales'));
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/users', require('./server/routes/users'));
app.use('/api/inventory', require('./server/routes/inventory'));
app.use('/api/suppliers', require('./server/routes/suppliers'));
app.use('/api/dashboard', require('./server/routes/dashboard'));

// In Production brauchen wir auch Routen ohne /api-Präfix für Proxy-Weiterleitungen
if (process.env.NODE_ENV === 'production') {
  console.log('Registering routes without /api prefix for production environment');
  app.use('/drinks', require('./server/routes/drinks'));
  app.use('/staff', require('./server/routes/staff'));
  app.use('/sales', require('./server/routes/sales'));
  app.use('/auth', require('./server/routes/auth'));
  app.use('/users', require('./server/routes/users'));
  app.use('/inventory', require('./server/routes/inventory'));
  app.use('/suppliers', require('./server/routes/suppliers'));
  app.use('/dashboard', require('./server/routes/dashboard'));
}

// Basis API-Endpunkte - mit und ohne /api prefix, um flexibel zu sein
function healthCheck(req, res) {
  res.json({ status: 'ok', message: 'Bartender API is running' });
}

function infoResponse(req, res) {
  res.json({
    appName: 'Bartender',
    version: '1.0.0',
    apiStatus: 'active',
    database: 'MongoDB',
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
});