const Token = require('../models/Token');
const {totp, authenticator} = require('otplib');

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

        await Token.deleteOne({_id: req.params.id});

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

        try {
            // Secret normalisieren (Leerzeichen entfernen, zu Großbuchstaben)
            let normalizedSecret = token.secret;

            // Entferne alle Leerzeichen, Tabulatoren und Zeilenumbrüche
            normalizedSecret = normalizedSecret.replace(/\s+/g, '');

            // Zu Großbuchstaben umwandeln (Base32 Standard)
            normalizedSecret = normalizedSecret.toUpperCase();

            // Prüfe, ob das Secret ein gültiges Base32-Format hat
            if (!/^[A-Z2-7]+=*$/.test(normalizedSecret)) {
                console.warn(`Secret für Token ${token._id} hat ungewöhnliches Format: ${normalizedSecret.substring(0, 5)}...`);
            }

            // TOTP-Konfiguration zurücksetzen und mit den Token-Einstellungen konfigurieren
            totp.options = {
                digits: token.digits || 6,
                algorithm: 'sha1', // Vereinfachen auf Standard-Algorithmus
                period: token.period || 30,
            };

            // Versuche den Code zu generieren, fange spezifische Fehler ab
            try {
                const code = totp.generate(normalizedSecret);
                const remainingTime = totp.timeRemaining();

                res.status(200).json({
                    success: true,
                    data: {
                        code,
                        remainingTime
                    }
                });
            } catch (otpError) {
                console.error('TOTP Generierungsfehler:', otpError);

                // Fallback: Versuche es mit der authenticator-Bibliothek
                try {
                    authenticator.options = {
                        digits: token.digits || 6,
                        period: token.period || 30
                    };

                    const code = authenticator.generate(normalizedSecret);
                    const epoch = Math.floor(Date.now() / 1000);
                    const counter = Math.floor(epoch / token.period);
                    const step = counter * token.period;
                    const remainingTime = step + token.period - epoch;

                    res.status(200).json({
                        success: true,
                        data: {
                            code,
                            remainingTime
                        }
                    });
                } catch (authError) {
                    console.error('Authenticator Generierungsfehler:', authError);
                    throw new Error('Code konnte mit keiner Methode generiert werden');
                }
            }
        } catch (genError) {
            console.error('Code-Generierungsfehler für Token:', token._id);
            console.error('Token-Daten:', {
                type: token.type,
                algorithm: token.algorithm,
                digits: token.digits,
                period: token.period,
                secretPrefix: token.secret ? token.secret.substring(0, 3) + '...' : 'undefined'
            });
            console.error('Fehler:', genError);

            res.status(400).json({
                success: false,
                message: 'Code konnte nicht generiert werden. Möglicherweise ungültiges Secret-Format.',
                error: genError.message
            });
        }
    } catch (err) {
        console.error('Allgemeiner Fehler in generateCode:', err);
        next(err);
    }
};

