# MPSec 2FA Token Manager

MPSec ist eine sichere Anwendung zur Verwaltung von Two-Factor-Authentication (2FA) Tokens. Die Anwendung ermöglicht es dir, deine 2FA-Tokens sicher zu speichern und zu verwalten.

## Features

- Benutzerauthentifizierung mit Benutzername und Passwort
- Sichere Speicherung von 2FA-Tokens
- Unterstützung für TOTP (zeitbasierte Einmalkennwörter)
- Moderne, benutzerfreundliche Oberfläche mit Dark Mode
- Echtzeit-Generierung von Authentifizierungscodes
- QR-Code-Unterstützung für einfache Migration
- Sichere Verschlüsselung aller sensiblen Daten

## Technologie-Stack

### Frontend
- React.js
- React Router für Navigation
- Styled Components für das Styling
- Axios für API-Anfragen
- JWT für die Authentifizierung

### Backend
- Node.js mit Express
- MongoDB für die Datenspeicherung
- Mongoose als ODM
- bcryptjs für Passwort-Hashing
- jsonwebtoken für JWT-Generierung
- otplib für TOTP-Implementierung
- Crypto für Verschlüsselung der Token-Secrets

## Voraussetzungen

- Node.js (v14 oder höher)
- MongoDB (v4.4 oder höher)
- npm oder yarn

## Installation

### Lokale Entwicklung

1. Repository klonen
   ```bash
   git clone https://github.com/deinbenutzername/mpsec.git
   cd mpsec
   ```

2. Backend-Abhängigkeiten installieren
   ```bash
   cd server
   npm install
   ```

3. Frontend-Abhängigkeiten installieren
   ```bash
   cd ../client
   npm install
   ```

4. MongoDB einrichten
   - Stelle sicher, dass MongoDB läuft
   - Erstelle eine Datenbank mit dem Namen "mpsec"

5. Umgebungsvariablen konfigurieren
   - Kopiere die Datei `.env.example` zu `.env` im `server`-Verzeichnis
   - Passe die Umgebungsvariablen an deine Bedürfnisse an

6. Backend starten
   ```bash
   cd ../server
   npm run dev
   ```

7. Frontend starten
   ```bash
   cd ../client
   npm start
   ```

8. Öffne http://localhost:5011 in deinem Browser

### Produktion

1. Frontend bauen
   ```bash
   cd client
   npm run build
   ```

2. App auf VPS deployen
   ```bash
   ./deploy.sh BENUTZER SERVER_IP PORT ZIELVERZEICHNIS
   ```

## Sicherheitsmaßnahmen

- Alle Passwörter werden mit bcrypt gehasht und gesalzen
- Token-Secrets werden mit AES-256-CBC verschlüsselt in der Datenbank gespeichert
- JWT für sichere Authentifizierung mit begrenzter Gültigkeitsdauer
- Alle API-Routen sind mit Authentifizierung geschützt
- CORS-Schutz für die API-Endpunkte
- XSS- und CSRF-Schutzmaßnahmen

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## Hinweis zur Sicherheit

Diese Anwendung speichert sensible 2FA-Tokens. Stelle sicher, dass:
- Dein Server sicher konfiguriert ist
- HTTPS für die Produktionsumgebung aktiviert ist
- Die MongoDB-Instanz nicht öffentlich zugänglich ist
- Alle Sicherheitsupdates regelmäßig installiert werden
- Starke Passwörter für die Benutzerkonten verwendet werden
