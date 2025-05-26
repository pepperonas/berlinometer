# Weather Tracker

Eine moderne Wetterstation-App mit MySQL-Datenbank und ansprechender Visualisierung.

## Features
- 📊 Echtzeit-Charts mit Chart.js
- 🗄️ MySQL-Datenbankintegration
- 🕐 Berlin-Zeitzone für alle Zeitangaben
- 📈 24-Stunden-Statistiken
- 🎨 Modernes, ansprechendes Design

## Installation

1. MySQL-Datenbank erstellen:
```bash
mysql -u root -p < schema.sql
```

2. Dependencies installieren:
```bash
npm install
```

3. Datenbank konfigurieren (optional):
   - Kopiere `.env.example` zu `.env`
   - Passe die Datenbankverbindung an

4. Server starten:
```bash
node weather_api.js
```

Der Server läuft auf http://localhost:5033

## API Endpoints

- `POST /weather-tracker` - Empfängt Sensordaten
- `GET /` - Dashboard mit Charts
- `GET /api/data` - Alle Daten abrufen
- `GET /api/chart-data?hours=24` - Chart-Daten der letzten X Stunden

## Raspberry Pi Setup

Der `raspi-code.py` sendet Sensordaten an die API. Stelle sicher, dass die URL in der Datei korrekt konfiguriert ist.