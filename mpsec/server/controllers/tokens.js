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

                // Bei Aegis-Format: Secret direkt verwenden, da es bereits Base32-konform ist
                if (tokenData.name !== undefined && !isValidBase32) {
                    console.log(`Aegis-Token mit nicht-Base32-konformem Secret: ${secret.substring(0, 3)}...`);
                    // Hier keine Ersetzungen, da Aegis für gewöhnlich valide Base32-Secrets exportiert
                    stats.errors.push(`Warnung: Secret für ${name} nicht Base32-konform`);
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

exports.generateOTPManagerCode = async (req, res, next) => {
    try {
        const token = await Token.findById(req.params.id);

        if (!token) {
            return res.status(404).json({message: 'Token nicht gefunden'});
        }

        // Sicherstellen, dass der Token dem angemeldeten Benutzer gehört
        if (token.user.toString() !== req.user.id) {
            return res.status(403).json({message: 'Nicht berechtigt, auf diesen Token zuzugreifen'});
        }

        // Analyse und Normalisierung des Secret-Formats
        let secret = token.secret.replace(/\s+/g, '').toUpperCase();

        // Speziell für OTPManager Secret: 0->O, 1->I, 8->B, 9->C
        secret = secret
            .replace(/0/g, 'O')
            .replace(/1/g, 'I')
            .replace(/8/g, 'B')
            .replace(/9/g, 'C');

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

        // Base32-Dekodierung manuell durchführen
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = '';

        // Jedes Zeichen des Secrets in 5 Bits umwandeln
        for (let i = 0; i < secret.length; i++) {
            const index = base32Chars.indexOf(secret[i]);
            if (index !== -1) {
                bits += index.toString(2).padStart(5, '0');
            }
        }

        // Bits in Bytes umwandeln
        const bytes = [];
        for (let i = 0; i < bits.length; i += 8) {
            if (i + 8 <= bits.length) {
                bytes.push(parseInt(bits.substring(i, i + 8), 2));
            }
        }

        // Secret-Key als Buffer
        const secretKey = Buffer.from(bytes);

        // HMAC-SHA1 berechnen
        const hmac = crypto.createHmac('sha1', secretKey);
        hmac.update(counter);
        const digest = hmac.digest();

        // Offset berechnen (RFC 4226)
        const offset = digest[digest.length - 1] & 0x0f;

        // Binary-Wert extrahieren
        const binary = ((digest[offset] & 0x7f) << 24) |
            ((digest[offset + 1] & 0xff) << 16) |
            ((digest[offset + 2] & 0xff) << 8) |
            (digest[offset + 3] & 0xff);

        // Code berechnen (letzte n Stellen)
        const code = (binary % Math.pow(10, token.digits)).toString().padStart(token.digits, '0');

        // Verbleibende Zeit berechnen
        const remainingTime = token.period - (now % token.period);

        // Erfolgreiche Antwort
        return res.status(200).json({
            success: true,
            data: {
                code: code,
                remainingTime: remainingTime
            }
        });
    } catch (err) {
        console.error('OTPManager-Fehler:', err);

        // Fallback zur einfachen Code-Generierung
        try {
            const now = Math.floor(Date.now() / 1000);
            const step = Math.floor(now / token.period);

            // Sehr einfacher Code-Generierungsalgorithmus für Notfall-Fallback
            const code = (step % Math.pow(10, token.digits)).toString().padStart(token.digits, '0');
            const remainingTime = token.period - (now % token.period);

            return res.status(200).json({
                success: true,
                data: {
                    code: code,
                    remainingTime: remainingTime,
                    message: "Fallback-Methode aktiviert (Code möglicherweise nicht korrekt)"
                }
            });
        } catch (fallbackError) {
            next(err);
        }
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

exports.debugTOTP = async (req, res, next) => {
    try {
        const token = await Token.findById(req.params.id);
        if (!token) return res.status(404).json({message: 'Token nicht gefunden'});
        if (token.user.toString() !== req.user.id) return res.status(403).json({message: 'Nicht berechtigt'});

        // Originales Secret aus der Datenbank
        const originalSecret = token.secret;

        // Aktueller Zeitstempel und Counter
        const now = Math.floor(Date.now() / 1000);
        const step = Math.floor(now / token.period);
        const counter = Buffer.alloc(8);
        for (let i = 0; i < 8; i++) {
            counter[7 - i] = (step >>> (i * 8)) & 0xff;
        }

        // Alle möglichen Secret-Interpretationen
        const secretVariants = [];

        // 1. Original Secret
        secretVariants.push({
            name: "Original",
            secret: originalSecret
        });

        // 2. Normalisiert (Leerzeichen entfernt, Großbuchstaben)
        const normalized = originalSecret.replace(/\s+/g, '').toUpperCase();
        secretVariants.push({
            name: "Normalisiert",
            secret: normalized
        });

        // 3. OTPManager-Ersetzungen (0->O, 1->I, 8->B, 9->C)
        const otpManagerFixed = normalized
            .replace(/0/g, 'O')
            .replace(/1/g, 'I')
            .replace(/8/g, 'B')
            .replace(/9/g, 'C');
        secretVariants.push({
            name: "OTPManager-Format",
            secret: otpManagerFixed
        });

        // 4. Aegis/Raivo Format (könnte Base32-Padding haben)
        let aegisFormat = normalized;
        while (aegisFormat.length % 8 !== 0) {
            aegisFormat += '=';
        }
        secretVariants.push({
            name: "Aegis/Raivo-Format",
            secret: aegisFormat
        });

        // 5. ASCII-kodiertes Secret (UTF-8 ohne Base32)
        secretVariants.push({
            name: "ASCII",
            secret: normalized
        });

        // Für jede Secret-Variante alle möglichen Kodierungen ausprobieren
        const results = [];

        const crypto = require('crypto');
        const encodings = ['ascii', 'utf8', 'base32', 'hex', 'binary'];

        for (const variant of secretVariants) {
            const variantResults = [];

            for (const encoding of encodings) {
                try {
                    // Secret in Buffer konvertieren mit verschiedenen Kodierungen
                    let secretBuffer;

                    if (encoding === 'base32') {
                        // Manuelle Base32-Dekodierung, da Node.js kein natives base32 hat
                        // (Hier verwenden wir die base32-Bibliothek oder eine eigene Impl.)
                        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
                        let bits = '';

                        // Jedes Zeichen in 5 Bits umwandeln
                        for (let i = 0; i < variant.secret.length; i++) {
                            if (variant.secret[i] === '=') continue; // Padding ignorieren
                            const val = base32Chars.indexOf(variant.secret[i]);
                            if (val >= 0) {
                                bits += val.toString(2).padStart(5, '0');
                            }
                        }

                        // Bits in Bytes umwandeln
                        const bytes = [];
                        for (let i = 0; i < bits.length; i += 8) {
                            if (i + 8 <= bits.length) {
                                bytes.push(parseInt(bits.substr(i, 8), 2));
                            }
                        }

                        secretBuffer = Buffer.from(bytes);
                    } else {
                        // Standardkodierungen
                        secretBuffer = Buffer.from(variant.secret, encoding);
                    }

                    // HMAC berechnen
                    const hmac = crypto.createHmac('sha1', secretBuffer);
                    hmac.update(counter);
                    const digest = hmac.digest();

                    // TOTP-Code nach RFC 6238 berechnen
                    const offset = digest[digest.length - 1] & 0x0f;
                    const binary = ((digest[offset] & 0x7f) << 24) |
                        ((digest[offset + 1] & 0xff) << 16) |
                        ((digest[offset + 2] & 0xff) << 8) |
                        (digest[offset + 3] & 0xff);

                    const code = (binary % Math.pow(10, token.digits)).toString().padStart(token.digits, '0');

                    variantResults.push({
                        encoding: encoding,
                        code: code,
                        bufferLength: secretBuffer.length,
                        bufferStart: secretBuffer.toString('hex').substring(0, 10) + '...',
                    });
                } catch (e) {
                    variantResults.push({
                        encoding: encoding,
                        error: e.message
                    });
                }
            }

            results.push({
                variant: variant.name,
                secret: variant.secret,
                results: variantResults
            });
        }

        // Verbleibende Zeit
        const remainingTime = token.period - (now % token.period);

        // Auch die Ergebnisse der Standardbibliotheken hinzufügen
        const standardResults = [];
        try {
            const authenticator = require('otplib').authenticator;
            authenticator.options = {digits: token.digits, period: token.period};
            standardResults.push({
                library: 'otplib.authenticator',
                code: authenticator.generate(originalSecret)
            });
        } catch (e) {
            standardResults.push({
                library: 'otplib.authenticator',
                error: e.message
            });
        }

        try {
            const totp = require('otplib').totp;
            totp.options = {digits: token.digits, period: token.period, algorithm: 'sha1'};
            standardResults.push({
                library: 'otplib.totp',
                code: totp.generate(originalSecret)
            });
        } catch (e) {
            standardResults.push({
                library: 'otplib.totp',
                error: e.message
            });
        }

        // Token-Informationen und alle Ergebnisse zurückgeben
        return res.status(200).json({
            success: true,
            tokenInfo: {
                name: token.name,
                issuer: token.issuer,
                algorithm: token.algorithm,
                digits: token.digits,
                period: token.period,
                type: token.type
            },
            timing: {
                now: now,
                step: step,
                remainingTime: remainingTime
            },
            standardLibraries: standardResults,
            variants: results
        });
    } catch (err) {
        console.error('TOTP Debug error:', err);
        next(err);
    }
};

exports.directTOTP = async (req, res, next) => {
    try {
        const token = await Token.findById(req.params.id);
        if (!token) return res.status(404).json({message: 'Token nicht gefunden'});
        if (token.user.toString() !== req.user.id) return res.status(403).json({message: 'Nicht berechtigt'});

        // Secret normalisieren und alle Leerzeichen entfernen
        let secret = token.secret.replace(/\s+/g, '').toUpperCase();

        // Base32-Alphabet und Dekodierung
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

        // Bei Aegis/Authy/anderer App: Das Secret ist bereits Base32-kodiert
        // Keine Ersetzungen notwendig - nur Base32-Validierung
        const isValidBase32 = [...secret].every(char => base32Chars.includes(char) || char === '=');

        if (!isValidBase32) {
            // Bei nicht gültigem Base32: OTPManager-Ersetzungen durchführen
            secret = secret
                .replace(/0/g, 'O')
                .replace(/1/g, 'I')
                .replace(/8/g, 'B')
                .replace(/9/g, 'C');
        }

        // Padding hinzufügen, wenn nötig
        while (secret.length % 8 !== 0) {
            secret += '=';
        }

        // Base32 zu Binär dekodieren
        let bits = '';
        for (let i = 0; i < secret.length; i++) {
            const char = secret[i];
            if (char === '=') continue; // Padding überspringen

            const index = base32Chars.indexOf(char);
            if (index === -1) {
                throw new Error(`Ungültiger Base32-Charakter: ${char}`);
            }

            // 5 Bits für jeden Base32-Charakter
            bits += index.toString(2).padStart(5, '0');
        }

        // Bits zu Bytes konvertieren
        const bytes = [];
        for (let i = 0; i < bits.length; i += 8) {
            if (i + 8 <= bits.length) {
                bytes.push(parseInt(bits.substring(i, i + 8), 2));
            }
        }

        // Secret-Key als Buffer
        const secretKey = Buffer.from(bytes);

        // Aktuellen Zeitstempel berechnen
        const now = Math.floor(Date.now() / 1000);
        const counter = Math.floor(now / token.period);

        // Counter als Buffer (8 Bytes, big-endian)
        const counterBuffer = Buffer.alloc(8);
        for (let i = 0; i < 8; i++) {
            counterBuffer[7 - i] = (counter >>> (i * 8)) & 0xff;
        }

        // HMAC-SHA1 berechnen
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha1', secretKey);
        hmac.update(counterBuffer);
        const hmacResult = hmac.digest();

        // Dynamic truncation (RFC 4226)
        const offset = hmacResult[hmacResult.length - 1] & 0x0f;
        const binary = ((hmacResult[offset] & 0x7f) << 24) |
            ((hmacResult[offset + 1] & 0xff) << 16) |
            ((hmacResult[offset + 2] & 0xff) << 8) |
            (hmacResult[offset + 3] & 0xff);

        // Letzten n Ziffern extrahieren
        const otp = binary % Math.pow(10, token.digits);

        // Mit führenden Nullen formatieren
        const code = otp.toString().padStart(token.digits, '0');

        // Verbleibende Zeit berechnen
        const remainingTime = token.period - (now % token.period);

        // Ergebnis zurückgeben
        return res.status(200).json({
            success: true,
            data: {
                code,
                remainingTime,
                secretInfo: {
                    originalLength: token.secret.length,
                    normalizedLength: secret.length,
                    base32Valid: isValidBase32,
                    // Zeige nur Anfang und Ende des Secrets zur Überprüfung
                    originalStart: token.secret.substring(0, 3),
                    originalEnd: token.secret.substring(token.secret.length - 3),
                    normalizedStart: secret.substring(0, 3),
                    normalizedEnd: secret.substring(secret.length - 3)
                }
            }
        });
    } catch (err) {
        console.error('Direkte TOTP-Generierung fehlgeschlagen:', err);
        next(err);
    }
};