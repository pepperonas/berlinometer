const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

// Routes
const authRoutes = require('./routes/auth');
const tokenRoutes = require('./routes/tokens');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// DETAILLIERTES Debug-Logging für alle Anfragen
app.use((req, res, next) => {
    console.log('\n=== NEUE API-ANFRAGE ===');
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Request-Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
        // Nur Passwörter maskieren, den Rest anzeigen
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) sanitizedBody.password = '***';
        console.log('Request-Body:', sanitizedBody);
    }

    // Response-Logging
    const originalSend = res.send;
    res.send = function(body) {
        console.log(`[${new Date().toISOString()}] Response Status: ${res.statusCode}`);
        // Versuche, den Response-Body zu loggen, falls es ein JSON-Objekt ist
        try {
            const parsedBody = JSON.parse(body);
            // Sensitive Daten maskieren
            if (parsedBody.token) parsedBody.token = parsedBody.token.substring(0, 10) + '...';
            console.log('Response-Body (gekürzt):', parsedBody);
        } catch (e) {
            // Bei Nicht-JSON-Response nichts loggen oder nur die ersten Zeichen
            if (typeof body === 'string') {
                console.log('Response-Body-Start:', body.substring(0, 50) + '...');
            }
        }

        originalSend.call(this, body);
    };

    next();
});

// Middleware
app.use(express.json());

// CORS-Konfiguration erweitert - ALLE Origins erlauben für Test
app.use(cors({
    origin: '*', // Jede Origin erlauben für Debugging
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Statische Dateien aus dem public-Verzeichnis servieren
app.use(express.static(path.join(__dirname, '..', 'public')));

// MongoDB Verbindung mit Authentifizierung
console.log('Verbinde mit MongoDB...');
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        retryWrites: true,
        w: 'majority'
    })
    .then(() => {
        console.log('MongoDB erfolgreich verbunden');
    })
    .catch((err) => {
        console.error('MongoDB Verbindungsfehler:', err);
        
        // Detaillierte Fehleranalyse
        if (err.name === 'MongoNetworkError') {
            console.error('Netzwerkfehler: MongoDB-Server möglicherweise nicht erreichbar');
        } else if (err.name === 'MongoServerSelectionError') {
            console.error('Server-Auswahlfehler: Kann keinen MongoDB-Server finden');
        } else if (err.code === 18) {
            console.error('Authentifizierungsfehler: Benutzername oder Passwort falsch');
        } else if (err.code === 13) {
            console.error('Berechtigungsfehler: Benutzer hat keine ausreichenden Rechte');
        }
        
        // Im Produktionsmodus nicht sofort beenden
        if (process.env.NODE_ENV === 'production') {
            console.warn('Server läuft weiter, aber Datenbankfunktionen sind nicht verfügbar!');
        } else {
            // Im Entwicklungsmodus abbrechen
            process.exit(1);
        }
    });

// EINFACHE Debug/Test-Endpunkte
app.get('/api/ping', (req, res) => {
    // Prüfen, ob die Datenbankverbindung aktiv ist
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
        4: 'invalid credentials'
    }[dbStatus] || 'unknown';
    
    res.json({ 
        success: true, 
        message: 'pong', 
        time: new Date().toISOString(),
        db: {
            status: dbStatus,
            statusText: dbStatusText,
            connected: dbStatus === 1
        },
        env: process.env.NODE_ENV
    });
});

app.get('/mpsec/api/ping', (req, res) => {
    // Prüfen, ob die Datenbankverbindung aktiv ist
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
        4: 'invalid credentials'
    }[dbStatus] || 'unknown';
    
    res.json({ 
        success: true, 
        message: 'pong mit /mpsec Präfix', 
        time: new Date().toISOString(),
        db: {
            status: dbStatus,
            statusText: dbStatusText,
            connected: dbStatus === 1
        },
        env: process.env.NODE_ENV
    });
});

app.get('/ping', (req, res) => {
    // Prüfen, ob die Datenbankverbindung aktiv ist
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
        4: 'invalid credentials'
    }[dbStatus] || 'unknown';
    
    res.json({ 
        success: true, 
        message: 'pong ohne Pfad-Präfix', 
        time: new Date().toISOString(),
        db: {
            status: dbStatus,
            statusText: dbStatusText,
            connected: dbStatus === 1
        },
        env: process.env.NODE_ENV
    });
});

// Debug-Endpunkte für Pfadtests
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API über /api erreichbar',
        path: req.originalUrl,
        headers: req.headers,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT
        }
    });
});

app.get('/mpsec/api/test', (req, res) => {
    res.json({
        message: 'API über /mpsec/api erreichbar',
        path: req.originalUrl,
        headers: req.headers,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT
        }
    });
});

// API-Routes - beide Pfad-Varianten unterstützen
app.use(`/api/auth`, authRoutes);
app.use(`/api/tokens`, tokenRoutes);
app.use(`/mpsec/api/auth`, authRoutes);
app.use(`/mpsec/api/tokens`, tokenRoutes);

// API-Fallback für nicht gefundene API-Routen
app.all(`/api/*`, (req, res) => {
    console.log(`[404] Nicht gefunden: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'API-Endpunkt nicht gefunden',
        requestedUrl: req.originalUrl
    });
});

app.all(`/mpsec/api/*`, (req, res) => {
    console.log(`[404] Nicht gefunden: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'API-Endpunkt (mit /mpsec) nicht gefunden',
        requestedUrl: req.originalUrl
    });
});

// Wildcard-Route für SPA-Routing
app.get('*', (req, res) => {
    console.log(`[SPA] Fallback-Route für: ${req.originalUrl}`);
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server-Fehler:', err);
    res.status(500).json({
        message: 'Ein interner Server-Fehler ist aufgetreten',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Funktion zum Starten des Servers mit Fallback auf alternative Ports
const startServer = (port, maxRetries = 5) => {
    if (maxRetries <= 0) {
        console.error(`Konnte keinen freien Port finden nach ${maxRetries} Versuchen.`);
        process.exit(1);
    }

    const server = http.createServer(app);

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.warn(`Port ${port} ist bereits belegt, versuche Port ${port + 1}`);
            startServer(port + 1, maxRetries - 1);
        } else {
            console.error('Server-Fehler:', error);
            process.exit(1);
        }
    });

    server.listen(port, () => {
        console.log(`\n=== SERVER GESTARTET ===`);
        console.log(`Server läuft auf Port ${port}`);
        console.log(`Teste die API mit: http://localhost:${port}/api/ping`);
        console.log(`Oder: http://localhost:${port}/mpsec/api/ping`);

        // Wenn der Port nicht der ursprünglich konfigurierte ist, Warnung ausgeben
        if (port !== parseInt(process.env.PORT || 5012)) {
            console.warn(`\nACHTUNG: Server läuft auf einem anderen Port als konfiguriert!`);
            console.warn(`Die .env-Datei definiert PORT=${process.env.PORT || '(nicht gesetzt, Default: 5012)'}`);
            console.warn(`Nginx sollte auf http://localhost:${port}/api/ weiterleiten.`);
        }
    });
};

// Start server mit konfiguriertem Port oder Fallback
const PORT = parseInt(process.env.PORT || 5012);
startServer(PORT);

module.exports = app;