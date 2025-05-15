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

### Neue Benutzeroberflächen-Optionen für Kompatibilität

Beide Apps wurden mit neuen Benutzeroberflächen-Elementen ausgestattet:

#### Android-App (Enigma3k1):
- Aktivieren Sie den "Web-App Kompatibilitätsmodus" durch den Schalter in der AES-Verschlüsselungsansicht
- In diesem Modus werden Daten automatisch im kompatiblen Format mit der Web-App verschlüsselt
- Die Entschlüsselung erkennt automatisch beide Formate

#### Web-App (Crypto-Vault):
- Aktivieren Sie die Checkbox "Android-Kompatibilitätsmodus (mit Salt) verwenden" beim Verschlüsseln
- Die Entschlüsselung versucht automatisch, beide Formate zu erkennen

### Android → Web (Enigma3k1 → Crypto-Vault)

1. **Verwenden Sie den Kompatibilitätsmodus in der Android-App:**
   - Aktivieren Sie den Schalter "Web-App Kompatibilitätsmodus" in der AES-Ansicht
   - Verschlüsseln Sie Ihre Daten wie gewohnt

   **ODER** in Ihrem Code:
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
   - Verwenden Sie die reguläre Entschlüsselungsfunktion (die universelle Methode wird automatisch verwendet)
   
   **ODER** in Ihrem Code:
   ```java
   // Entschlüsseln von Daten aus der Web-App (erkennt beide Formate automatisch)
   String decryptedText = AesUtils.decryptUniversal(encryptedText, password, keySize);
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

## 5. Fehlerbehebung

### Häufige Fehler bei AES-Verschlüsselung

1. **"BAD_DECRYPT" oder "Entschlüsselung fehlgeschlagen":**
   - **Ursache:** Format-Inkompatibilität zwischen Android- und Web-App-Verschlüsselung.
   - **Lösung:** 
     - Beim Verschlüsseln in der Android-App: Aktivieren Sie den "Web-App Kompatibilitätsmodus"
     - Beim Verschlüsseln in der Web-App: Aktivieren Sie den "Android-Kompatibilitätsmodus (mit Salt)"
     - Verwenden Sie die universelle Entschlüsselungsfunktion `decryptUniversal()` in der Android-App

2. **"Ungültiger Schlüssel" oder "Falsches Format":**
   - **Ursache:** Schlüssel hat nicht die erwartete Größe oder Format.
   - **Lösung:**
     - Stellen Sie sicher, dass Sie konsistent 256-Bit Schlüssel verwenden (empfohlen)
     - Entfernen Sie Leerzeichen und Zeilenumbrüche aus kopierten Schlüsseln

3. **"Schlüsselgröße nicht unterstützt":**
   - **Ursache:** Die angegebene Schlüsselgröße wird nicht unterstützt.
   - **Lösung:** Verwenden Sie nur die Standardgrößen (128, 192, 256 Bit)
   
Hinweis: Beide Apps versuchen automatisch, die Schlüsselgröße zu erkennen und verschiedene Größen zu probieren.