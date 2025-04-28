// Pure TOTP-Implementierung ohne externe Bibliotheken
// Basierend auf RFC 6238/4226 Standards
const crypto = require('crypto');

// Base32 Alphabet (RFC 4648)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Base32 String zu Bytes dekodieren
function base32ToBytes(base32String) {
    // Leerzeichen entfernen und zu Großbuchstaben konvertieren
    let str = base32String.replace(/\s/g, '').toUpperCase();

    // Ausgabe-Array
    const bytes = [];

    // Buffer für Bits
    let buffer = 0;
    let bufferLen = 0;

    // Jedes Zeichen verarbeiten
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '=') continue; // Padding überspringen

        // Index im Base32-Alphabet finden
        const index = BASE32_ALPHABET.indexOf(char);
        if (index === -1) continue; // Ungültige Zeichen überspringen

        // 5 Bits im Puffer sammeln
        buffer = (buffer << 5) | index;
        bufferLen += 5;

        // 8-Bit-Bytes extrahieren
        while (bufferLen >= 8) {
            bufferLen -= 8;
            bytes.push((buffer >> bufferLen) & 0xff);
        }
    }

    return Buffer.from(bytes);
}

// TOTP-Code generieren
function generateTOTP(secret, digits = 6, period = 30) {
    try {
        // 1. Aktuelle Zeit zu Counter konvertieren
        const counter = Math.floor(Date.now() / 1000 / period);

        // 2. Secret dekodieren
        const secretBytes = base32ToBytes(secret);

        // 3. Counter zu 8-Byte Buffer konvertieren (big-endian)
        const counterBuffer = Buffer.alloc(8);
        for (let i = 0; i < 8; i++) {
            counterBuffer[7 - i] = (counter >> (i * 8)) & 0xff;
        }

        // 4. HMAC-SHA1 berechnen
        const hmac = crypto.createHmac('sha1', secretBytes);
        hmac.update(counterBuffer);
        const hmacResult = hmac.digest();

        // 5. Dynamisches Abschneiden (Dynamic Truncation)
        const offset = hmacResult[hmacResult.length - 1] & 0x0f;

        // 6. 4 Bytes extrahieren und in 31-bit Integer konvertieren
        const binary =
            ((hmacResult[offset] & 0x7f) << 24) |
            ((hmacResult[offset + 1] & 0xff) << 16) |
            ((hmacResult[offset + 2] & 0xff) << 8) |
            (hmacResult[offset + 3] & 0xff);

        // 7. Modulo für die gewünschte Anzahl an Stellen
        const code = binary % Math.pow(10, digits);

        // 8. Mit führenden Nullen auffüllen
        const paddedCode = code.toString().padStart(digits, '0');

        // 9. Verbleibende Zeit berechnen
        const remainingTime = period - (Math.floor(Date.now() / 1000) % period);

        return {
            code: paddedCode,
            remainingTime: remainingTime
        };
    } catch (error) {
        console.error('TOTP-Generierungsfehler:', error);
        throw error;
    }
}

// Exportiere die Funktionen
module.exports = {
    generateTOTP,
    base32ToBytes
};