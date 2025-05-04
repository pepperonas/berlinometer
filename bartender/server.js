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
  origin: process.env.NODE_ENV === 'production' ? 'https://mrx3k1.de' : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Cookie-Parser hinzufügen
app.use(morgan('dev')); // Logging middleware

// API Routes
app.use('/api/drinks', require('./server/routes/drinks'));
app.use('/api/staff', require('./server/routes/staff'));
app.use('/api/sales', require('./server/routes/sales'));
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/users', require('./server/routes/users'));

// Basis API-Endpunkte
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bartender API is running' });
});

app.get('/api/info', (req, res) => {
  res.json({
    appName: 'Bartender',
    version: '1.0.0',
    apiStatus: 'active',
    database: 'MongoDB'
  });
});

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