const Token = require('../models/Token');
const {totp, authenticator} = require('otplib');
const crypto = require('crypto');

// Hilfsfunktion: Base32-Dekodierung
function base32ToBytes(input) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = [];

    for (let i = 0; i < input.length; i++) {
        const char = input[i].toUpperCase();
        if (char === '=' || !alphabet.includes(char)) continue;

        const charValue = alphabet.indexOf(char);
        value = (value << 5) | charValue;
        bits += 5;

        if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }

    return Buffer.from(output);
}

// Hilfsfunktion: Base32-Validierung
function isValidBase32(secret) {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    return [...secret].every(char => base32Chars.includes(char) || char === '=');
}

// @desc    Alle Tokens eines Benutzers abrufen
// @route   GET /api/tokens
// @access  Private
exports.getTokens = async (req, res, next) => {
    try {
        const tokens = await Token.find({user: req.user.id});

        res.status(200).json({
            success: true,
            count: tokens.length,
            data: tokens
        });
    } catch (err) {
        console.error('Fehler beim Abrufen der Tokens:', err);
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
                success: false,
                message: 'Token nicht gefunden'
            });
        }

        // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
        if (token.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Nicht berechtigt, auf diesen Token zuzugreifen'
            });
        }

        res.status(200).json({
            success: true,
            data: token
        });
    } catch (err) {
        console.error('Fehler beim Abrufen des Tokens:', err);
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

        // Secret validieren
        if (req.body.secret) {
            const secret = req.body.secret.replace(/\s+/g, '').toUpperCase();
            if (!isValidBase32(secret)) {
                return res.status(400).json({
                    success: false,
                    message: 'Ungültiges Secret-Format. Nur Base32-Zeichen (A-Z, 2-7) erlaubt.'
                });
            }
            const secretKey = base32ToBytes(secret);
            if (secretKey.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ungültiges Secret-Format. Base32-Dekodierung fehlgeschlagen.'
                });
            }
            req.body.secret = secret;
        }

        // Parameter validieren
        req.body.period = req.body.period || 30;
        req.body.digits = req.body.digits || 6;
        req.body.algorithm = (req.body.algorithm || 'SHA1').toUpperCase();

        if (![30, 60, 90].includes(req.body.period)) {
            console.warn(`[TOTP] Ungültiger period-Wert: ${req.body.period}. Verwende Standardwert 30.`);
            req.body.period = 30;
        }
        if (![6, 8].includes(req.body.digits)) {
            console.warn(`[TOTP] Ungültiger digits-Wert: ${req.body.digits}. Verwende Standardwert 6.`);
            req.body.digits = 6;
        }
        if (!['SHA1', 'SHA256', 'SHA512'].includes(req.body.algorithm)) {
            console.warn(`[TOTP] Ungültiger Algorithmus: ${req.body.algorithm}. Verwende Standardwert SHA1.`);
            req.body.algorithm = 'SHA1';
        }

        const token = await Token.create(req.body);

        res.status(201).json({
            success: true,
            data: token
        });
    } catch (err) {
        console.error('Fehler beim Erstellen des Tokens:', err);
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
                success: false,
                message: 'Token nicht gefunden'
            });
        }

        // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
        if (token.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Nicht berechtigt, diesen Token zu bearbeiten'
            });
        }

        // Secret validieren, falls angegeben
        if (req.body.secret) {
            const secret = req.body.secret.replace(/\s+/g, '').toUpperCase();
            if (!isValidBase32(secret)) {
                return res.status(400).json({
                    success: false,
                    message: 'Ungültiges Secret-Format. Nur Base32-Zeichen (A-Z, 2-7) erlaubt.'
                });
            }
            const secretKey = base32ToBytes(secret);
            if (secretKey.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ungültiges Secret-Format. Base32-Dekodierung fehlgeschlagen.'
                });
            }
            req.body.secret = secret;
        } else {
            delete req.body.secret;
        }

        // Parameter validieren
        if (req.body.period && ![30, 60, 90].includes(req.body.period)) {
            console.warn(`[TOTP] Ungültiger period-Wert: ${req.body.period}. Verwende Standardwert 30.`);
            req.body.period = 30;
        }
        if (req.body.digits && ![6, 8].includes(req.body.digits)) {
            console.warn(`[TOTP] Ungültiger digits-Wert: ${req.body.digits}. Verwende Standardwert 6.`);
            req.body.digits = 6;
        }
        if (req.body.algorithm) {
            req.body.algorithm = req.body.algorithm.toUpperCase();
            if (!['SHA1', 'SHA256', 'SHA512'].includes(req.body.algorithm)) {
                console.warn(`[TOTP] Ungültiger Algorithmus: ${req.body.algorithm}. Verwende Standardwert SHA1.`);
                req.body.algorithm = 'SHA1';
            }
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
        console.error('Fehler beim Aktualisieren des Tokens:', err);
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
                success: false,
                message: 'Token nicht gefunden'
            });
        }

        // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
        if (token.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Nicht berechtigt, diesen Token zu löschen'
            });
        }

        await Token.deleteOne({_id: req.params.id});

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error('Fehler beim Löschen des Tokens:', err);
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
                success: false,
                message: 'Token nicht gefunden'
            });
        }

        if (token.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Nicht berechtigt, auf diesen Token zuzugreifen'
            });
        }

        if (!isValidBase32(token.secret)) {
            console.error(`[TOTP] Ungültiges Secret für QR-Code: ${token.secret}`);
            return res.status(400).json({
                success: false,
                message: 'Ungültiges Secret-Format. Nur Base32-Zeichen (A-Z, 2-7) erlaubt.'
            });
        }

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
        console.error('Fehler beim Generieren des QR-Codes:', err);
        next(err);
    }
};

