# RA Events Crawler

Ein moderner Web-Crawler für Resident Advisor Events, entwickelt mit React, Material UI und Node.js/Express.

## Struktur

Das Projekt besteht aus zwei Hauptteilen:

- **Backend**: Ein Node.js/Express-Server, der als Proxy fungiert und Events von Resident Advisor crawlt.
- **Frontend**: Eine React-Anwendung mit Material UI für die Benutzeroberfläche.

## Installation und Start

### Voraussetzungen

- Node.js (v14 oder höher)
- npm (v6 oder höher)

### Backend

```bash
cd backend
npm install
npm start
```

Der Backend-Server läuft dann auf http://localhost:5022

### Frontend

```bash
cd frontend
npm install
npm start
```

Die React-App läuft dann auf http://localhost:3000

## Features

- Crawlt Events von Resident Advisor Berlin und anderen Städten
- Filtert Events nach Datum, Genre und Venue
- Unterstützt Pagination und "Alles laden" Funktion
- Exportiert Daten als JSON oder CSV
- Reagiert auf Mobilgeräte (Responsive Design)
- Material Design Oberfläche mit dem Farbschema #2C2E3B

## Beispiel-URLs

Du kannst verschiedene RA-Regionen und Kategorien crawlen:

- Berlin: `https://de.ra.co/events/de/berlin`
- Hamburg: `https://de.ra.co/events/de/hamburg`
- München: `https://de.ra.co/events/de/munich`
- Köln: `https://de.ra.co/events/de/cologne`
- Bestimmtes Genre: `https://de.ra.co/events/de/berlin?filters=genres.techno`
- Bestimmter Zeitraum: `https://de.ra.co/events/de/berlin?week=2025-05-01`

## Hinweise

- Bitte beachte die Nutzungsbedingungen von Resident Advisor
- Übermäßige Anfragen können zu IP-Bans führen
- Das Crawling sollte mit angemessenen Pausen zwischen den Anfragen erfolgen

## Lizenz

MIT
