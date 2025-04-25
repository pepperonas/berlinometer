const User = require('../models/User');

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
    const { username, password } = req.body;

    console.log('Anmeldeversuch:', { username });

    // Prüfen, ob Benutzername und Passwort vorhanden sind
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Bitte gib Benutzername und Passwort ein'
      });
    }

    // Benutzer in DB suchen (mit Passwort)
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      console.log('Benutzer nicht gefunden:', { username });
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    // Passwort überprüfen
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('Passwort stimmt nicht überein:', { username });
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    console.log('Benutzer angemeldet:', { id: user._id, username: user.username });

    // Token erstellen und zurückgeben
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Login-Fehler:', err);
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

// Hilfsfunktion zum Erstellen und Senden des JWT-Tokens
const sendTokenResponse = (user, statusCode, res) => {
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
};