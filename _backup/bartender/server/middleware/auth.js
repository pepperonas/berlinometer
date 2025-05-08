const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware zum Schutz von Routen - prüft ob ein gültiger JWT Token vorhanden ist
exports.protect = async (req, res, next) => {
  let token;

  // Token aus dem Header oder Cookies extrahieren
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Token aus dem Authorization Header extrahieren
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Token aus Cookies extrahieren
    token = req.cookies.token;
  }

  // Prüfen, ob Token vorhanden
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Nicht autorisiert, bitte anmelden'
    });
  }

  try {
    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecretkey');

    // Benutzer aus Datenbank abrufen
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Überprüfe, ob der Benutzer aktiv ist
    if (!user.active) {
      return res.status(401).json({
        success: false,
        error: 'Dein Konto wurde noch nicht aktiviert'
      });
    }

    // Benutzer an den Request anfügen
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Nicht autorisiert, bitte anmelden'
    });
  }
};

// Middleware zur Rollenprüfung
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Nicht autorisiert, bitte anmelden'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Keine Berechtigung für diese Aktion'
      });
    }
    next();
  };
};