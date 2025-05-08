const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Benutzer registrieren
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    console.log('Registrierungsversuch:', { username });

    // Prüfen, ob Benutzer bereits existiert
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Benutzer existiert bereits'
      });
    }

    // Benutzer erstellen
    const user = await User.create({
      username,
      password
    });

    console.log('Benutzer erstellt:', { id: user._id, username: user.username });

    // Token erstellen und zurückgeben
    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('Registrierungsfehler:', err);
    
    // Prüfen, ob es sich um einen Datenbank-Authentifizierungsfehler handelt
    if (err.name === 'MongoServerError' && (err.code === 18 || err.code === 13)) {
      return res.status(500).json({
        success: false,
        message: 'Authentifizierungsproblem mit der Datenbank. Bitte kontaktieren Sie den Administrator.',
        error: process.env.NODE_ENV === 'development' ? 'MongoDB-Authentifizierungsfehler: ' + err.message : undefined
      });
    } else if (err.name === 'MongoNetworkError') {
      return res.status(500).json({
        success: false,
        message: 'Verbindungsproblem mit der Datenbank. Bitte versuchen Sie es später erneut.',
        error: process.env.NODE_ENV === 'development' ? 'MongoDB-Netzwerkfehler: ' + err.message : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Fehler bei der Registrierung',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Benutzer anmelden
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    console.log('=== LOGIN VERSUCH ===');
    const { username, password } = req.body;

    console.log('Anmeldeversuch für:', { username });

    // FEHLERSUCHE: Ausgabe für weitere Informationen
    console.log('Verfügbare Umgebungsvariablen:', {
      JWT_SECRET: process.env.JWT_SECRET ? 'Vorhanden' : 'Fehlt',
      NODE_ENV: process.env.NODE_ENV,
      MONGO_URI: process.env.MONGO_URI ? 'Vorhanden' : 'Fehlt'
    });

    // Prüfen, ob Benutzername und Passwort vorhanden sind
    if (!username || !password) {
      console.log('Fehlende Anmeldedaten');
      return res.status(400).json({
        success: false,
        message: 'Bitte gib Benutzername und Passwort ein'
      });
    }

    try {
      // Benutzer in DB suchen (mit Passwort)
      console.log('Suche Benutzer in der Datenbank...');
      const user = await User.findOne({ username }).select('+password');

      if (!user) {
        console.log('Benutzer nicht gefunden:', { username });
        return res.status(401).json({
          success: false,
          message: 'Ungültige Anmeldedaten'
        });
      }

      console.log('Benutzer gefunden:', { id: user._id, username: user.username });

      try {
        // Passwort überprüfen
        console.log('Prüfe Passwort...');
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
          console.log('Passwort stimmt nicht überein:', { username });
          return res.status(401).json({
            success: false,
            message: 'Ungültige Anmeldedaten'
          });
        }

        console.log('Passwort korrekt, generiere Token...');

        try {
          // Token erstellen und zurückgeben
          sendTokenResponse(user, 200, res);
        } catch (tokenError) {
          console.error('Fehler bei der Token-Generierung:', tokenError);
          return res.status(500).json({
            success: false,
            message: 'Fehler bei der Token-Generierung',
            error: process.env.NODE_ENV === 'development' ? tokenError.message : undefined
          });
        }
      } catch (passwordError) {
        console.error('Fehler beim Passwort-Vergleich:', passwordError);
        return res.status(500).json({
          success: false,
          message: 'Fehler beim Passwort-Vergleich',
          error: process.env.NODE_ENV === 'development' ? passwordError.message : undefined
        });
      }
    } catch (dbError) {
      console.error('Datenbank-Fehler:', dbError);
      
      // Prüfen, ob es sich um einen Authentifizierungsfehler mit MongoDB handelt
      if (dbError.name === 'MongoServerError' && (dbError.code === 18 || dbError.code === 13)) {
        return res.status(500).json({
          success: false,
          message: 'Authentifizierungsproblem mit der Datenbank. Bitte kontaktieren Sie den Administrator.',
          error: process.env.NODE_ENV === 'development' ? 'MongoDB-Authentifizierungsfehler: ' + dbError.message : undefined
        });
      } else if (dbError.name === 'MongoNetworkError') {
        return res.status(500).json({
          success: false,
          message: 'Verbindungsproblem mit der Datenbank. Bitte versuchen Sie es später erneut.',
          error: process.env.NODE_ENV === 'development' ? 'MongoDB-Netzwerkfehler: ' + dbError.message : undefined
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Datenbank-Fehler',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (err) {
    console.error('Allgemeiner Login-Fehler:', err);
    res.status(500).json({
      success: false,
      message: 'Fehler bei der Anmeldung',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Aktuelle Benutzerinfo abrufen
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    console.log('Benutzer-Identität abgerufen:', { id: req.user.id, username: req.user.username });

    res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        username: req.user.username,
        createdAt: req.user.createdAt
      }
    });
  } catch (err) {
    console.error('Get-Me-Fehler:', err);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Benutzerinformationen',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Passwort ändern
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Bitte gib aktuelles und neues Passwort ein'
      });
    }

    // Benutzer mit Passwort holen
    const user = await User.findById(req.user.id).select('+password');

    // Überprüfen, ob das aktuelle Passwort korrekt ist
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Aktuelles Passwort ist nicht korrekt'
      });
    }

    // Wenn das aktuelle Passwort stimmt, dann das neue Passwort setzen
    user.password = newPassword;
    await user.save();

    console.log('Passwort geändert für Benutzer:', { id: user._id, username: user.username });

    // Erfolgsantwort senden
    res.status(200).json({
      success: true,
      message: 'Passwort erfolgreich geändert'
    });
  } catch (err) {
    console.error('Fehler beim Ändern des Passworts:', err);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Ändern des Passworts',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Hilfsfunktion zum Erstellen und Senden des JWT-Tokens
const sendTokenResponse = (user, statusCode, res) => {
  try {
    // Token erstellen
    const token = user.getSignedJwtToken();

    // Debug-Ausgabe für Token-Generation
    console.log('Token generiert für:', { id: user._id, username: user.username });

    res.status(statusCode).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Fehler in sendTokenResponse:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler bei der Token-Generierung',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};