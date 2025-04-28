// Kopiere diese Datei nach /var/www/html/mpsec/server/totp-fix.js
const crypto = require('crypto');

// Exportiere die Funktionen für die Verwendung im Controller
module.exports = {
    generateTOTP,
    base32ToBytes
};

/**
 * TOTP-Code generieren (RFC 6238 / Google Authenticator kompatibel)
 */
function generateTOTP(secret, digits = 6, period = 30) {
    // 1. Aktuellen Unix-Zeitstempel holen (Sekunden)
    const now = Math.floor(Date.now() / 1000);

    // 2. Counter berechnen (Zeitstempel / Periode)
    const counter = Math.floor(now / period);

    // 3. Secret normalisieren und vorbereiten
    let cleanSecret = secret.replace(/\s+/g, '').toUpperCase();

    // 4. Counter als 8-Byte Buffer umwandeln (big-endian)
    const counterBuffer = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) {
        counterBuffer[7 - i] = (counter >>> (i * 8)) & 0xff;
    }

    // 5. HMAC-SHA1 berechnen
    const hmac = crypto.createHmac('sha1', base32ToBytes(cleanSecret));
    hmac.update(counterBuffer);
    const digest = hmac.digest();

    // 6. Dynamisches Abschneiden (Dynamic Truncation)
    const offset = digest[digest.length - 1] & 0x0f;

    // 7. 4 Bytes extrahieren und in eine Zahl umwandeln
    const binary = ((digest[offset] & 0x7f) << 24) |
        ((digest[offset + 1] & 0xff) << 16) |
        ((digest[offset + 2] & 0xff) << 8) |
        (digest[offset + 3] & 0xff);

    // 8. Modulo für die gewünschte Anzahl an Stellen
    const code = (binary % Math.pow(10, digits)).toString().padStart(digits, '0');

    // 9. Verbleibende Zeit berechnen
    const remainingTime = period - (now % period);

    return {
        code,
        remainingTime
    };
}

/**
 * Base32-String in Bytes umwandeln
 */
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