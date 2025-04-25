const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Routes
const authRoutes = require('./routes/auth');
const tokenRoutes = require('./routes/tokens');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Middleware
app.use(express.json());

// CORS-Konfiguration erweitert
app.use(cors({
    // Erlaube Anfragen von beiden Ports
    origin: [
        'http://localhost:5012',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);

// Health-Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({status: 'OK', message: 'Server läuft'});
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