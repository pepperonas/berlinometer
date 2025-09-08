# 🎯 Dart Snizzle - Professional Dart Counter PWA

Eine umfassende Progressive Web App für Dart-Spiele mit Benutzer-Management, Spielerverwaltung, Statistiken und Online-Multiplayer-Funktionen.

## 🚀 Features

### ⭐ Kern-Features
- **Mehrere Spielmodi**: 301, 501, 701, Cricket, Around the Clock
- **Intuitive Punkteeingabe**: Quick-Buttons, Numpad, Checkout-Vorschläge
- **Spielerverwaltung**: Unbegrenzte Spieler pro Benutzer mit Statistiken
- **Umfassende Statistiken**: Charts, Durchschnitte, Leistungstrends
- **PWA-Optimiert**: Installierbar, Offline-Funktionalität

### 👥 Social Features
- **Benutzerverwaltung**: JWT-Auth mit Admin-Freischaltung
- **Freundesystem**: Freunde finden und hinzufügen
- **Online-Spiele**: Multiplayer mit Raumcodes
- **Leaderboards**: Vergleiche deine Statistiken

### 🎨 Design
- **Dark Theme**: Material Design mit modernen Farben
- **Mobile-First**: Responsive Design für alle Geräte
- **Touch-Optimiert**: Große Buttons für mobile Nutzung
- **PWA-Standards**: Service Worker, Manifest, Installation

## 🛠 Tech Stack

### Backend
- **Node.js** + Express
- **MongoDB** mit Mongoose
- **JWT** Authentication
- **bcryptjs** für Passwort-Hashing
- **express-validator** für Input-Validierung
- **PM2** für Process Management

### Frontend
- **React** 19 mit Hooks
- **React Router** für Navigation
- **Axios** für API-Calls
- **Chart.js** für Statistiken
- **PWA** mit Service Worker

## 📦 Installation

### Backend Setup
```bash
cd dart-snizzle/backend
npm install
cp .env.example .env  # Und Werte anpassen
npm run dev
```

### Frontend Setup
```bash
cd dart-snizzle/frontend
npm install
npm start
```

### Produktion mit PM2
```bash
cd dart-snizzle/backend
npm install --production
pm2 start ecosystem.config.js
```

## 🌐 Deployment

Das Projekt ist für das mrx3k1.de VPS konfiguriert:

### 1. Backend Deployment
```bash
# Backend Code auf Server kopieren
scp -r backend/* root@mrx3k1.de:/var/www/html/dart-snizzle/backend/

# Dependencies installieren
ssh root@mrx3k1.de "cd /var/www/html/dart-snizzle/backend && npm install --production"

# PM2 Service starten
ssh root@mrx3k1.de "cd /var/www/html/dart-snizzle/backend && pm2 start ecosystem.config.js"
```

### 2. Frontend Deployment
```bash
# Frontend bauen
cd frontend && npm run build

# Build auf Server kopieren
scp -r build/* root@mrx3k1.de:/var/www/html/dart-snizzle/frontend/
```

### 3. Nginx Konfiguration
```nginx
# Frontend Static Files
location /dart-snizzle/ {
    alias /var/www/html/dart-snizzle/frontend/;
    try_files $uri $uri/ /dart-snizzle/index.html;
    index index.html;
}

# Backend API Proxy
location /dart-snizzle/api/ {
    proxy_pass http://localhost:5070/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 📊 API Endpoints

### Authentifizierung
- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/login` - Benutzer anmelden
- `GET /api/auth/me` - Aktueller Benutzer
- `POST /api/auth/logout` - Abmelden

### Spieler
- `GET /api/players` - Alle Spieler abrufen
- `POST /api/players` - Neuen Spieler erstellen
- `PUT /api/players/:id` - Spieler bearbeiten
- `DELETE /api/players/:id` - Spieler löschen

### Spiele
- `POST /api/games` - Neues Spiel erstellen
- `PUT /api/games/:id/start` - Spiel starten
- `POST /api/games/:id/throw` - Wurf hinzufügen
- `GET /api/games/room/:code` - Spiel über Raumcode beitreten

### Statistiken
- `GET /api/stats/overview` - Überblick Statistiken
- `GET /api/stats/charts` - Chart-Daten
- `GET /api/stats/leaderboard` - Bestenliste

### Admin (nur Admin-Rolle)
- `GET /api/admin/users` - Alle Benutzer
- `PUT /api/admin/users/:id/activate` - Benutzer aktivieren
- `PUT /api/admin/users/:id/suspend` - Benutzer sperren

## 🎮 Spielmodi

### Standard Modi
- **301/501/701**: Klassische Countdown-Modi mit Double-Out
- **Cricket**: Treffe 20-15 und Bull, sammle Punkte
- **Around the Clock**: Treffe Zahlen 1-20 in Reihenfolge

### Features pro Modus
- Individuelle Statistiken
- Checkout-Vorschläge
- Wurf-Historie
- Achievement-System

## 🔧 Konfiguration

### Environment Variables (.env)
```env
NODE_ENV=production
PORT=5070
MONGODB_URI=mongodb://localhost:27017/dart-snizzle
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
CORS_ORIGIN=https://mrx3k1.de
```

### PWA Konfiguration
- **Offline-Funktionalität**: Service Worker cached wichtige Assets
- **Installation**: Add to Home Screen auf mobile Geräten
- **App-like Experience**: Standalone Display Mode

## 👨‍💻 Entwicklung

### Lokale Entwicklung
1. MongoDB lokal installieren und starten
2. Backend starten: `cd backend && npm run dev`
3. Frontend starten: `cd frontend && npm start`
4. App öffnen: http://localhost:3000/dart-snizzle

### Admin-Account erstellen
```bash
# Nach dem ersten Start, Admin-User manuell in MongoDB erstellen
# Oder über MongoDB Compass/Shell:
use dart-snizzle;
db.users.updateOne(
  { username: "admin" },
  { $set: { role: "admin", status: "active" } }
);
```

## 📱 PWA Installation

### Desktop
1. Chrome/Edge öffnen
2. Zur App navigieren
3. Install-Button in Adressleiste klicken

### Mobile
1. Safari/Chrome öffnen
2. Zur App navigieren
3. "Add to Home Screen" wählen

## 🔐 Sicherheit

- Passwort-Hashing mit bcrypt
- JWT Token mit Expiration
- Rate Limiting auf API-Endpoints
- Input Validation mit express-validator
- CORS-Konfiguration
- Helmet für Security Headers

## 📈 Performance

- Lazy Loading der Komponenten
- Image Optimization
- Code Splitting
- Service Worker Caching
- MongoDB Indexing
- PM2 Cluster Mode (optional)

## 🐛 Troubleshooting

### Backend startet nicht
- MongoDB läuft? `sudo systemctl status mongod`
- Port 5070 frei? `netstat -tulpn | grep 5070`
- Environment Variables gesetzt?

### Frontend Build-Fehler
- Node Version >= 18? `node --version`
- Dependencies installiert? `npm install`
- Homepage in package.json korrekt?

### PWA installiert sich nicht
- HTTPS aktiv?
- Service Worker registriert?
- Manifest.json erreichbar?

## 📝 Lizenz

© 2025 Martin Pfeffer - Alle Rechte vorbehalten

---

**Port**: 5070  
**Live URL**: https://mrx3k1.de/dart-snizzle  
**Status**: ✅ Produktionsbereit