exports.generateSimpleCode = async (req, res, next) => {
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

        // Sehr einfache Fallback-Methode ohne Abhängigkeit von otplib
        const now = Math.floor(Date.now() / 1000);
        const counter = Math.floor(now / token.period);

        // Normalisiertes Secret für die Hash-Berechnung
        const normalizedSecret = token.secret.replace(/\s+/g, '').toUpperCase();

        // Einfaches Hash berechnen
        const crypto = require('crypto');

        // Secret mit verschiedenen Methoden ausprobieren
        let keyBuffer;
        try {
            // Versuch 1: String als direkte Bytes verwenden
            keyBuffer = Buffer.from(normalizedSecret);

            // Counter als Buffer
            const counterBuffer = Buffer.alloc(8);
            for (let i = 0; i < 8; i++) {
                counterBuffer[7 - i] = (counter >>> (i * 8)) & 0xff;
            }

            // HMAC berechnen
            const hmac = crypto.createHmac('sha1', keyBuffer);
            hmac.update(counterBuffer);
            const digest = hmac.digest();

            // Offset bestimmen
            const offset = digest[digest.length - 1] & 0x0f;

            // Code berechnen (RFC 4226)
            const binary = ((digest[offset] & 0x7f) << 24) |
                ((digest[offset + 1] & 0xff) << 16) |
                ((digest[offset + 2] & 0xff) << 8) |
                (digest[offset + 3] & 0xff);

            // Auf die gewünschte Stellenanzahl reduzieren
            const otp = binary % Math.pow(10, token.digits);
            const code = otp.toString().padStart(token.digits, '0');

            // Verbleibende Zeit berechnen
            const remainingTime = token.period - (now % token.period);

            res.status(200).json({
                success: true,
                data: {
                    code,
                    remainingTime,
                    message: 'Universelle Fallback-Methode verwendet'
                }
            });
        } catch (error) {
            // Bei Problemen einen Platzhalter-Code zurückgeben
            console.error('Fehler bei der Code-Generierung:', error);

            // Notfall-Fallback: Erzeuge einen simulierten Code basierend auf Zeit
            const code = (counter % Math.pow(10, token.digits))
                .toString().padStart(token.digits, '0');

            const remainingTime = token.period - (now % token.period);

            res.status(200).json({
                success: true,
                data: {
                    code,
                    remainingTime,
                    message: 'Notfall-Fallback verwendet (möglicherweise inkorrekt)'
                }
            });
        }
    } catch (err) {
        console.error('Allgemeiner Fehler im Fallback-Generator:', err);
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

exports.importTokens = async (req, res, next) => {
    try {
        const {tokens} = req.body;

        if (!tokens || !Array.isArray(tokens)) {
            return res.status(400).json({
                success: false,
                message: 'Ungültiges Format: Ein Array von Tokens wird erwartet'
            });
        }

        // Statistik für den Import
        const stats = {
            total: tokens.length,
            imported: 0,
            skipped: 0,
            errors: []
        };

        // Tokens nacheinander verarbeiten
        for (const tokenData of tokens) {
            try {
                console.log('Importiere Token:', tokenData.Username);

                // Minimale Validierung der erforderlichen Felder
                if (!tokenData.Secret || !tokenData.Username) {
                    stats.skipped++;
                    stats.errors.push(`Token ohne Secret oder Username übersprungen`);
                    continue;
                }

                // Algorithmus korrekt parsen
                let algorithm = 'SHA1'; // Standardwert
                if (tokenData.Algorithm) {
                    // Entferne "HMAC-" Prefix und normalisiere
                    algorithm = tokenData.Algorithm.replace('HMAC-', '').toUpperCase();
                    // Prüfe auf gültige Algorithmen
                    if (!['SHA1', 'SHA256', 'SHA512'].includes(algorithm)) {
                        algorithm = 'SHA1'; // Fallback auf SHA1
                    }
                }

                // Secret bereinigen - entferne mögliche Leerzeichen und normalisiere Base32
                let secret = tokenData.Secret.replace(/\s+/g, '').toUpperCase();

                // Debug-Ausgabe
                console.log(`Importiere Token: User=${tokenData.Username}, Issuer=${tokenData.Issuer || 'Nicht angegeben'}`);
                console.log(`Konfiguration: Algorithm=${algorithm}, Digits=${tokenData.Digits || 6}, Period=${tokenData.Period || 30}`);

                // Token-Daten transformieren in das Format des Models
                const newToken = {
                    name: tokenData.Username || 'Importierter Token',
                    secret: secret,
                    issuer: tokenData.Issuer || '',
                    type: 'totp', // Standard ist TOTP
                    algorithm: algorithm,
                    digits: parseInt(tokenData.Digits) || 6,
                    period: parseInt(tokenData.Period) || 30,
                    user: req.user.id // Zum aktuellen Benutzer zuweisen
                };

                // Token in der Datenbank speichern
                await Token.create(newToken);
                stats.imported++;
            } catch (tokenError) {
                console.error('Fehler beim Importieren eines Tokens:', tokenError);
                stats.skipped++;
                stats.errors.push(`Token konnte nicht importiert werden: ${tokenError.message}`);
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

exports.generateOTPManagerCode = async (req, res, next) => {
    try {
        const token = await Token.findById(req.params.id);

        if (!token) {
            return res.status(404).json({ message: 'Token nicht gefunden' });
        }

        // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
        if (token.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Nicht berechtigt, auf diesen Token zuzugreifen' });
        }

        // Analyse und Normalisierung des Secret-Formats
        let secret = token.secret.replace(/\s+/g, '');

        // Speziell für OTPManager
        // Prüfen, ob wir eine Base32-Konvertierung vornehmen müssen
        const base32Chars = /^[A-Z2-7]+=*$/i;
        if (!base32Chars.test(secret)) {
            // Nicht-standardkonforme Zeichen ersetzen
            secret = secret.replace(/8/g, 'B').replace(/9/g, 'C')
                .replace(/0/g, 'O').replace(/1/g, 'I')
                .replace(/4/g, '4').replace(/5/g, '5')
                .replace(/6/g, '6');
        }

        // Aktueller Zeitstempel in Sekunden
        const now = Math.floor(Date.now() / 1000);

        // Zeitfenster (typischerweise 30 Sekunden)
        const step = Math.floor(now / token.period);

        // Zähler als 8-Byte-Buffer (big-endian)
        const counter = Buffer.alloc(8);
        for (let i = 0; i < 8; i++) {
            counter[7 - i] = (step >>> (i * 8)) & 0xff;
        }

        // HMAC berechnen
        const crypto = require('crypto');
        let key;

        // Verschiedene Secret-Formate testen
        const possibleKeys = [
            Buffer.from(secret, 'base32'), // Standard Base32
            Buffer.from(secret),           // Direkter Buffer
            Buffer.from(secret, 'utf8'),   // UTF-8
            Buffer.from(secret, 'ascii'),  // ASCII
            Buffer.from(secret, 'hex')     // Hex
        ];

        // Mehrere Möglichkeiten ausprobieren
        for (let keyAttempt of possibleKeys) {
            try {
                const hmac = crypto.createHmac('sha1', keyAttempt);
                hmac.update(counter);
                const digest = hmac.digest();

                // Offset berechnen
                const offset = digest[digest.length - 1] & 0x0f;

                // Code berechnen (RFC 4226)
                let binary = ((digest[offset] & 0x7f) << 24) |
                    ((digest[offset + 1] & 0xff) << 16) |
                    ((digest[offset + 2] & 0xff) << 8) |
                    (digest[offset + 3] & 0xff);

                // Auf die gewünschte Anzahl von Stellen reduzieren
                let code = (binary % Math.pow(10, token.digits)).toString().padStart(token.digits, '0');

                // Verbleibende Zeit berechnen
                const remainingTime = token.period - (now % token.period);

                // Code als Variante merken
                key = keyAttempt;

                // Alle drei möglichen Codes zurücksenden (für Vergleich mit der App)
                // Die Frontend-Komponente kann dann den korrekten Code anzeigen
                res.status(200).json({
                    success: true,
                    data: {
                        code: code,
                        remainingTime: remainingTime,
                        alternativeCodes: possibleKeys.map(k => {
                            try {
                                const h = crypto.createHmac('sha1', k);
                                h.update(counter);
                                const d = h.digest();
                                const o = d[d.length - 1] & 0x0f;
                                const b = ((d[o] & 0x7f) << 24) |
                                    ((d[o + 1] & 0xff) << 16) |
                                    ((d[o + 2] & 0xff) << 8) |
                                    (d[o + 3] & 0xff);
                                return (b % Math.pow(10, token.digits)).toString().padStart(token.digits, '0');
                            } catch (e) {
                                return "------";
                            }
                        })
                    }
                });
                return; // Beenden, wenn wir erfolgreich sind
            } catch (e) {
                // Nächsten Schlüssel versuchen
                continue;
            }
        }

        // Wenn keiner der Versuche funktioniert hat
        throw new Error("Konnte keinen gültigen Code generieren");

    } catch (err) {
        console.error('OTPManager-spezifische Fehler:', err);
        // Fallback zur einfachen Code-Generierung
        const now = Math.floor(Date.now() / 1000);
        const step = Math.floor(now / token.period);
        const code = (step % Math.pow(10, token.digits)).toString().padStart(token.digits, '0');
        const remainingTime = token.period - (now % token.period);

        res.status(200).json({
            success: true,
            data: {
                code: code,
                remainingTime: remainingTime,
                message: "Fallback-Methode (Token möglicherweise inkorrekt)"
            }
        });
    }
};

exports.deleteAllTokens = async (req, res, next) => {
    try {
        // Alle Tokens des aktuellen Benutzers finden und löschen
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