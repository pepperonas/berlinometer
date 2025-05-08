const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Benutzer registrieren
// @access  Public
router.post('/register', async (req, res) => {
  try {
    console.log('Register route hit with data:', {
      name: req.body.name,
      email: req.body.email,
      hasPassword: !!req.body.password
    });

    const { name, email, password } = req.body;

    // Prüfen, ob die Anfragedaten vorhanden sind
    if (!name || !email || !password) {
      console.log('Missing required fields for registration');
      return res.status(400).json({
        success: false,
        error: 'Bitte alle Pflichtfelder ausfüllen (Name, E-Mail, Passwort)'
      });
    }

    // Prüfen, ob Benutzer bereits existiert
    let user = await User.findOne({ email });

    if (user) {
      console.log('User with email already exists:', email);
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

    console.log('New user registered successfully:', user._id);

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
    console.log('Login attempt with email:', req.body.email);
    const { email, password } = req.body;

    // Validierung der Eingaben
    if (!email || !password) {
      console.log('Email or password missing');
      return res.status(400).json({
        success: false,
        error: 'Bitte gib E-Mail und Passwort ein'
      });
    }

    console.log('Finding user in database...');

    // Benutzer in DB suchen mit Passwort
    try {
      // Timeout für die findOne-Operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 8000);
      });

      // Eigentliche Datenbankabfrage
      const findUserPromise = User.findOne({ email }).select('+password');

      // Race zwischen Timeout und Datenbankabfrage
      const user = await Promise.race([findUserPromise, timeoutPromise]);

      console.log('User found:', !!user);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Ungültige Anmeldedaten'
        });
      }

      // Passwort überprüfen
      const isMatch = await user.matchPassword(password);

      console.log('Password match:', isMatch);

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

      console.log('Login successful, sending response');

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
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      res.status(500).json({
        success: false,
        error: 'Datenbankfehler bei der Anmeldung: ' + dbError.message
      });
    }
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

// @route   PUT /api/auth/change-password
// @desc    Passwort ändern
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    console.log('Change password request received:', {
      userId: req.user?._id,
      hasCurrentPassword: !!req.body.currentPassword,
      hasNewPassword: !!req.body.newPassword
    });

    const { currentPassword, newPassword } = req.body;

    // Validierung
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Bitte gib das aktuelle und neue Passwort ein'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein'
      });
    }

    // Benutzer mit Passwort aus DB holen
    const user = await User.findById(req.user._id).select('+password');

    console.log('User found:', !!user);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Aktuelles Passwort überprüfen
    const isMatch = await user.matchPassword(currentPassword);

    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Das aktuelle Passwort ist falsch'
      });
    }

    // Neues Passwort setzen
    user.password = newPassword;
    await user.save();

    console.log('Password changed successfully for user:', user._id);

    res.status(200).json({
      success: true,
      message: 'Passwort erfolgreich geändert',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active
      }
    });
  } catch (err) {
    console.error('Error in change password:', err);
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Ändern des Passworts'
    });
  }
});

// Alternative Methode POST für Passwortänderung (falls CORS oder andere Probleme mit PUT)
router.post('/change-password', protect, async (req, res) => {
  try {
    console.log('POST Change password request received');
    const { currentPassword, newPassword } = req.body;

    // Validierung
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Bitte gib das aktuelle und neue Passwort ein'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein'
      });
    }

    // Benutzer mit Passwort aus DB holen
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Aktuelles Passwort überprüfen
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Das aktuelle Passwort ist falsch'
      });
    }

    // Neues Passwort setzen
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Passwort erfolgreich geändert',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active
      }
    });
  } catch (err) {
    console.error('Error in change password (POST):', err);
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Ändern des Passworts'
    });
  }
});

module.exports = router;
