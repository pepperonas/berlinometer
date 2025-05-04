const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Benutzer registrieren
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Prüfen, ob Benutzer bereits existiert
    let user = await User.findOne({ email });
    
    if (user) {
      return res.status(400).json({
        success: false,
        error: 'Ein Benutzer mit dieser E-Mail existiert bereits'
      });
    }
    
    // Neuen Benutzer erstellen
    user = new User({
      name,
      email,
      password,
      // Standardmäßig inaktiv, bis Admin aktiviert
      active: false
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'Registrierung erfolgreich! Dein Konto wird vom Administrator aktiviert.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        active: user.active
      }
    });
  } catch (err) {
    console.error('Error in register:', err);
    res.status(500).json({
      success: false,
      error: 'Serverfehler bei der Registrierung'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Benutzer anmelden
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validierung der Eingaben
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bitte gib E-Mail und Passwort ein'
      });
    }
    
    // Benutzer in DB suchen mit Passwort
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Ungültige Anmeldedaten'
      });
    }
    
    // Passwort überprüfen
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Ungültige Anmeldedaten'
      });
    }
    
    // Überprüfen, ob das Konto aktiviert ist
    if (!user.active) {
      return res.status(401).json({
        success: false,
        error: 'Dein Konto wurde noch nicht aktiviert'
      });
    }
    
    // Erfolgreich angemeldet, Token erstellen
    const token = user.getSignedJwtToken();
    
    // Token in Cookie speichern
    const options = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 Tag
      httpOnly: true
    };
    
    // Secure Cookie nur in Produktion
    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }
    
    res.status(200)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active
        }
      });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({
      success: false,
      error: 'Serverfehler bei der Anmeldung'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Aktuellen Benutzer abrufen
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Error in get me:', err);
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Abrufen des Benutzerprofils'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Benutzer abmelden
// @access  Private
router.post('/logout', (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Sofort ablaufen (10 Sekunden)
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = router;