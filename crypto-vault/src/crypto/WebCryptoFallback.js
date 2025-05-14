/**
 * WebCryptoFallback.js
 * 
 * Diese Datei implementiert einen Fallback für Krypto-Operationen, die vom 
 * nativen WebCrypto API nicht unterstützt werden. Insbesondere RSA/ECB/PKCS1Padding,
 * welches von der Android-App verwendet wird, aber nicht im Browser verfügbar ist.
 * 
 * Abhängigkeit: Forge Library muss in package.json hinzugefügt werden:
 * npm install --save node-forge
 */

import forge from 'node-forge';

/**
 * Entschlüsselt Daten, die mit RSA/ECB/PKCS1Padding in der Android-App verschlüsselt wurden
 * 
 * @param {string} encryptedBase64 - Der verschlüsselte Text als Base64-String
 * @param {string} privateKeyBase64 - Der private Schlüssel als Base64-String (PKCS8-Format)
 * @returns {string} - Der entschlüsselte Text
 */
export async function decryptAndroidRSA(encryptedBase64, privateKeyBase64) {
    try {
        // Bereinige Base64-Eingaben von Whitespace/Zeilenumbrüchen
        const cleanEncryptedBase64 = encryptedBase64.replace(/[\r\n\t\f\v \s]/g, '');
        const cleanPrivateKeyBase64 = privateKeyBase64.replace(/[\r\n\t\f\v \s]/g, '');
        
        // Base64 in Binär umwandeln
        const encryptedBytes = forge.util.decode64(cleanEncryptedBase64);
        const privateKeyBytes = forge.util.decode64(cleanPrivateKeyBase64);
        
        // Privaten Schlüssel aus PKCS8-Format importieren
        const asn1 = forge.asn1.fromDer(privateKeyBytes);
        const privateKey = forge.pki.privateKeyFromAsn1(asn1);
        
        // Entschlüsseln mit PKCS#1 v1.5 Padding (entspricht RSA/ECB/PKCS1Padding in Java)
        const decrypted = privateKey.decrypt(encryptedBytes, 'RSAES-PKCS1-V1_5');
        
        // Als UTF-8 Text zurückgeben
        return decrypted;
    } catch (error) {
        console.error('Android RSA Decryption error:', error);
        throw new Error(`Fehler bei der Android-RSA-Entschlüsselung: ${error.message}`);
    }
}

/**
 * Verschlüsselt Daten mit RSA/ECB/PKCS1Padding für Kompatibilität mit der Android-App
 * 
 * @param {string} plaintext - Der zu verschlüsselnde Text
 * @param {string} publicKeyBase64 - Der öffentliche Schlüssel als Base64-String (SPKI-Format)
 * @returns {string} - Der verschlüsselte Text als Base64-String
 */
export async function encryptForAndroid(plaintext, publicKeyBase64) {
    try {
        // Bereinige Base64-Eingaben von Whitespace/Zeilenumbrüchen
        const cleanPublicKeyBase64 = publicKeyBase64.replace(/[\r\n\t\f\v \s]/g, '');
        
        // Base64 in Binär umwandeln
        const publicKeyBytes = forge.util.decode64(cleanPublicKeyBase64);
        
        // Öffentlichen Schlüssel aus SPKI-Format importieren
        const asn1 = forge.asn1.fromDer(publicKeyBytes);
        const publicKey = forge.pki.publicKeyFromAsn1(asn1);
        
        // Verschlüsseln mit PKCS#1 v1.5 Padding (entspricht RSA/ECB/PKCS1Padding in Java)
        const encrypted = publicKey.encrypt(plaintext, 'RSAES-PKCS1-V1_5');
        
        // Als Base64 zurückgeben
        return forge.util.encode64(encrypted);
    } catch (error) {
        console.error('Android RSA Encryption error:', error);
        throw new Error(`Fehler bei der Android-RSA-Verschlüsselung: ${error.message}`);
    }
}