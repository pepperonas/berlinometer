# MongoDB-Einrichtung für Bartender-App

Diese Anleitung erklärt, wie du die MongoDB-Datenbank für die Bartender-App einrichtest und
verwendest.

## Voraussetzungen

Bevor du beginnst, stelle sicher, dass du Folgendes installiert hast:

1. Node.js und npm
2. MongoDB (lokal oder Remote)

## Einrichtungsschritte

### 1. MongoDB installieren

#### Lokale Installation:

- Für macOS: `brew install mongodb-community`
- Für Ubuntu: `sudo apt install mongodb`
- Für Windows: Lade den Installer von
  der [MongoDB-Website](https://www.mongodb.com/try/download/community) herunter

#### Alternativ: MongoDB Atlas (Cloud)

- Erstelle ein kostenloses Konto bei [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Richte einen neuen Cluster ein
- Erstelle einen Datenbankbenutzer
- Erlaube den Zugriff von deiner IP-Adresse
- Kopiere die Verbindungs-URL

### 2. Umgebungsvariablen konfigurieren

Passe die `.env`-Datei im Stammverzeichnis des Projekts an:

```env
NODE_ENV=development
PORT=5024
MONGODB_URI=mongodb://localhost:27017/bartender
# Für MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<benutzername>:<passwort>@cluster0.mongodb.net/bartender
JWT_SECRET=#QGwODkgI7fx
```

### 3. Abhängigkeiten installieren

```bash
npm install
```

### 4. Datenbank mit Testdaten befüllen

```bash
node server/scripts/seed.js
```

## Datenbankstruktur

Die Bartender-App verwendet die folgenden MongoDB-Sammlungen:

1. **Drinks**: Speichert alle Getränkedaten
2. **Staff**: Speichert Mitarbeiterdaten
3. **Sales**: Speichert Verkaufsinformationen
4. **Inventory**: Speichert Inventardaten
5. **Suppliers**: Speichert Lieferantendaten

## API-Endpunkte

Die folgenden API-Endpunkte sind verfügbar:

### Getränke

- `GET /api/drinks` - Alle Getränke abrufen
- `GET /api/drinks/:id` - Einzelnes Getränk abrufen
- `POST /api/drinks` - Neues Getränk erstellen
- `PUT /api/drinks/:id` - Getränk aktualisieren
- `DELETE /api/drinks/:id` - Getränk löschen
- `GET /api/drinks/popular/list` - Beliebte Getränke abrufen

### Personal

- `GET /api/staff` - Alle Mitarbeiter abrufen
- `GET /api/staff/:id` - Einzelnen Mitarbeiter abrufen
- `POST /api/staff` - Neuen Mitarbeiter erstellen
- `PUT /api/staff/:id` - Mitarbeiter aktualisieren
- `DELETE /api/staff/:id` - Mitarbeiter löschen

### Verkäufe

- `GET /api/sales` - Alle Verkäufe abrufen
- `GET /api/sales/:id` - Einzelnen Verkauf abrufen
- `POST /api/sales` - Neuen Verkauf erstellen
- `PUT /api/sales/:id` - Verkauf aktualisieren
- `DELETE /api/sales/:id` - Verkauf löschen
- `GET /api/sales/date/:start/:end` - Verkäufe nach Datumsbereich abrufen
- `POST /api/sales/import` - Verkäufe aus Kassensystem importieren

## Server starten

### Entwicklungsmodus (mit Nodemon)

```bash
npm run dev
```

### Produktionsmodus

```bash
npm run server
```

## Troubleshooting

### Verbindungsprobleme

- Stelle sicher, dass MongoDB läuft
- Überprüfe die MONGODB_URI in der .env-Datei
- Überprüfe Firewalls und Berechtigungen

### Datenbankfehler

- Prüfe die Serverprotokollausgabe auf Fehlermeldungen
- Führe `mongo` oder MongoDB Compass aus, um die Datenbank direkt zu untersuchen

## Produktionsdeployment

Für ein Produktionsdeployment:

1. Setze NODE_ENV=production
2. Verwende ein sicheres JWT_SECRET
3. Verwende eine sichere MongoDB-Verbindung (MongoDB Atlas oder ein gehärteter MongoDB-Server)
4. Setze eine Firewall ein, um nur bestimmte Verbindungen zuzulassen
5. Verwende PM2 oder einen ähnlichen Prozessmanager für den Serverbetrieb