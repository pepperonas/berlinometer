// Zeitkorrigierter TOTP-Generator für MPSec
// Berücksichtigt die Zeitdifferenz zwischen Authenticator und Server
const crypto = require('crypto');

// =============== KONFIGURATION ================
// Zeitoffset: -3480 Sekunden (58 Minuten)
// Ändere diesen Wert, falls nötig
const TIME_OFFSET = -3480;

// =============== HILFSFUNKTIONEN ================

// Base32 Alphabet (RFC 4648)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Base32-String zu Bytes dekodieren
 * @param {string} base32String - Base32-kodiertes Secret
 * @returns {Buffer} Dekodierte Bytes
 */
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

/**
 * TOTP-Code generieren mit zeitkorrigiertem Timestamp
 * @param {string} secret - Base32-kodiertes Secret
 * @param {number} digits - Anzahl der Stellen (default: 6)
 * @param {number} period - Gültigkeitszeitraum in Sekunden (default: 30)
 * @param {number} timeOffset - Zeitunterschied in Sekunden (default: -3480)
 * @returns {object} TOTP-Ergebnis mit Code und verbleibender Zeit
 */
function generateTOTP(secret, digits = 6, period = 30, timeOffset = TIME_OFFSET) {
    // Aktuelle Zeit in Sekunden mit Zeitkorrektur
    const now = Math.floor(Date.now() / 1000) + timeOffset;

    // TOTP mit korrigiertem Zeitstempel generieren
    const code = generateTOTPWithTime(secret, now, digits, period);

    // Verbleibende Zeit berechnen
    const remainingTime = period - (now % period);

    return {
        code,
        remainingTime,
        correctedTime: now,
        actualTime: Math.floor(Date.now() / 1000),
        timeOffset,
        formattedTime: new Date(now * 1000).toISOString()
    };
}

/**
 * TOTP-Code für einen spezifischen Zeitstempel generieren
 * @param {string} secret - Base32-kodiertes Secret
 * @param {number} timestamp - Unix-Zeitstempel in Sekunden
 * @param {number} digits - Anzahl der Stellen (default: 6)
 * @param {number} period - Gültigkeitszeitraum in Sekunden (default: 30)
 * @returns {string} Generierter TOTP-Code
 */
function generateTOTPWithTime(secret, timestamp, digits = 6, period = 30) {
    try {
        // 1. Timestamp zu Counter konvertieren
        const counter = Math.floor(timestamp / period);

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

        return paddedCode;
    } catch (error) {
        console.error('TOTP-Generierungsfehler:', error);
        throw error;
    }
}

/**
 * Erweiterte TOTP-Codes generieren mit Zeitoffsets
 * @param {string} secret - Base32-kodiertes Secret
 * @param {number} digits - Anzahl der Stellen (default: 6)
 * @param {number} period - Gültigkeitszeitraum in Sekunden (default: 30)
 * @param {number} pastWindows - Anzahl der vergangenen Zeitfenster (default: 10)
 * @param {number} futureWindows - Anzahl der zukünftigen Zeitfenster (default: 10)
 * @param {number} timeOffset - Zeitunterschied in Sekunden (default: -3480)
 * @returns {object} TOTP-Codes für verschiedene Zeitfenster
 */
