/**
 * Express server with MongoDB for Bartender App
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const connectDB = require('./server/config/db');
require('dotenv').config();

// Datenbankverbindung herstellen
connectDB();

const app = express();
const PORT = process.env.PORT || 5024;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging middleware

// API Routes
app.use('/api/drinks', require('./server/routes/drinks'));
app.use('/api/staff', require('./server/routes/staff'));
app.use('/api/sales', require('./server/routes/sales'));

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

// Statische Dateien im Produktionsmodus bereitstellen
if (process.env.NODE_ENV === 'production') {
  // Statische Ordner festlegen
  app.use(express.static(path.join(__dirname, 'build')));

  // Alle unbekannten Routen zum React-Frontend leiten
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Bartender API server running on port ${PORT}`);
});