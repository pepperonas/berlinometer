const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bar = require('../models/Bar');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Benutzer registrieren (mit Bar)
// @access  Public
router.post('/register', async (req, res) => {
  console.log('REGISTER API CALLED', req.body);
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
        error: 'Bitte alle Pflichtfelder ausfüllen (Name der Bar, E-Mail, Passwort)'
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

    try {
      // Zunächst eine Bar für den Benutzer erstellen
      const bar = new Bar({
        name: name, // Name des Benutzers als Name der Bar
        address: {},
        contact: {
          email: email
        },
        isActive: true
      });

      console.log('Trying to save bar...');
      await bar.save();
      console.log('Bar saved successfully:', bar._id);

      // Neuen Benutzer erstellen und mit der Bar verknüpfen
      user = new User({
        name, // Name des Benutzers (entspricht Namen der Bar)
        email,
        password,
        bar: bar._id,
        // Standardmäßig inaktiv, bis Admin aktiviert
        active: false
      });

      console.log('Trying to save user...');
      await user.save();
      console.log('User saved successfully:', user._id);

      // Bar aktualisieren, um den Benutzer als Besitzer festzulegen
      bar.owner = user._id;
      await bar.save();
      console.log('Bar updated with owner reference');

      console.log('New user and bar registered successfully:', {
        userId: user._id,
        barId: bar._id
      });

      res.status(201).json({
        success: true,
        message: 'Registrierung erfolgreich! Dein Konto wird vom Administrator aktiviert.',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          active: user.active,
          bar: {
            id: bar._id,
            name: bar.name
          }
        }
      });
    } catch (dbError) {
      console.error('Database error during registration:', dbError);
      return res.status(500).json({
        success: false,
        error: `Datenbankfehler bei der Registrierung: ${dbError.message}`
      });
    }
  } catch (err) {
    console.error('Error in register:', err);
    res.status(500).json({
      success: false,
      error: `Serverfehler bei der Registrierung: ${err.message}`
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

      // Bar-Informationen abrufen
      let barInfo = null;
      if (user.bar) {
        const bar = await Bar.findById(user.bar);
        if (bar) {
          barInfo = {
            id: bar._id,
            name: bar.name,
            address: bar.address,
            contact: bar.contact,
            logo: bar.logo
          };
        }
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
              active: user.active,
              bar: barInfo
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
    // Use _id instead of id (MongoDB uses _id)
    const user = await User.findById(req.user._id).populate('bar', 'name address contact logo isActive');

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        avatar: user.avatar,
        createdAt: user.createdAt,
        bar: user.bar ? {
          id: user.bar._id,
          name: user.bar.name,
          address: user.bar.address,
          contact: user.bar.contact,
          logo: user.bar.logo,
          isActive: user.bar.isActive
        } : null
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

// @route   PUT /api/auth/bar
// @desc    Bar-Informationen aktualisieren
// @access  Private
router.put('/bar', protect, async (req, res) => {
  try {
    const { name, address, contact, logo } = req.body;
    
    if (!req.barId) {
      return res.status(404).json({
        success: false,
        error: 'Keine Bar gefunden'
      });
    }
    
    // Aktualisiere die Bar-Informationen
    const bar = await Bar.findById(req.barId);
    
    if (!bar) {
      return res.status(404).json({
        success: false,
        error: 'Bar nicht gefunden'
      });
    }
    
    // Nur Felder aktualisieren, die angegeben wurden
    if (name) bar.name = name;
    if (address) bar.address = address;
    if (contact) bar.contact = contact;
    if (logo) bar.logo = logo;
    
    await bar.save();
    
    res.status(200).json({
      success: true,
      message: 'Bar-Informationen erfolgreich aktualisiert',
      data: {
        id: bar._id,
        name: bar.name,
        address: bar.address,
        contact: bar.contact,
        logo: bar.logo
      }
    });
  } catch (err) {
    console.error('Error updating bar:', err);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Aktualisieren der Bar-Informationen'
    });
  }
});

module.exports = router;