function generateExtendedTOTP(secret, digits = 6, period = 30, pastWindows = 10, futureWindows = 10, timeOffset = TIME_OFFSET) {
    // Aktuelle Zeit in Sekunden mit Zeitkorrektur
    const now = Math.floor(Date.now() / 1000) + timeOffset;

    // Aktuellen Code und verbleibende Zeit berechnen
    const currentCode = generateTOTPWithTime(secret, now, digits, period);
    const remainingTime = period - (now % period);

    // Array für vergangene Codes
    const pastCodes = [];
    for (let i = 1; i <= pastWindows; i++) {
        const pastTime = now - (i * period);
        const code = generateTOTPWithTime(secret, pastTime, digits, period);
        pastCodes.push({
            code,
            offset: -i * period,
            timestamp: pastTime,
            formattedTime: new Date(pastTime * 1000).toISOString()
        });
    }

    // Array für zukünftige Codes
    const futureCodes = [];
    for (let i = 1; i <= futureWindows; i++) {
        const futureTime = now + (i * period);
        const code = generateTOTPWithTime(secret, futureTime, digits, period);
        futureCodes.push({
            code,
            offset: i * period,
            timestamp: futureTime,
            formattedTime: new Date(futureTime * 1000).toISOString()
        });
    }

    // Ergebnis zurückgeben
    return {
        current: {
            code: currentCode,
            remainingTime,
            timestamp: now,
            formattedTime: new Date(now * 1000).toISOString(),
            actualTime: Math.floor(Date.now() / 1000),
            timeOffset
        },
        past: pastCodes,
        future: futureCodes
    };
}

/**
 * Finden der besten Zeitkorrektur für einen bekannten Code
 * @param {string} secret - Base32-kodiertes Secret
 * @param {string} knownCode - Bekannter TOTP-Code
 * @param {number} digits - Anzahl der Stellen (default: 6)
 * @param {number} period - Gültigkeitszeitraum in Sekunden (default: 30)
 * @param {number} searchRange - Suchbereich in Stunden (default: 24)
 * @returns {object} Gefundener Zeitoffset, wenn der Code übereinstimmt
 */
function findTimeOffset(secret, knownCode, digits = 6, period = 30, searchRange = 24) {
    const now = Math.floor(Date.now() / 1000);
    const searchSeconds = searchRange * 3600; // Stunden in Sekunden

    // Suche in beiden Richtungen
    for (let offset = -searchSeconds; offset <= searchSeconds; offset += period) {
        const testTime = now + offset;
        const code = generateTOTPWithTime(secret, testTime, digits, period);

        if (code === knownCode) {
            return {
                timeOffset: offset,
                currentServerTime: now,
                adjustedTime: testTime,
                formattedTime: new Date(testTime * 1000).toISOString(),
                code
            };
        }
    }

    return {found: false, message: 'Kein passender Zeitoffset gefunden'};
}

// =============== TEST ================

// Direkt ausführen, wenn die Datei direkt gestartet wird
if (require.main === module) {
    const testSecret = "NPNTAOVYVQCHPKDL";

    console.log('=== ZEITKORRIGIERTER TOTP-GENERATOR ===');
    console.log(`Secret: ${testSecret}`);
    console.log(`Zeitoffset: ${TIME_OFFSET} Sekunden (${TIME_OFFSET / 60} Minuten)`);

    // Aktuellen Code generieren
    const result = generateTOTP(testSecret);
    console.log('\nAKTUELLER CODE:');
    console.log(`Code: ${result.code}`);
    console.log(`Verbleibende Zeit: ${result.remainingTime} Sekunden`);
    console.log(`Korrigierte Zeit: ${result.formattedTime}`);
    console.log(`Tatsächliche Serverzeit: ${new Date(result.actualTime * 1000).toISOString()}`);

    // Erweiterte Codes
    const extended = generateExtendedTOTP(testSecret);

    console.log('\nVERGANGENE CODES:');
    extended.past.forEach(item => {
        console.log(`${item.offset}s: ${item.code} (${item.formattedTime})`);
    });

    console.log('\nZUKÜNFTIGE CODES:');
    extended.future.forEach(item => {
        console.log(`+${item.offset}s: ${item.code} (${item.formattedTime})`);
    });

    // Zeit-Offset-Suche mit bekanntem Code
    console.log('\nZEITOFFSET-SUCHE:');
    const knownCode = "181142";
    const offsetSearch = findTimeOffset(testSecret, knownCode);
    console.log(`Ergebnis für Code ${knownCode}:`);
    console.log(offsetSearch);
}

// Exportiere die Funktionen
module.exports = {
    generateTOTP,
    generateTOTPWithTime,
    generateExtendedTOTP,
    findTimeOffset,
    base32ToBytes
};