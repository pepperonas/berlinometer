# Bartender - Bar Management System

Eine umfassende Web-Anwendung zur Verwaltung von Bar-Wirtschaftsdaten, einschließlich Getränke, Personal, Finanzen und mehr.

## Funktionen

- **Dashboard**: Übersicht über wichtige Kennzahlen wie Umsatz, Gewinn, Kundenanzahl
- **Getränkeverwaltung**: Verwalten Sie Ihr Getränkeangebot mit Preisen, Kosten und Bestand
- **Personalverwaltung**: Verwalten Sie Ihr Team, Arbeitszeiten und Gehälter
- **Finanzverwaltung**: Erfassen Sie Einnahmen und Ausgaben und behalten Sie den Überblick
- **Bestandsverwaltung**: Überwachen Sie Ihren Lagerbestand und erhalten Sie Warnungen bei niedrigem Bestand
- **Berichte**: Analysieren Sie Ihre Geschäftsdaten mit detaillierten Berichten

## Technologien

- **Frontend**: React, Material-UI, Recharts
- **Routing**: React Router
- **State Management**: React Context API
- **Datenverwaltung**: Mock-API (kann später durch echte Backend-Verbindung ersetzt werden)

## Installation

1. Stellen Sie sicher, dass [Node.js](https://nodejs.org/) (v14 oder höher) installiert ist
2. Repository klonen
3. Abhängigkeiten installieren:

```bash
cd bartender
npm install
```

4. Entwicklungsserver starten:

```bash
npm start
```

Die Anwendung ist nun unter [http://localhost:3000](http://localhost:3000) verfügbar.

## Anmeldedaten für Demo

- **E-Mail**: demo@example.com
- **Passwort**: password

## Projektstruktur

```
bartender/
├── public/              # Statische Dateien
├── src/                 # Quellcode
│   ├── assets/          # Bilder, Fonts, etc.
│   ├── components/      # Wiederverwendbare Komponenten
│   ├── context/         # React Context
│   ├── hooks/           # Custom React Hooks
│   ├── pages/           # Seitenkomponenten
│   ├── services/        # API-Services
│   └── utils/           # Hilfsfunktionen
├── package.json         # Projektabhängigkeiten
└── README.md            # Projektdokumentation
```

## Erweiterungsmöglichkeiten

- Backend-Anbindung mit Node.js, Express und MongoDB
- Authentifizierung und Autorisierung
- Zahlungssystem-Integration
- Mobile App mit React Native
- Kundenverwaltung und Treueprogramm
- Tischreservierungen
- Eventmanagement

## Lizenz

MIT