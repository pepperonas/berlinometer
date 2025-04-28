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

// @desc    OTPManager-spezifischer Code-Generator
// @route   GET /api/tokens/:id/otpmanager-code
// @access  Private
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

        // Zeit und Counter berechnen
        const now = Math.floor(Date.now() / 1000);
        const counter = Math.floor(now / token.period);

        console.log(`[TOTP] Token: ${token._id}, Name: ${token.name}, Timestamp: ${now}, Counter: ${counter}`);

        // Secret vorbereiten
        let secret = token.secret.replace(/\s+/g, '').toUpperCase();

        // Secret validieren
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const invalidChars = [...secret].filter(c => !base32Chars.includes(c) && c !== '=');

        if (invalidChars.length > 0) {
            console.log(`[TOTP] Secret enthält ungültige Zeichen: ${invalidChars.join('')}`);

            // OTPManager-Konvertierung anwenden
            secret = secret.replace(/0/g, 'O').replace(/1/g, 'I').replace(/8/g, 'B').replace(/9/g, 'C');

            // Nach Konvertierung nochmals prüfen
            const stillInvalid = [...secret].filter(c => !base32Chars.includes(c) && c !== '=');

            if (stillInvalid.length > 0) {
                console.error(`[TOTP] Secret immer noch ungültig nach Konvertierung: ${stillInvalid.join('')}`);
            } else {
                console.log(`[TOTP] Secret erfolgreich konvertiert: ${secret.substring(0, 4)}...`);
            }
        }

        // Base32-Dekodierung (streng nach RFC 4648)
        function base32ToBytes(input) {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            let bits = 0;
            let value = 0;
            let output = [];

            for (let i = 0; i < input.length; i++) {
                const char = input[i].toUpperCase();

                // Padding oder ungültige Zeichen überspringen
                if (char === '=' || !alphabet.includes(char)) continue;

                // Den Wert des Zeichens im Alphabet finden
                const charValue = alphabet.indexOf(char);

                // 5 Bits hinzufügen
                value = (value << 5) | charValue;
                bits += 5;

                // Wenn wir mindestens 8 Bits haben, können wir ein Byte extrahieren
                if (bits >= 8) {
                    output.push((value >>> (bits - 8)) & 0xff);
                    bits -= 8;
                }
            }

            return Buffer.from(output);
        }

        // Secret dekodieren
        const secretKey = base32ToBytes(secret);

        console.log(`[TOTP] Secret-Länge in Bytes: ${secretKey.length}`);
        console.log(`[TOTP] Secret-Bytes (Hex): ${secretKey.toString('hex').substring(0, 16)}...`);

        // Counter als 8-Byte Buffer (RFC 4226)
        const counterBuffer = Buffer.alloc(8);
        for (let i = 0; i < 8; i++) {
            counterBuffer[7 - i] = (counter >>> (i * 8)) & 0xff;
        }

        console.log(`[TOTP] Counter-Bytes: ${counterBuffer.toString('hex')}`);

        // HMAC-SHA1 berechnen (RFC 4226)
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha1', secretKey);
        hmac.update(counterBuffer);
        const digest = hmac.digest();

        console.log(`[TOTP] HMAC-SHA1 (Hex): ${digest.toString('hex').substring(0, 16)}...`);

        // Dynamic Truncation (RFC 4226)
        const offset = digest[digest.length - 1] & 0x0f;

        console.log(`[TOTP] Truncation Offset: ${offset}`);

        const binary = ((digest[offset] & 0x7f) << 24) |
            ((digest[offset + 1] & 0xff) << 16) |
            ((digest[offset + 2] & 0xff) << 8) |
            (digest[offset + 3] & 0xff);

        console.log(`[TOTP] Binary Value: ${binary}`);

        // Code generieren (letzte n Stellen)
        const code = (binary % Math.pow(10, token.digits)).toString().padStart(token.digits, '0');

        console.log(`[TOTP] Generierter Code: ${code}`);

        // Verbleibende Zeit
        const remainingTime = token.period - (now % token.period);

        // Erfolgreiche Antwort
        return res.status(200).json({
            success: true,
            data: {
                code: code,
                remainingTime: remainingTime,
                debug: {
                    timestamp: now,
                    counter: counter,
                    secretLength: secretKey.length,
                    hmacOffset: offset
                }
            }
        });
    } catch (err) {
        console.error('[TOTP] Fehler:', err);
        next(err);
    }
};

// @desc    Einfache Fallback-Methode für Code-Generierung
// @route   GET /api/tokens/:id/simple-code
// @access  Private
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

