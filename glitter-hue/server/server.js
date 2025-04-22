// server/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Express-App initialisieren
const app = express();

// Mongoose-Warnung unterdrücken
mongoose.set('strictQuery', true);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB-Verbindung herstellen
const connectDB = async () => {
    try {
        // Verwende die MONGO_URI aus der .env-Datei
        const dbURI = process.env.MONGO_URI;

        // Verbindung herstellen
        await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('MongoDB verbunden...');
    } catch (err) {
        console.error('MongoDB-Verbindungsfehler:', err.message);
        // Fehlermeldung, aber Server trotzdem weiter laufen lassen
        console.log('Server wird ohne MongoDB-Verbindung gestartet.');
    }
};

// Verbindung zur DB herstellen
connectDB();

// Routen definieren
const energyDataRoutes = require('./routes/energyData');

// API-Routen
app.use('/api/energy', energyDataRoutes);

// Standardroute
app.get('/', (req, res) => {
    res.send('GlitterHue API läuft');
});

// Portsuche-Funktion
function startServer(port) {
    const server = require('http').createServer(app);

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${port} ist belegt, versuche Port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server-Fehler:', error);
        }
    });

    server.on('listening', () => {
        console.log(`Server läuft auf Port ${port}`);
    });

    server.listen(port);
}

// Starte Server mit Portsuche
const PORT = parseInt(process.env.PORT || '5000');
startServer(PORT);