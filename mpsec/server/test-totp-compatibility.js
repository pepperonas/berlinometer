#!/usr/bin/env node
/**
 * TOTP-Kompatibilitäts-Test
 * Dieses Skript generiert TOTP-Codes mit verschiedenen Methoden
 * und zeigt sie zum Vergleich mit TOTP-Apps an.
 */

// Beide TOTP-Implementierungen testen
const exactTOTP = require('./exact-totp-improved');
const otplib = require('otplib');

// Ausgewählte Test-Secrets
const testSecrets = [
    {name: "Standard-Testsecret", secret: "JBSWY3DPEHPK3PXP"},
    {name: "Mit Leerzeichen", secret: "JBSW Y3DP EHPK 3PXP"},
    {name: "Mit Ziffern", secret: "JB5WY3DPEHPK3PXP"},
    // Dein eigenes Secret hier hinzufügen für direkten Vergleich
    {name: "Mein Secret", secret: "DEIN_SECRET_HIER_EINFÜGEN"}
];

// Aktuelle Zeit anzeigen
console.log("=== TOTP-KOMPATIBILITÄTS-TEST ===");
console.log(`Aktuelle Zeit: ${new Date().toISOString()}`);
console.log(`Unix-Zeitstempel: ${Math.floor(Date.now() / 1000)}`);
console.log(`TOTP-Periode: 30 Sekunden`);
console.log("===============================\n");

// Codes mit beiden Methoden generieren und vergleichen
testSecrets.forEach(test => {
    console.log(`\n>> Test für: ${test.name}`);
    console.log(`Secret: ${test.secret}`);
    console.log("----------------------------------------");

    try {
        // 1. Unsere verbesserte Implementierung
        const ourResult = exactTOTP.generateTOTP(test.secret);

        // 2. otplib-Implementierung (Standard-Bibliothek)
        otplib.authenticator.options = {
            digits: 6,
            period: 30,
            algorithm: 'sha1'
        };

        // Test mit otplib
        let otplibResult;
        try {
            // Für otplib Secret normalisieren
            const normalizedSecret = test.secret.replace(/\s+/g, '');
            otplibResult = otplib.authenticator.generate(normalizedSecret);
        } catch (otplibError) {
            otplibResult = `Fehler: ${otplibError.message}`;
        }

        // Ergebnisse anzeigen
        console.log("\n==> VERGLEICH:");
        console.log(`Unsere Implementierung:  ${ourResult.code}`);
        console.log(`otplib Bibliothek:       ${otplibResult}`);
        console.log(`Gültig für: ${ourResult.remainingTime} Sekunden`);

        if (ourResult.code === otplibResult) {
            console.log("\n✅ ÜBEREINSTIMMUNG: Die Codes stimmen überein!");
        } else {
            console.log("\n❌ FEHLER: Die Codes sind unterschiedlich!");
        }
    } catch (error) {
        console.error(`Fehler bei ${test.name}:`, error);
    }

    console.log("----------------------------------------");
});

console.log("\n\n=== ZUSÄTZLICHE KOMPATIBILITÄTSTESTS ===");
console.log("Der folgende Test zeigt die Auswirkungen verschiedener Normalisierungsstrategien");

const specialCases = [
    {name: "Original", secret: "NPNTAOVYVQCHPKDL"},
    {name: "Kleinbuchstaben", secret: "npntaovyvqchpkdl"},
    {name: "Mit Leerzeichen", secret: "NPNT AOVY VQCH PKDL"},
    {name: "Ohne Padding", secret: "JBSWY3DPEHPK3PXP"},
    {name: "Mit Padding", secret: "JBSWY3DPEHPK3PXP==="},
    {name: "Mit Zahl 0", secret: "JBSWY3DPEHPK0PXP"},
    {name: "Mit Zahl 1", secret: "JBSWY3DPEHPK1PXP"},
    {name: "Mit Zahl 8", secret: "JBSWY3DPEHPK8PXP"},
    {name: "Mit Zahl 9", secret: "JBSWY3DPEHPK9PXP"}
];

// Verschiedene Normalisierungsstrategien testen
specialCases.forEach(test => {
    console.log(`\n>> ${test.name}: ${test.secret}`);

    try {
        const result = exactTOTP.generateTOTP(test.secret);
        console.log(`Code: ${result.code}`);
    } catch (error) {
        console.error(`Fehler:`, error.message);
    }
});

console.log("\n=== TEST ABGESCHLOSSEN ===");
console.log("Vergleiche diese Codes mit deinen Authenticator-Apps");
console.log("Welche Codes stimmen überein?");