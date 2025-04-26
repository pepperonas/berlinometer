const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const tokenRoutes = require('./routes/tokens');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Basis-Pfade definieren
const BASE_PATH = '/mpsec';
const API_PATH = `${BASE_PATH}/api`;

// Middleware
app.use(express.json());

// CORS-Konfiguration erweitert
app.use(cors({
    origin: function (origin, callback) {
        // Erlaubt Anfragen ohne Origin (wie mobile Apps, Postman)
        if (!origin) return callback(null, true);

        // Erlaubt Anfragen von localhost und der VPS-Domain
        if (origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            origin === process.env.FRONTEND_URL) {
            return callback(null, true);
        }

        callback(new Error('Nicht durch CORS erlaubt'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Statische Dateien aus dem public-Verzeichnis servieren
app.use(BASE_PATH, express.static(path.join(__dirname, '..', 'public')));

// Simple Debugging-Middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Database connection
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        // Detailliertere Fehlerausgabe für MongoDB-Verbindungsprobleme
        if (err.name === 'MongoNetworkError') {
            console.error('Verbindung zu MongoDB nicht möglich. Läuft der MongoDB-Server?');
        }
    });

// API-Routes
app.use(`${API_PATH}/auth`, authRoutes);
app.use(`${API_PATH}/tokens`, tokenRoutes);

// Health-Check Route
app.get(`${API_PATH}/health`, (req, res) => {
    res.status(200).json({status: 'OK', message: 'Server läuft'});
});

// API-Fallback für nicht gefundene API-Routen
app.all(`${API_PATH}/*`, (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API-Endpunkt nicht gefunden'
    });
});

// Wildcard-Route für SPA-Routing
app.get(`${BASE_PATH}/*`, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Root-Weiterleitung
app.get('/', (req, res) => {
    res.redirect(BASE_PATH);
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server-Fehler:', err);
    res.status(500).json({
        message: 'Ein interner Server-Fehler ist aufgetreten',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));

module.exports = app;