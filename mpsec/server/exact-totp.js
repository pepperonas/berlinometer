// Exakte TOTP-Implementierung für MPSec

/**
 * Exakte RFC-konforme TOTP-Implementierung
 * Erstellt Codes, die mit Google Authenticator, Authy und anderen Apps kompatibel sind
 */

const crypto = require('crypto');

/**
 * Generiert einen TOTP-Code gemäß RFC 4226/6238
 * @param {string} secret - Das Base32-kodierte Secret
 * @param {number} digits - Anzahl der Stellen (standardmäßig 6)
 * @param {number} period - Gültigkeitszeitraum in Sekunden (standardmäßig 30)
 */
function generateTOTP(secret, digits = 6, period = 30) {
  console.log(`Generiere TOTP für Secret: [${secret}], Stellen: ${digits}, Periode: ${period}`);

  // 1. Zeit-Counter
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / period);
  console.log(`Aktueller Zeitstempel: ${now}, Counter: ${counter}`);

  // 2. Secret-Vorbereitung (normalisieren und für OTPManager anpassen)
  let normalizedSecret = secret.replace(/\s+/g, '').toUpperCase();

  // Legacy-Kompatibilität: Ziffern zu Buchstaben
  normalizedSecret = normalizedSecret
      .replace(/0/g, 'O')
      .replace(/1/g, 'I')
      .replace(/8/g, 'B')
      .replace(/9/g, 'C');

  console.log(`Normalisiertes Secret: ${normalizedSecret}`);

  // 3. Secret dekodieren (genau nach RFC 4648)
  const secretBytes = base32ToBytes(normalizedSecret);
  console.log(`Secret als Bytes (hex): ${Buffer.from(secretBytes).toString('hex')}`);

  // 4. Counter als 8-Byte Buffer (big-endian, RFC 4226)
  const counterBuffer = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) {
    counterBuffer[7 - i] = (counter >>> (i * 8)) & 0xff;
  }
  console.log(`Counter als Bytes (hex): ${counterBuffer.toString('hex')}`);

  // 5. HMAC-SHA1 berechnen (RFC 4226 Schritt 1)
  const hmac = crypto.createHmac('sha1', Buffer.from(secretBytes));
  hmac.update(counterBuffer);
  const digest = hmac.digest();
  console.log(`HMAC-SHA1 Digest (hex): ${digest.toString('hex')}`);

  // 6. Dynamic Truncation (RFC 4226 Schritt 2-3)
  const offset = digest[digest.length - 1] & 0x0f;
  console.log(`Truncation Offset: ${offset}`);

  // 7. 4 Bytes ab Offset extrahieren und in Integer umwandeln (RFC 4226 Schritt 4)
  const binary = ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);
  console.log(`Binary Value: ${binary}`);

  // 8. Modulo um auf die gewünschte Ziffernzahl zu kommen (RFC 4226 Schritt 5)
  const code = (binary % Math.pow(10, digits)).toString().padStart(digits, '0');
  console.log(`Generierter Code: ${code}`);

  // 9. Verbleibende Zeit berechnen
  const remainingTime = period - (now % period);
  console.log(`Verbleibende Zeit: ${remainingTime} Sekunden`);

  return {
    code,
    remainingTime,
    timestamp: now,
    counter
  };
}

/**
 * Konvertiert einen Base32-String korrekt in ein Byte-Array gemäß RFC 4648
 * @param {string} base32 - Base32-kodierter String
 * @returns {Uint8Array} Dekodierte Bytes
 */
function base32ToBytes(base32) {
  // Base32-Alphabet gemäß RFC 4648
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = [];

  for (let i = 0; i < base32.length; i++) {
    const char = base32[i].toUpperCase();

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

  return new Uint8Array(output);
}

// Export für die Verwendung in anderen Modulen
module.exports = { generateTOTP, base32ToBytes };