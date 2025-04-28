/**
 * TOTP-Test-Skript für Serverseitige Diagnose
 * 
 * Dieses Skript kannst du direkt auf dem Server ausführen, um zu sehen,
 * ob dein Server die richtigen TOTP-Codes generiert.
 * 
 * Verwendung:
 * 1. Speichere diese Datei als server-test.js im Serververzeichnis
 * 2. Führe aus: node server-test.js
 */

// Diese Funktionen sind exakt dieselben, die im verbesserten Controller verwendet werden
function generateTOTP(secret, digits = 6, period = 30) {
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
  const crypto = require('crypto');
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

// Alle bekannten Secrets testen (aus deinen JSON-Dateien)
const testSecrets = [
  // [Beschreibung, Secret]
  ['JetBrains', 'NPNTAOVYVQCHPKDL'],
  ['Google', '5AKLTZBBJIKZSHTWY25KZMF75TXDM4EO'],
  ['GitHub', 'PXF3NXACYVDD3GIA'],
  ['Hostinger', 'L3KIUIIBFNVU57Q6'],
  ['Microsoft', 'YB6DG3RAMRZSKTSW'],
  ['TestSecret', 'JBSWY3DPEHPK3PXP'],
];

// Durchlaufe alle Test-Secrets und generiere Codes
console.log('====== TOTP-TESTTOOL ======');
console.log('Generiere Codes für mehrere Secrets...\n');

testSecrets.forEach(([name, secret]) => {
  console.log(`\n----- ${name} -----`);
  const result = generateTOTP(secret);
  console.log(`\nTOTP-Code für ${name}: ${result.code}`);
  console.log('========================\n');
});

// Spezialtest für bekannte App-Paare
console.log('\n====== SPEZIALTEST FÜR JETBRAINS ======');
console.log('Vergleiche verschiedene Secret-Schreibweisen...\n');

// Teste verschiedene Schreibweisen desselben Secrets
const specialCases = [
  ['Original', 'NPNTAOVYVQCHPKDL'],
  ['Kleinbuchstaben', 'npntaovyvqchpkdl'],
  ['Mit Leerzeichen', 'NPNT AOVY VQCH PKDL'],
  ['Mit Zahlen', 'NPNTAOVYVQCHPKD1'],  // 1 statt L am Ende
  ['Andere Zahlen', 'NPNTAOVYVQCHPKDL8'],  // Mit 8 am Ende
];

specialCases.forEach(([variation, secret]) => {
  console.log(`\n---- ${variation} ----`);
  const result = generateTOTP(secret);
  console.log(`Code: ${result.code}`);
});