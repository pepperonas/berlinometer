const Token = require('../models/Token');
const { totp, authenticator } = require('otplib');

// @desc    Alle Tokens eines Benutzers abrufen
// @route   GET /api/tokens
// @access  Private
exports.getTokens = async (req, res, next) => {
  try {
    const tokens = await Token.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: tokens.length,
      data: tokens
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Einzelnen Token abrufen
// @route   GET /api/tokens/:id
// @access  Private
exports.getToken = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        message: 'Token nicht gefunden'
      });
    }

    // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
    if (token.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Nicht berechtigt, auf diesen Token zuzugreifen'
      });
    }

    res.status(200).json({
      success: true,
      data: token
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Neuen Token erstellen
// @route   POST /api/tokens
// @access  Private
exports.createToken = async (req, res, next) => {
  try {
    // Token zum Benutzer hinzufügen
    req.body.user = req.user.id;

    const token = await Token.create(req.body);

    res.status(201).json({
      success: true,
      data: token
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Token aktualisieren
// @route   PUT /api/tokens/:id
// @access  Private
exports.updateToken = async (req, res, next) => {
  try {
    let token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        message: 'Token nicht gefunden'
      });
    }

    // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
    if (token.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Nicht berechtigt, diesen Token zu bearbeiten'
      });
    }

    // Secret nicht aktualisieren, wenn nicht explizit angegeben
    if (!req.body.secret) {
      delete req.body.secret;
    }

    token = await Token.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: token
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Token löschen
// @route   DELETE /api/tokens/:id
// @access  Private
exports.deleteToken = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        message: 'Token nicht gefunden'
      });
    }

    // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
    if (token.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Nicht berechtigt, diesen Token zu löschen'
      });
    }

    await Token.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Aktuellen Code für einen Token generieren
// @route   GET /api/tokens/:id/code
// @access  Private
exports.generateCode = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        message: 'Token nicht gefunden'
      });
    }

    // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
    if (token.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Nicht berechtigt, auf diesen Token zuzugreifen'
      });
    }

    // TOTP-Konfiguration basierend auf Token-Einstellungen
    totp.options = {
      digits: token.digits,
      algorithm: token.algorithm,
      period: token.period
    };

    // Code generieren
    const code = totp.generate(token.secret);

    // Zeit bis zum Ablauf des Codes berechnen
    const remainingTime = totp.timeRemaining();

    res.status(200).json({
      success: true,
      data: {
        code,
        remainingTime
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    QR-Code für Token generieren
// @route   GET /api/tokens/:id/qrcode
// @access  Private
exports.generateQRCode = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        message: 'Token nicht gefunden'
      });
    }

    // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
    if (token.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Nicht berechtigt, auf diesen Token zuzugreifen'
      });
    }

    // otpauth URL für QR-Code generieren
    const otpauthUrl = authenticator.keyuri(
        token.name,
        token.issuer || 'MPSec',
        token.secret
    );

    res.status(200).json({
      success: true,
      data: {
        otpauthUrl
      }
    });
  } catch (err) {
    next(err);
  }
};