// @desc    Tokens importieren
// @route   POST /api/tokens/import
// @access  Private
exports.importTokens = async (req, res, next) => {
    try {
        let tokensArray = [];
        const bodyData = req.body;

        // Erkennen des JSON-Formats
        if (Array.isArray(bodyData.tokens)) {
            // OTPManager Format
            tokensArray = bodyData.tokens;
            console.log('OTPManager-Format erkannt, Anzahl Tokens:', tokensArray.length);
        } else if (bodyData.services && Array.isArray(bodyData.services)) {
            // Aegis/Raivo-ähnliches Format
            tokensArray = bodyData.services;
            console.log('Aegis/Raivo-Format erkannt, Anzahl Tokens:', tokensArray.length);
        } else if (Array.isArray(bodyData)) {
            // Direktes Array
            tokensArray = bodyData;
            console.log('Direktes Array-Format erkannt, Anzahl Tokens:', tokensArray.length);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Ungültiges JSON-Format: Weder OTPManager- noch Aegis/Raivo-Format erkannt'
            });
        }

        // Statistik für den Import
        const stats = {
            total: tokensArray.length,
            imported: 0,
            skipped: 0,
            errors: []
        };

        // Base32-Alphabet zur Validierung
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

        // Tokens nacheinander verarbeiten
        for (const tokenData of tokensArray) {
            try {
                // Formatspezifische Extraktion der Werte
                let name, secret, issuer, algorithm, digits, period, tokenType;

                // OTPManager-Format
                if (tokenData.Username !== undefined) {
                    console.log('Verarbeite OTPManager-Token:', tokenData.Username);
                    name = tokenData.Username;
                    secret = tokenData.Secret;
                    issuer = tokenData.Issuer || '';
                    algorithm = tokenData.Algorithm ? tokenData.Algorithm.replace('HMAC-', '') : 'SHA1';
                    digits = parseInt(tokenData.Digits) || 6;
                    period = parseInt(tokenData.Period) || 30;
                    tokenType = 'totp'; // OTPManager verwendet hauptsächlich TOTP
                }
                // Aegis/Raivo-ähnliches Format
                else if (tokenData.name !== undefined && tokenData.secret !== undefined) {
                    console.log('Verarbeite Aegis/Raivo-Token:', tokenData.name);
                    name = tokenData.otp?.account || tokenData.otp?.label || tokenData.name;
                    secret = tokenData.secret;
                    issuer = tokenData.otp?.issuer || '';
                    algorithm = tokenData.otp?.algorithm || 'SHA1';
                    digits = parseInt(tokenData.otp?.digits) || 6;
                    period = parseInt(tokenData.otp?.period) || 30;
                    tokenType = (tokenData.otp?.tokenType || 'TOTP').toLowerCase();
                } else {
                    throw new Error('Unbekanntes Token-Format');
                }

                // Minimale Validierung der erforderlichen Felder
                if (!secret || !name) {
                    stats.skipped++;
                    stats.errors.push(`Token ohne Secret oder Name/Username übersprungen`);
                    continue;
                }

                // Algorithmus normalisieren
                algorithm = algorithm.toUpperCase();
                if (!['SHA1', 'SHA256', 'SHA512'].includes(algorithm)) {
                    algorithm = 'SHA1'; // Fallback auf SHA1
                }

                // Secret bereinigen und normalisieren
                secret = secret.replace(/\s+/g, '').toUpperCase();

                // Secret auf Base32-Kompatibilität prüfen und anpassen
                const isValidBase32 = [...secret].every(char =>
                    base32Chars.includes(char) || char === '='
                );

                // Für OTPManager-Format: Ersetzungen vornehmen, wenn nicht Base32-konform
                if (tokenData.Username !== undefined && !isValidBase32) {
                    console.log(`OTPManager-Token mit nicht-Base32-konformem Secret: ${secret.substring(0, 3)}...`);
                    secret = secret
                        .replace(/0/g, 'O')
                        .replace(/1/g, 'I')
                        .replace(/8/g, 'B')
                        .replace(/9/g, 'C');

                    // Nach Ersetzung nochmals prüfen
                    const nowValid = [...secret].every(char =>
                        base32Chars.includes(char) || char === '='
                    );

                    console.log(`Secret nach Ersetzung ${nowValid ? 'ist gültig' : 'immer noch ungültig'}: ${secret.substring(0, 3)}...`);
                }

                // Bei Aegis-Format: Auch hier OTPManager-Konvertierung anwenden
                if (tokenData.name !== undefined && !isValidBase32) {
                    console.log(`Aegis-Token mit nicht-Base32-konformem Secret: ${secret.substring(0, 3)}...`);
                    // OTPManager-Konvertierung auch hier anwenden
                    secret = secret
                        .replace(/0/g, 'O')
                        .replace(/1/g, 'I')
                        .replace(/8/g, 'B')
                        .replace(/9/g, 'C');

                    const nowValid = [...secret].every(char =>
                        base32Chars.includes(char) || char === '='
                    );

                    if (!nowValid) {
                        stats.errors.push(`Warnung: Secret für ${name} nicht Base32-konform`);
                    }
                }

                // Debug-Ausgabe
                console.log(`Importiere Token: Name=${name}, Issuer=${issuer || 'Nicht angegeben'}`);
                console.log(`Konfiguration: Algorithm=${algorithm}, Digits=${digits}, Period=${period}`);
                console.log(`Secret-Länge: ${secret.length}`);

                // Token-Daten im Format des Models
                const newToken = {
                    name: name,
                    secret: secret,
                    issuer: issuer,
                    type: tokenType,
                    algorithm: algorithm,
                    digits: digits,
                    period: period,
                    user: req.user.id
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

// @desc    Alle Tokens eines Benutzers löschen
// @route   DELETE /api/tokens
// @access  Private
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