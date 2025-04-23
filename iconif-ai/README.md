# iconif-ai: KI-gestützter Icon-Generator

Eine Full-Stack-Webanwendung, die KI verwendet, um benutzerdefinierte Icons zu generieren und in verschiedene Formate zu konvertieren.

## Funktionen

- Generierung von Icons basierend auf Textbeschreibungen
- Auswahl von verschiedenen Stilen und Farbschemata
- Konvertierung in gängige Formate (ICO, PNG, SVG, WEBP)
- Erstellung von Favicon-Paketen für Webseiten
- Download aller Formate als ZIP-Archiv

## Technologie-Stack

- **Frontend:** React.js
- **Backend:** Node.js mit Express
- **KI-Integration:** OpenAI API (DALL-E)
- **Bildverarbeitung:** Sharp.js
- **Archivierung:** Archiver

## Installation

### Voraussetzungen
- Node.js v16+ und npm
- OpenAI API-Schlüssel

### Einrichtung

1. Repository klonen
2. Backend-Abhängigkeiten installieren:
   ```
   cd server
   npm install
   ```
3. Frontend-Abhängigkeiten installieren:
   ```
   cd client
   npm install
   ```
4. OpenAI API-Schlüssel in `server/.env` eintragen
5. Backend starten:
   ```
   cd server
   npm start
   ```
6. Frontend starten:
   ```
   cd client
   npm start
   ```
7. Anwendung unter http://localhost:3003 aufrufen

## API-Endpunkte

- `POST /api/generate`: Generiert ein Icon mit der OpenAI API
- `POST /api/process`: Verarbeitet das Icon in verschiedene Formate
- `GET /api/images/:id`: Liefert das generierte Bild
- `GET /api/download/:id`: Liefert das ZIP-Archiv mit allen Formaten

## Lizenz

MIT
