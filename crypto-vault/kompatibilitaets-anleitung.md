# Anleitung zur Kompatibilität zwischen Crypto-Vault und Enigma3k1

Diese Anleitung erklärt, wie Sie die Web-App (Crypto-Vault) und die Android-App (Enigma3k1) für den Austausch verschlüsselter Daten verwenden können.

## 1. RSA Verschlüsselung/Entschlüsselung

Die Anwendungen nutzen unterschiedliche RSA-Algorithmen:
- Web-App: RSA-OAEP mit SHA-256
- Android-App: RSA/ECB/PKCS1Padding

Für Kompatibilität wurden in der Android-App neue Methoden implementiert:

### Android → Web (Enigma3k1 → Crypto-Vault)

1. **Verwenden Sie die neue Methode in der Android-App:**
   ```java
   // Verschlüsseln von Daten für die Web-App
   String encryptedText = RsaUtils.encryptWebAppCompatible(plainText, publicKeyBase64);
   ```

2. **Entschlüsseln in der Web-App:** 
   Verwenden Sie die reguläre Entschlüsselungsfunktion, da die App jetzt das korrekte Format produziert.

### Web → Android (Crypto-Vault → Enigma3k1)

1. **Verschlüsseln in der Web-App:**
   Verwenden Sie die reguläre Verschlüsselungsfunktion.

2. **Entschlüsseln in der Android-App:**
   ```java
   // Entschlüsseln von Daten aus der Web-App
   String decryptedText = RsaUtils.decryptWebAppCompatible(encryptedText, privateKeyBase64);
   ```

## 2. AES Verschlüsselung/Entschlüsselung

Die AES Implementierungen unterscheiden sich:
- Web-App: AES-GCM mit 12-Byte IV
- Android-App: AES-GCM mit 16-Byte Salt + 12-Byte IV

### Android → Web (Enigma3k1 → Crypto-Vault)

1. **Verwenden Sie die neue Methode in der Android-App:**
   ```java
   // Verschlüsseln von Daten für die Web-App
   String encryptedText = AesUtils.encryptWebAppCompatible(plainText, password, keySize);
   ```

2. **Entschlüsseln in der Web-App:**
   Verwenden Sie die reguläre Entschlüsselungsfunktion.

### Web → Android (Crypto-Vault → Enigma3k1)

1. **Verschlüsseln in der Web-App:**
   Verwenden Sie die reguläre Verschlüsselungsfunktion.

2. **Entschlüsseln in der Android-App:**
   ```java
   // Entschlüsseln von Daten aus der Web-App
   String decryptedText = AesUtils.decryptWebAppCompatible(encryptedText, password, keySize);
   ```

## 3. Schlüsselaustausch

### Öffentliche RSA-Schlüssel

1. **Android → Web:**
   - Exportieren Sie den Public Key in der Android-App
   - Kopieren Sie ihn in die Zwischenablage
   - Fügen Sie ihn in der Web-App unter "Mit fremdem öffentlichen Schlüssel verschlüsseln" ein

2. **Web → Android:**
   - Kopieren Sie den Public Key in der Web-App mit der "Public Key kopieren"-Funktion
   - Fügen Sie ihn in der Android-App ein

### AES-Schlüssel

1. **Android → Web:**
   - Exportieren Sie den AES-Schlüssel in der Android-App
   - Kopieren Sie ihn in die Zwischenablage
   - Fügen Sie ihn in der Web-App unter "Fremden Schlüssel importieren" ein

2. **Web → Android:**
   - Kopieren Sie den AES-Schlüssel in der Web-App mit der Kopier-Funktion
   - Fügen Sie ihn in der Android-App ein

## 4. Wichtige Hinweise

1. **Base64-Kodierung:** Android fügt standardmäßig Zeilenumbrüche ein, diese werden automatisch entfernt.

2. **Schlüsselgrößen:** Verwenden Sie konsistente Schlüsselgrößen:
   - RSA: 2048 Bit ist ein guter Kompromiss zwischen Sicherheit und Geschwindigkeit
   - AES: 256 Bit wird empfohlen

3. **Längenbeschränkungen:** RSA kann nur begrenzte Mengen an Daten verschlüsseln:
   - Bei 2048-Bit Schlüsseln maximal ca. 245 Bytes
   - Für größere Datenmengen nutzen Sie AES