# GlitterHue Electron App

Desktop-Version der GlitterHue Web-App zur Steuerung von Philips Hue-Lampen mit Musik-Visualisierung und Disco-Modus.

## Voraussetzungen

- Node.js (Version 16+)
- npm (Version 8+)
- Eine Philips Hue Bridge im lokalen Netzwerk
- Philips Hue-Lampen (Color-Modelle empfohlen)
- Ein Gerät mit Mikrofon für den Disco-Modus

## Installation und Build

### 1. Installiere die Abhängigkeiten:

```bash
npm install
```

### 2. Baue die App:

```bash
npm run build
```

Dieses Kommando führt das `build-app.sh` Skript aus, das automatisch die React-App baut und in das Electron-Verzeichnis kopiert.

### 3. Starte die Electron-App:

```bash
npm start
```

## Paketierung

Die App kann für verschiedene Plattformen paketiert werden:

- **macOS**: `npm run package-mac`
- **Windows**: `npm run package-win`
- **Linux**: `npm run package-linux`

Die erstellten Pakete werden im Verzeichnis `dist/` abgelegt.

## Entwicklung

Für die Entwicklung kann die App im Dev-Modus gestartet werden:

```bash
npm run dev
```

Dieses Kommando startet die React-App im Entwicklungsmodus und öffnet die Electron-App, sobald der Dev-Server bereit ist.

## Plattformspezifische Hinweise

### macOS

- Für den Zugriff auf das Mikrofon wird eine Berechtigungsabfrage angezeigt
- Empfohlenes Format: DMG

### Windows

- Empfohlenes Format: NSIS Installer

### Linux

- Je nach Distribution können zusätzliche Abhängigkeiten erforderlich sein
- Empfohlenes Format: AppImage

## Lizenz

MIT
