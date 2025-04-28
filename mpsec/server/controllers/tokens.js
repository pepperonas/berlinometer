const Token = require('../models/Token');
const { totp, authenticator } = require('otplib');
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
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=';
    return [...secret].every(char => base32Chars.includes(char.toUpperCase()));
}

// @desc    Alle Tokens eines Benutzers abrufen
// @route   GET /api/tokens
// @access  Private
exports.getTokens = async (req, res, next) => {
    try {
        const tokens = await Token.find({user: req.user.id}).sort('position');

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

// @desc    OTP-Code für einen Token generieren
// @route   GET /api/tokens/:id/code
// @access  Private
// @route   GET /api/tokens/:id/code
// @access  Private
exports.generateCode = async (req, res, next) => {
    try {
        console.log(`[OTP] Generiere Code für Token ID: ${req.params.id}`);

        const token = await Token.findById(req.params.id);

        if (!token) {
            console.log(`[OTP] Token nicht gefunden: ${req.params.id}`);
            return res.status(404).json({
                success: false,
                message: 'Token nicht gefunden'
            });
        }

        if (token.user.toString() !== req.user.id) {
            console.log(`[OTP] Zugriff verweigert für User ${req.user.id} auf Token ${req.params.id}`);
            return res.status(403).json({
                success: false,
                message: 'Nicht berechtigt, auf diesen Token zuzugreifen'
            });
        }

        // TOTP-Konfiguration
        if (token.type === 'totp') {
            console.log(`[OTP] Token gefunden: ${token.name}, Algorithm: ${token.algorithm}, Digits: ${token.digits}, Period: ${token.period}`);

            // Secret validieren
            const secret = token.secret.trim().replace(/\s+/g, '');

            if (!isValidBase32(secret)) {
                console.error(`[OTP] Ungültiges Secret-Format: ${secret.substring(0, 5)}...`);
                return res.status(400).json({
                    success: false,
                    message: 'Ungültiges Secret-Format für OTP-Generierung'
                });
            }

            console.log(`[OTP] Secret validiert, Länge: ${secret.length}`);

            try {
                // KORRIGIERT: Korrekte Formatierung des Algorithmus
                let algorithm;
                if (token.algorithm === 'SHA1') algorithm = 'sha1';
                else if (token.algorithm === 'SHA256') algorithm = 'sha256';
                else if (token.algorithm === 'SHA512') algorithm = 'sha512';
                else algorithm = 'sha1'; // Fallback

                // Eigene Instanz von TOTP erstellen mit expliziten Optionen
                const totpOptions = {
                    digits: token.digits,
                    algorithm: algorithm, // Verwende die korrekt formatierte Version
                    period: token.period,
                    encoding: 'base32'
                };

                console.log(`[OTP] TOTP-Optionen: ${JSON.stringify(totpOptions)}`);

                // OTP generieren
                let code;
                try {
                    // Versuch 1: Mit totp.create
                    const totpInstance = totp.create({
                        secret: secret,
                        ...totpOptions
                    });
                    code = totpInstance.generate();
                    console.log(`[OTP] Code mit totp.create generiert: ${code}`);
                } catch (totpError) {
                    console.error(`[OTP] Fehler bei totp.create: ${totpError.message}`);

                    // Versuch 2: Direkt mit authenticator
                    try {
                        // Standardeinstellungen für authenticator
                        authenticator.options = {
                            digits: token.digits,
                            algorithm: algorithm, // Korrekt formatiert
                            period: token.period,
                            window: 0
                        };

                        code = authenticator.generate(secret);
                        console.log(`[OTP] Code mit authenticator generiert: ${code}`);
                    } catch (authError) {
                        console.error(`[OTP] Fehler bei authenticator: ${authError.message}`);
                        throw authError;
                    }
                }

                // Aktuelle Zeit
                const now = Math.floor(Date.now() / 1000);

                // Verbleibende Zeit
                const remainingTime = token.period - (now % token.period);

                // Antwort senden
                res.status(200).json({
                    success: true,
                    data: {
                        code,
                        remainingTime,
                        timestamp: now,
                        algorithm: token.algorithm,
                        digits: token.digits,
                        period: token.period
                    }
                });
            } catch (otpError) {
                console.error(`[OTP] Fehler bei OTP-Generierung: ${otpError.message}`);
                return res.status(500).json({
                    success: false,
                    message: 'Fehler bei der Code-Generierung',
                    error: process.env.NODE_ENV === 'development' ? otpError.message : undefined
                });
            }
        } else {
            // HOTP-Unterstützung könnte hier hinzugefügt werden
            console.log(`[OTP] Nicht unterstützter Token-Typ: ${token.type}`);
            return res.status(400).json({
                success: false,
                message: 'Nicht-TOTP-Token werden aktuell nicht unterstützt'
            });
        }
    } catch (err) {
        console.error('[OTP] Allgemeiner Fehler:', err);
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

// @desc    Serverzeit abrufen
// @route   GET /api/tokens/servertime
// @access  Private
exports.getServerTime = async (req, res, next) => {
    try {
        const serverTime = Math.floor(Date.now() / 1000);

        res.status(200).json({
            success: true,
            data: {
                serverTime
            }
        });
    } catch (err) {
        console.error('Fehler beim Abrufen der Serverzeit:', err);
        next(err);
    }
};

// @desc    Zeitkorrigierte OTP-Codes generieren
// @route   GET /api/tokens/:id/adjusted-code
// @access  Private
exports.generateAdjustedCode = async (req, res, next) => {
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

        // Zeitversatz abfragen (default: -3480 Sekunden, ca. -58 Minuten)
        const offset = parseInt(req.query.offset || -3480);

        if (isNaN(offset)) {
            return res.status(400).json({
                success: false,
                message: 'Ungültiger Zeitversatz-Parameter'
            });
        }

        // TOTP-Konfiguration
        if (token.type === 'totp') {
            // Secret validieren
            const secret = token.secret.trim().replace(/\s+/g, '');

            if (!isValidBase32(secret)) {
                console.error(`[OTP] Ungültiges Secret-Format für zeitkorrigierte Codes: ${secret.substring(0, 5)}...`);
                return res.status(400).json({
                    success: false,
                    message: 'Ungültiges Secret-Format für OTP-Generierung'
                });
            }

            try {
                // Aktuelle Zeit abrufen
                const actualTime = Math.floor(Date.now() / 1000);

                // Codes für verschiedene Zeitoffsets generieren
                const pastCodes = [];
                const futureCodes = [];

                // KORRIGIERT: Korrekte Formatierung des Algorithmus
                let algorithm;
                if (token.algorithm === 'SHA1') algorithm = 'sha1';
                else if (token.algorithm === 'SHA256') algorithm = 'sha256';
                else if (token.algorithm === 'SHA512') algorithm = 'sha512';
                else algorithm = 'sha1'; // Fallback

                // TOTP-Optionen
                const totpOptions = {
                    digits: token.digits,
                    algorithm: algorithm, // Verwende die korrekt formatierte Version
                    period: token.period,
                    encoding: 'base32'
                };

                console.log(`[OTP Adjusted] TOTP-Optionen: ${JSON.stringify(totpOptions)}`);

                // TOTP-Instanz erstellen
                const totpInstance = totp.create({
                    secret: secret,
                    ...totpOptions
                });

                // Vorherige Codes (-5 bis -1 Perioden)
                for (let i = 5; i >= 1; i--) {
                    const pastOffset = -i * token.period;
                    const timestamp = actualTime + offset + pastOffset;
                    // Hinweis: timestamp muss in Millisekunden übergeben werden
                    const pastCode = totpInstance.generate(timestamp * 1000);
                    pastCodes.push({
                        code: pastCode,
                        offset: pastOffset,
                        timestamp
                    });
                }

                // Aktueller Code
                const currentTimestamp = actualTime + offset;
                const currentCode = totpInstance.generate(currentTimestamp * 1000);
                const remainingTime = token.period - (currentTimestamp % token.period);

                // Zukünftige Codes (+1 bis +5 Perioden)
                for (let i = 1; i <= 5; i++) {
                    const futureOffset = i * token.period;
                    const timestamp = actualTime + offset + futureOffset;
                    const futureCode = totpInstance.generate(timestamp * 1000);
                    futureCodes.push({
                        code: futureCode,
                        offset: futureOffset,
                        timestamp
                    });
                }

                res.status(200).json({
                    success: true,
                    data: {
                        current: {
                            code: currentCode,
                            remainingTime,
                            timestamp: currentTimestamp,
                            actualTime
                        },
                        past: pastCodes,
                        future: futureCodes,
                        config: {
                            algorithm: token.algorithm,
                            digits: token.digits,
                            period: token.period,
                            appliedOffset: offset
                        }
                    }
                });
            } catch (err) {
                console.error('Fehler beim Generieren zeitkorrigierter OTP-Codes:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Fehler bei der zeitkorrigierten Code-Generierung',
                    error: process.env.NODE_ENV === 'development' ? err.message : undefined
                });
            }
        } else {
            // HOTP-Unterstützung könnte hier hinzugefügt werden
            return res.status(400).json({
                success: false,
                message: 'Nicht-TOTP-Token werden aktuell nicht unterstützt'
            });
        }
    } catch (err) {
        console.error('Fehler beim Generieren zeitkorrigierter OTP-Codes:', err);
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

exports.reorderTokens = async (req, res, next) => {
    try {
        const { tokenOrder } = req.body;

        if (!tokenOrder || !Array.isArray(tokenOrder)) {
            return res.status(400).json({
                success: false,
                message: 'Ungültige Daten für die Reihenfolge'
            });
        }

        console.log(`Aktualisiere Reihenfolge für ${tokenOrder.length} Tokens`);

        // Für jedes Token im Array die Position aktualisieren
        const updatePromises = tokenOrder.map(async (item, index) => {
            // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
            const token = await Token.findOne({
                _id: item.id,
                user: req.user.id
            });

            if (!token) {
                console.log(`Token ${item.id} nicht gefunden oder gehört nicht diesem Benutzer`);
                return null;
            }

            return Token.updateOne(
                { _id: item.id, user: req.user.id },
                { $set: { position: index } }
            );
        });

        // Alle Updates ausführen
        const results = await Promise.all(updatePromises);
        const validUpdates = results.filter(update => update !== null);

        res.status(200).json({
            success: true,
            message: `${validUpdates.length} Tokens neu angeordnet`,
            count: validUpdates.length
        });
    } catch (err) {
        console.error('Fehler beim Aktualisieren der Reihenfolge:', err);
        next(err);
    }
};