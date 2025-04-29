# CryptoVault

CryptoVault ist eine moderne Web-Anwendung zur sicheren Verschlüsselung und Entschlüsselung von
Daten mit verschiedenen kryptografischen Algorithmen. Die App bietet eine intuitive
Benutzeroberfläche und unterstützt sowohl Text- als auch Dateiverschlüsselung.

## Features

- **AES-Verschlüsselung** (Advanced Encryption Standard)
    - Symmetrische Verschlüsselung mit 128, 192 und 256 Bit Schlüssellänge
    - Sicherer GCM-Modus mit Initialization Vector (IV)
    - Base64-Ausgabeformat für einfache Übertragung

- **RSA-Verschlüsselung** (Rivest-Shamir-Adleman)
    - Asymmetrische Verschlüsselung mit öffentlichem/privatem Schlüssel
    - Unterstützung für Schlüssellängen von 1024, 2048 und 4096 Bit
    - Passwortgeschützte private Schlüssel
    - Export und Import von Schlüsseln im PEM-Format

- **Caesar-Chiffre**
    - Klassische Verschiebungsverschlüsselung
    - Einstellbare Verschiebung (1-25)
    - Brute-Force-Funktion zur Anzeige aller möglichen Entschlüsselungen

- **Dateiverschlüsselung**
    - Verschlüsselung beliebiger Dateien mit AES-GCM
    - Drag & Drop-Unterstützung
    - Direkte Download-Möglichkeit

- **Schlüsselverwaltung**
    - Sichere Speicherung von Schlüsseln im Browser (localStorage)
    - Export und Import von Schlüsselsätzen im JSON-Format
    - Optional verschlüsselte Export-Dateien

- **Benutzerfreundlichkeit**
    - Modernes UI mit Dark Mode
    - Responsive Design für Desktop und Mobile
    - Detaillierte Informationen und Erklärungen zu den Verschlüsselungsmethoden

## Installation

### Voraussetzungen

- Node.js (v14 oder höher)
- npm (v6 oder höher)

### Einrichtung

1. Repository klonen:

```bash
git clone https://github.com/username/crypto-vault.git
cd crypto-vault
```

2. Abhängigkeiten installieren:

```bash
npm install
```

3. Entwicklungsserver starten:

```bash
npm start
```

Die Anwendung ist jetzt unter [http://localhost:3000](http://localhost:3000) verfügbar.

### Produktions-Build erstellen

```bash
npm run build
```

Die optimierten Dateien werden im `build`-Verzeichnis abgelegt und können auf einem beliebigen
Webserver gehostet werden.

## Verwendung

### AES-Verschlüsselung

1. Wähle den "AES"-Algorithmus in der Seitenleiste
2. Gib den zu verschlüsselnden Text ein
3. Generiere einen zufälligen Schlüssel oder gib einen eigenen ein
4. Klicke auf "Verschlüsseln"
5. Der verschlüsselte Text wird im Base64-Format angezeigt
6. Optional: Speichere den Schlüssel für spätere Verwendung

### RSA-Verschlüsselung

1. Wähle den "RSA"-Algorithmus in der Seitenleiste
2. Generiere ein neues Schlüsselpaar oder lade ein bestehendes
3. Gib den zu verschlüsselnden Text ein
4. Wähle "Verschlüsseln" oder "Entschlüsseln"
5. Optional: Exportiere den öffentlichen Schlüssel zur Weitergabe

### Dateiverschlüsselung

1. Wähle "Dateien" in der Seitenleiste
2. Ziehe Dateien in den Drag & Drop-Bereich oder wähle sie über den Dialog
3. Generiere einen Schlüssel oder verwende einen vorhandenen
4. Klicke auf "Verschlüsseln"
5. Lade die verschlüsselten Dateien herunter

### Schlüsselverwaltung

- Speichere Schlüssel mit einem Namen für spätere Verwendung
- Exportiere alle Schlüssel zur Sicherung
- Importiere vorher exportierte Schlüssel

## Sicherheitshinweise

- CryptoVault verwendet die Web Crypto API für kryptografische Operationen
- Alle Verschlüsselungen finden lokal im Browser statt - Daten werden nicht an Server übertragen
- Private Schlüssel und Passwörter werden niemals über das Internet gesendet
- Verlust von Schlüsseln bedeutet, dass die verschlüsselten Daten nicht wiederhergestellt werden
  können
- Die Caesar-Verschlüsselung ist nur zu Demonstrationszwecken enthalten und nicht für sensible Daten
  geeignet

## Technologien

- [React](https://reactjs.org/) für die Benutzeroberfläche
- [Tailwind CSS](https://tailwindcss.com/) für das Styling
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) für
  kryptografische Operationen
- [Lucide React](https://lucide.dev/) für Icons

## Entwicklung

### Projektstruktur

```
crypto-vault/
├── public/           # Statische Dateien
├── src/              # Quellcode
│   ├── crypto/       # Verschlüsselungs-Komponenten
│   │   ├── AES.js    # AES-Implementierung
│   │   ├── RSA.js    # RSA-Implementierung
│   │   ├── Caesar.js # Caesar-Chiffre
│   │   └── FileEncryption.js # Dateiverschlüsselung
│   ├── CryptoVault.js # Hauptkomponente
│   ├── index.js      # App-Einstiegspunkt
│   └── index.css     # Globale Styles
├── package.json      # Abhängigkeiten
└── tailwind.config.js # Tailwind-Konfiguration
```

### Skripts

- `npm start`: Startet den Entwicklungsserver
- `npm test`: Führt Tests aus
- `npm run build`: Erstellt einen Produktions-Build
- `npm run eject`: Ejected die Konfiguration (nicht empfohlen)

## Entwickler & Lizenz

Entwickelt von **Martin Pfeffer**

Lizenziert unter der [MIT-Lizenz](LICENSE)

```
MIT License

Copyright (c) 2025 Martin Pfeffer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Mitwirken

Beiträge sind willkommen! Wenn Du helfen möchtest:

1. Forke das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/amazing-feature`)
3. Committe Deine Änderungen (`git commit -m 'Add some amazing feature'`)
4. Pushe zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

## Sicherheitslücken

Falls Du eine Sicherheitslücke findest, bitte sende eine E-Mail direkt an den Projektbesitzer,
anstatt ein öffentliches Issue zu erstellen.