// @desc    Tokens importieren
// @route   POST /api/tokens/import
// @access  Private
exports.importTokens = async (req, res, next) => {
    try {
        let tokensArray = [];
        const bodyData = req.body;

        // Erkennen des JSON-Formats
        if (Array.isArray(bodyData.tokens)) {
            tokensArray = bodyData.tokens;
            console.log('OTPManager-Format erkannt, Anzahl Tokens:', tokensArray.length);
        } else if (bodyData.services && Array.isArray(bodyData.services)) {
            tokensArray = bodyData.services;
            console.log('Aegis/Raivo-Format erkannt, Anzahl Tokens:', tokensArray.length);
        } else if (Array.isArray(bodyData)) {
            tokensArray = bodyData;
            console.log('Direktes Array-Format erkannt, Anzahl Tokens:', tokensArray.length);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Ungültiges JSON-Format: Weder OTPManager- noch Aegis/Raivo-Format erkannt'
            });
        }

        const stats = {
            total: tokensArray.length,
            imported: 0,
            skipped: 0,
            errors: []
        };

        for (const tokenData of tokensArray) {
            try {
                let name, secret, issuer, algorithm, digits, period, tokenType;

                // OTPManager-Format
                if (tokenData.Username !== undefined) {
                    console.log('Verarbeite OTPManager-Token:', tokenData.Username);
                    name = tokenData.Username;
                    secret = tokenData.Secret;
                    issuer = tokenData.Issuer || '';
                    algorithm = (tokenData.Algorithm || 'SHA1').replace(/^HMAC-|^SHA-?/i, '').toUpperCase();
                    digits = parseInt(tokenData.Digits) || 6;
                    period = parseInt(tokenData.Period) || 30;
                    tokenType = 'totp';
                }
                // Aegis/Raivo-ähnliches Format
                else if (tokenData.name !== undefined && tokenData.secret !== undefined) {
                    console.log('Verarbeite Aegis/Raivo-Token:', tokenData.name);
                    name = tokenData.otp?.account || tokenData.otp?.label || tokenData.name;
                    secret = tokenData.secret;
                    issuer = tokenData.otp?.issuer || '';
                    algorithm = (tokenData.otp?.algorithm || 'SHA1').replace(/^HMAC-|^SHA-?/i, '').toUpperCase();
                    digits = parseInt(tokenData.otp?.digits) || 6;
                    period = parseInt(tokenData.otp?.period) || 30;
                    tokenType = (tokenData.otp?.tokenType || 'TOTP').toLowerCase();
                } else {
                    throw new Error(`Unbekanntes Token-Format für ${JSON.stringify(tokenData).substring(0, 50)}...`);
                }

                if (!secret || !name) {
                    stats.skipped++;
                    stats.errors.push(`Token ohne Secret oder Name/Username übersprungen: ${name || 'Unbekannt'}`);
                    continue;
                }

                secret = secret.replace(/\s+/g, '').toUpperCase();

                if (!isValidBase32(secret)) {
                    stats.skipped++;
                    stats.errors.push(`Ungültiges Secret-Format für ${name}: Nur Base32-Zeichen (A-Z, 2-7) erlaubt`);
                    continue;
                }

                const secretKey = base32ToBytes(secret);
                if (secretKey.length === 0) {
                    stats.skipped++;
                    stats.errors.push(`Base32-Dekodierung fehlgeschlagen für ${name}: ${secret}`);
                    continue;
                }

                if (!['SHA1', 'SHA256', 'SHA512'].includes(algorithm)) {
                    console.warn(`Ungültiger Algorithmus für ${name}: ${algorithm}. Verwende Standardwert SHA1.`);
                    algorithm = 'SHA1';
                }

                if (![6, 8].includes(digits)) {
                    console.warn(`Ungültiger digits-Wert für ${name}: ${digits}. Verwende Standardwert 6.`);
                    digits = 6;
                }

                if (![30, 60, 90].includes(period)) {
                    console.warn(`Ungültiger period-Wert für ${name}: ${period}. Verwende Standardwert 30.`);
                    period = 30;
                }

                console.log(`Importiere Token: Name=${name}, Issuer=${issuer || 'Nicht angegeben'}`);
                console.log(`Konfiguration: Algorithm=${algorithm}, Digits=${digits}, Period=${period}, Type=${tokenType}`);
                console.log(`Secret-Länge: ${secret.length}, Dekodierte Bytes: ${secretKey.length}`);

                const newToken = {
                    name,
                    secret,
                    issuer,
                    type: tokenType,
                    algorithm,
                    digits,
                    period,
                    user: req.user.id
                };

                await Token.create(newToken);
                stats.imported++;
            } catch (tokenError) {
                console.error(`Fehler beim Importieren eines Tokens (${name || 'Unbekannt'}):`, tokenError);
                stats.skipped++;
                stats.errors.push(`Token konnte nicht importiert werden (${name || 'Unbekannt'}): ${tokenError.message}`);
            }
        }

        res.status(200).json({
            success: true,
            data: {
                total: stats.total,
                imported: stats.imported,
                skipped: stats.skipped,
                errors: stats.errors.length > 0 ? stats.errors : undefined
            }
        });
    } catch (err) {
        console.error('Import-Fehler:', err);
        next(err);
    }
};

// @desc    Alle Tokens eines Benutzers löschen
// @route   DELETE /api/tokens
// @access  Private
exports.deleteAllTokens = async (req, res, next) => {
    try {
        const result = await Token.deleteMany({user: req.user.id});

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} Tokens wurden gelöscht`,
            count: result.deletedCount
        });
    } catch (err) {
        console.error('Fehler beim Löschen aller Tokens:', err);
        next(err);
    }
};
