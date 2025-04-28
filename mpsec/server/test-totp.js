#!/usr/bin/env node
/**
 * TOTP-Testskript
 * Erzeugt TOTP-Codes für verschiedene Test-Secrets und gibt Details zum Prozess aus
 */

const crypto = require('crypto');

// Test-Secrets
const SECRETS = [
    {
        name: 'JetBrains',
        secret: 'NPNTAOVYVQCHPKDL'
    },
    {
        name: 'GitHub',
        secret: 'PXF3NXACYVDD3GIA'
    },
    {
        name: 'Test-Secret',
        secret: 'JBSWY3DPEHPK3PXP'
    }
];

// Base32-Dekodierung nach RFC 4648
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

// TOTP-Code generieren
function generateTOTP(secret, digits = 6, period = 30) {
    // 1. Secret optimieren und normalisieren
    const normalizedSecret = secret
        .replace(/\s+/g, '')       // Entferne Leerzeichen
        .toUpperCase()             // Zu Großbuchstaben
        .replace(/0/g, 'O')        // 0 → O
        .replace(/1/g, 'I')        // 1 → I
        .replace(/8/g, 'B')        // 8 → B
        .replace(/9/g, 'C');       // 9 → C

    console.log(`Normalisiertes Secret: ${normalizedSecret}`);

    // 2. Secret zu Bytes dekodieren
    const secretBytes = base32ToBytes(normalizedSecret);
    console.log(`Secret als Bytes (Hex): ${Buffer.from(secretBytes).toString('hex')}`);

    // 3. Aktuelle Zeit holen
    const now = Math.floor(Date.now() / 1000);
    console.log(`Aktuelle Zeit (Unix): ${now}`);

    // 4. Counter berechnen
    const counter = Math.floor(now / period);
    console.log(`TOTP Counter: ${counter} (Zeit / Periode ${period})`);

    // 5. Counter als 8-Byte Buffer
    const counterBuffer = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) {
        counterBuffer[7 - i] = (counter >>> (i * 8)) & 0xff;
    }
    console.log(`Counter als Bytes: ${counterBuffer.toString('hex')}`);

    // 6. HMAC-SHA1 berechnen
    const hmac = crypto.createHmac('sha1', Buffer.from(secretBytes));
    hmac.update(counterBuffer);
    const digest = hmac.digest();
    console.log(`HMAC-SHA1 Digest: ${digest.toString('hex')}`);

    // 7. Dynamic Truncation
    const offset = digest[digest.length - 1] & 0x0f;
    console.log(`Truncation Offset: ${offset}`);

    // 8. Binary Code extrahieren
    const binary = ((digest[offset] & 0x7f) << 24) |
        ((digest[offset + 1] & 0xff) << 16) |
        ((digest[offset + 2] & 0xff) << 8) |
        (digest[offset + 3] & 0xff);
    console.log(`Binary Value: ${binary}`);

    // 9. Modulo für gewünschte Stellenzahl
    const code = (binary % Math.pow(10, digits))
        .toString()
        .padStart(digits, '0');

    // 10. Verbleibende Zeit berechnen
    const remainingTime = period - (now % period);

    return {
        code,
        remainingTime,
        now,
        counter
    };
}

// Hauptausführung
console.log("=== TOTP CODE GENERATOR TEST ===");
console.log(`Aktuelle Serverzeit: ${new Date().toISOString()}`);
console.log("===============================\n");

// Alle Test-Secrets durchlaufen
for (const testCase of SECRETS) {
    console.log(`\n>> Teste: ${testCase.name} (Secret: ${testCase.secret})`);
    console.log("----------------------------------------");

    const result = generateTOTP(testCase.secret);

    console.log("\n==> ERGEBNIS:");
    console.log(`TOTP-Code: ${result.code}`);
    console.log(`Gültig für: ${result.remainingTime} Sekunden`);
    console.log("----------------------------------------");
}

console.log("\n=== TEST ABGESCHLOSSEN ===");
console.log("Vergleiche diese Codes mit deiner Authenticator-App");
console.log("Falls sie übereinstimmen, funktioniert die TOTP-Implementierung korrekt");