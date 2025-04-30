# RA Events Crawler - Backend

Backend-Server für den RA Events Crawler. Dient als Proxy für Anfragen an Resident Advisor und umgeht CORS-Beschränkungen.

## Installation

```bash
npm install
```

## Starten

```bash
npm start
```

Der Server läuft dann auf http://localhost:5022

## API-Endpunkte

- `GET /api/events?url=URL&page=PAGE` - Holt Events von einer bestimmten Seite
- `GET /api/events/:id` - Holt Details zu einem bestimmten Event
