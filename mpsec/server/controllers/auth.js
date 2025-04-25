const User = require('../models/User');

// @desc    Benutzer registrieren
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Prüfen, ob Benutzer bereits existiert
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({
        message: 'Benutzer existiert bereits'
      });
    }

    // Benutzer erstellen
    const user = await User.create({
      username,
      password
    });

    // Token erstellen und zurückgeben
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Benutzer anmelden
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Prüfen, ob Benutzername und Passwort vorhanden sind
    if (!username || !password) {
      return res.status(400).json({
        message: 'Bitte gib Benutzername und Passwort ein'
      });
    }

    // Benutzer in DB suchen (mit Passwort)
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({
        message: 'Ungültige Anmeldedaten'
      });
    }

    // Passwort überprüfen
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Ungültige Anmeldedaten'
      });
    }

    // Token erstellen und zurückgeben
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Aktuelle Benutzerinfo abrufen
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// Hilfsfunktion zum Erstellen und Senden des JWT-Tokens
const sendTokenResponse = (user, statusCode, res) => {
  // Token erstellen
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username
    }
  });
};
