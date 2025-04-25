const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Schützt Routen - nur authentifizierte Benutzer haben Zugriff
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Token aus Authorization-Header extrahieren
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
      // Format: "Bearer abc123xyz"
      token = req.headers.authorization.split(' ')[1];
    }

    // Prüfen, ob Token vorhanden ist
    if (!token) {
      console.log('Authorization-Header fehlt oder ist ungültig');
      return res.status(401).json({
        success: false,
        message: 'Nicht autorisiert, bitte melde dich an'
      });
    }

    try {
      // Token verifizieren
      const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'fallback_jwt_secret_for_development'
      );

      console.log('Token verifiziert für:', { id: decoded.id, username: decoded.username });

      // Benutzer aus Datenbank abrufen
      const user = await User.findById(decoded.id);

      if (!user) {
        console.log('Token gültig, aber Benutzer existiert nicht mehr:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'Benutzer nicht gefunden'
        });
      }

      // Benutzer zum Request hinzufügen
      req.user = user;
      next();
    } catch (err) {
      console.error('Token-Verifikationsfehler:', err.message);

      // Verschiedene JWT-Fehlertypen unterscheiden
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Ungültiges Token'
        });
      } else if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token abgelaufen, bitte melde dich erneut an'
        });
      }

      // Andere Fehler
      return res.status(401).json({
        success: false,
        message: 'Nicht autorisiert',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  } catch (err) {
    console.error('Unerwarteter Fehler in auth middleware:', err);
    return res.status(500).json({
      success: false,
      message: 'Serverfehler bei der Authentifizierung',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};