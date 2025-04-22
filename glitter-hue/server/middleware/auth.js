// server/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    // Token aus dem Header holen
    const token = req.header('x-auth-token');

    // Für Entwicklungszwecke: Überspringe die Auth wenn kein Token nötig ist
    // In Produktionsumgebung solltest du diese Zeile entfernen!
    if (process.env.NODE_ENV === 'development') {
        req.user = { id: req.params.userId || 'development-user' };
        return next();
    }

    // Prüfen ob Token vorhanden
    if (!token) {
        return res.status(401).json({ message: 'Kein Token, Authentifizierung verweigert' });
    }

    try {
        // Token verifizieren
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // User zum Request-Objekt hinzufügen
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token ist ungültig' });
    }
};