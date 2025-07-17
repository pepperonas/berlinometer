# Social Market

Ein exklusiver Marktplatz mit schlüsselbasiertem Zugang im minimalistischen Typewriter-Design.

## 🔑 Funktionen

- **Schlüssel-Authentifizierung**: Zugang nur mit gültigen 4x4-Keys (Format: ABCD-1234-EFGH-5678)
- **Master-Admin-System**: Vollzugriff mit Master-Passwort
- **Einmalige Schlüssel**: Jeder Key kann nur einmal verwendet werden
- **Produkt-Management**: Upload von Bildern, Texten und Preisen
- **Link-Generierung**: Direktlinks für einmaligen Zugang
- **Typewriter-Design**: Minimalistisches Terminal-ähnliches Interface

## 🚀 Live Demo

**URL**: https://mrx3k1.de/social-market/

**Master-Passwort**: `cx6fEwxbA3K-`

## 🏗️ Architektur

### Frontend (React)
- **Framework**: Create React App
- **Styling**: Vanilla CSS mit Typewriter-Ästhetik
- **Font**: Courier Prime (Google Fonts)
- **Build**: Optimiert für `/social-market/` Pfad

### Backend (Node.js/Express)
- **Server**: Express.js auf Port 5015
- **Storage**: In-Memory Maps für Keys und Produkte
- **File Upload**: Multer für Bildverarbeitung
- **CORS**: Aktiviert für Frontend-Integration

## 📂 Projektstruktur

```
social-market/
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── App.js           # Hauptkomponente
│   │   ├── App.css          # Typewriter-Styling
│   │   └── index.js         # Entry Point
│   ├── build/               # Production Build
│   └── package.json         # Frontend Dependencies
├── backend/                 # Node.js Backend
│   ├── server.js           # Express Server
│   ├── uploads/            # Hochgeladene Bilder
│   ├── ecosystem.config.js # PM2 Konfiguration
│   └── package.json        # Backend Dependencies
├── nginx-social-market.conf # Nginx Konfiguration
├── deploy.sh               # Deployment Script
└── README.md               # Diese Datei
```

## 🔧 Installation & Development

### Voraussetzungen
- Node.js (v16+)
- npm
- PM2 (für Produktion)
- Nginx (für Reverse Proxy)

### Lokale Entwicklung

```bash
# Repository klonen
git clone <repository-url>
cd social-market

# Backend starten
cd backend
npm install
npm run dev

# Frontend starten (neues Terminal)
cd frontend
npm install
npm start
```

**Lokale URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5015

### Production Deployment

```bash
# Frontend builden
cd frontend
npm run build

# Backend deployen
cd backend
pm2 start ecosystem.config.js
pm2 save

# Nginx konfigurieren (siehe nginx-social-market.conf)
sudo systemctl reload nginx
```

## 🔐 API Endpoints

### Schlüssel-Validierung
```http
POST /api/validate-key
Content-Type: application/json

{
  "key": "ABCD-1234-EFGH-5678"
}
```

**Response:**
```json
{
  "valid": true,
  "isMaster": false,
  "products": []
}
```

### Schlüssel-Generierung (Master nur)
```http
POST /api/generate-key
Content-Type: application/json

{
  "password": "cx6fEwxbA3K-"
}
```

**Response:**
```json
{
  "key": "WXYZ-9876-ABCD-1234"
}
```

### Link-Generierung (Master nur)
```http
POST /api/generate-link
Content-Type: application/json

{
  "password": "cx6fEwxbA3K-"
}
```

**Response:**
```json
{
  "link": "https://mrx3k1.de/social-market/?key=uuid-link-key"
}
```

### Produkt-Upload (Master nur)
```http
POST /api/upload-product
Content-Type: multipart/form-data

password: cx6fEwxbA3K-
image: [File]
text: "Produktbeschreibung"
price: 29.99
```

## 🎨 Design-System

### Farbschema
- **Hintergrund**: `#f4f4f4` (Light Gray)
- **Container**: `#ffffff` (White)
- **Text**: `#333333` (Dark Gray)
- **Buttons**: `#333333` (Dark Gray)
- **Accent**: `#27ae60` (Green), `#e74c3c` (Red)

### Typografie
- **Font**: Courier Prime (Monospace)
- **Sizes**: 14px-24px
- **Typewriter-Effekt**: CSS Animation mit Cursor-Blink

## 🛡️ Sicherheit

### Zugriffskontrolle
- Schlüssel werden nach einmaliger Nutzung invalidiert
- Master-Passwort erforderlich für Admin-Funktionen
- Keine persistente Speicherung (Memory-Only)

### File Upload
- Nur Bilder erlaubt (accept="image/*")
- 5MB Upload-Limit
- Sichere Dateinamen mit Timestamps

## 🔄 PM2 Management

```bash
# Status anzeigen
pm2 list

# Logs anzeigen
pm2 logs social-market-backend

# Neustart
pm2 restart social-market-backend

# Stoppen
pm2 stop social-market-backend

# Memory-Monitoring
pm2 monit
```

## 🌐 Nginx Konfiguration

Die App läuft hinter Nginx als Reverse Proxy:

```nginx
# Frontend
location /social-market/ {
    alias /var/www/html/social-market/frontend/;
    try_files $uri $uri/ /social-market/index.html;
}

# Backend API
location /social-market/api/ {
    proxy_pass http://localhost:5015/api/;
    # ... weitere Proxy-Einstellungen
}

# Uploads
location /social-market/uploads/ {
    proxy_pass http://localhost:5015/uploads/;
    # ... weitere Proxy-Einstellungen
}
```

## 🐛 Troubleshooting

### Weiße Seite
- Hard Refresh (Ctrl+F5 / Cmd+Shift+R)
- Browser-Cache leeren
- Inkognito-Modus testen

### API-Fehler
```bash
# Backend-Logs prüfen
pm2 logs social-market-backend

# Port-Verfügbarkeit prüfen
netstat -tulpn | grep 5015

# Nginx-Test
sudo nginx -t
```

### Build-Probleme
```bash
# Frontend neu builden
cd frontend
rm -rf build node_modules
npm install
npm run build
```

## 📝 Changelog

### v1.0.0 (2025-07-17)
- ✨ Initiale Version
- 🔑 Schlüssel-basierte Authentifizierung
- 🎨 Typewriter-Design
- 📱 Responsive Layout
- 🔒 Master-Admin-System
- 📁 Produkt-Upload mit Bildern
- 🔗 Link-Generierung
- 🚀 PM2 + Nginx Deployment

## 👨‍💻 Entwickler

**Martin Pfeffer**
- Website: https://mrx3k1.de
- App: https://mrx3k1.de/social-market/

## 📄 Lizenz

Private Nutzung - Alle Rechte vorbehalten.

---

*Made with ❤️ in Typewriter Style*