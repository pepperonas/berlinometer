const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Schützt Routen - nur authentifizierte Benutzer haben Zugriff
exports.protect = async (req, res, next) => {
  let token;

  // Token aus Header extrahieren
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Prüfen, ob Token vorhanden ist
  if (!token) {
    return res.status(401).json({
      message: 'Nicht autorisiert, bitte melde dich an'
    });
  }

  try {
    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Benutzer zum Request hinzufügen
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        message: 'Benutzer nicht gefunden'
      });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Nicht autorisiert, Token ungültig'
    });
  }
};
