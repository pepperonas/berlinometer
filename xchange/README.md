# xchange

Ein sicherer Online-Speicher für Datei-Upload, -Download und -Sharing mit zwei verschiedenen Zugangsebenen.

## Features

### 🔐 Zwei-Stufen-Authentifizierung
- **Vollzugriff** (Passwort: `1337`): Alle Funktionen verfügbar
- **Upload-Modus** (Passwort: `go`): Nur Datei-Upload möglich

### 📁 Datei-Management
- Drag & Drop Upload
- Fortschrittsanzeige beim Upload
- Dateiliste mit Größenangaben
- Download-Funktionalität
- Datei-Löschung

### 🔗 Share-Links
- Zeitlich begrenzte oder unbegrenzte Share-Links
- Sichere UUID-basierte Links
- WhatsApp-optimierte Vorschau
- Automatische Link-Bereinigung bei Ablauf

### 🛡️ Sicherheits-Features
- Session-basierte Authentifizierung
- Bruteforce-Schutz (IP-Blockierung)
- Automatische Session-Bereinigung
- Sichere Datei-Speicherung

### 🎨 Benutzeroberfläche
- Dunkles Theme
- Responsive Design
- Material Design Icons
- Animierte Hintergrundeffekte
- Toast-Benachrichtigungen

## Installation

```bash
# Repository klonen
git clone <repository-url>
cd xchange

# Dependencies installieren
npm install

# Server starten
npm start
```

Der Server läuft standardmäßig auf `http://localhost:5009/xchange`

## Konfiguration

### Umgebungsvariablen
```bash
PORT=5009  # Server-Port (optional)
```

### Passwort-Konfiguration
In `server.js` können die Passwörter angepasst werden:

```javascript
const AUTH_CONFIG = {
    password: '1337',        // Vollzugriff
    altPassword: 'go',       // Upload-Modus
    maxAttempts: 5,          // Max. Fehlversuche
    blockTime: 15 * 60 * 1000,    // Blockzeit (15 Min)
    sessionDuration: 24 * 60 * 60 * 1000  // Session-Gültigkeit (24h)
};
```

## Deployment

### PM2 (Empfohlen)
```bash
# PM2 Konfiguration (ecosystem.config.js)
module.exports = {
  apps: [{
    name: 'xchange',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5009
    }
  }]
};

# Starten
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx Reverse Proxy
```nginx
location /xchange {
    proxy_pass http://localhost:5009;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    client_max_body_size 500M;
}
```

## Dateistruktur

```
xchange/
├── server.js              # Haupt-Server-Datei
├── public/
│   └── index.html         # Frontend (Single-Page-App)
├── uploads/               # Datei-Speicher (wird automatisch erstellt)
├── files.json            # Datei-Metadaten
├── sessions.json          # Aktive Sessions
├── shares.json           # Share-Link-Datenbank
├── package.json
└── README.md
```

## API Endpoints

### Authentifizierung
- `POST /xchange/authenticate` - Login
- `POST /xchange/logout` - Logout
- `GET /xchange/login` - Login-Seite

### Datei-Management
- `GET /xchange/files` - Dateien auflisten
- `POST /xchange/upload` - Datei hochladen
- `GET /xchange/download/:id` - Datei herunterladen
- `DELETE /xchange/files/:id` - Datei löschen

### Share-Links
- `POST /xchange/create-share` - Share-Link erstellen
- `GET /xchange/share/:shareId` - Geteilte Datei abrufen
- `GET /xchange/preview/:shareId` - Share-Link-Vorschau

### Status
- `GET /xchange/status` - Server-Status

## Zugangsebenen

### Vollzugriff (Passwort: `1337`)
- ✅ Dateien hochladen
- ✅ Alle Dateien anzeigen
- ✅ Dateien herunterladen
- ✅ Dateien löschen
- ✅ Share-Links erstellen

### Upload-Modus (Passwort: `go`)
- ✅ Dateien hochladen
- ❌ Keine Dateien anzeigen
- ❌ Keine Dateien herunterladen
- ❌ Keine Dateien löschen oder teilen

## Sicherheitshinweise

1. **Passwörter ändern**: Standardpasswörter vor Produktionsumgebung ändern
2. **HTTPS verwenden**: In Produktion immer HTTPS verwenden
3. **Firewall**: Server-Port nur für notwendige IPs öffnen
4. **Backups**: Regelmäßige Backups von `files.json` und `uploads/`
5. **Updates**: Dependencies regelmäßig aktualisieren

## Troubleshooting

### Dateien werden nicht angezeigt
```bash
# Logs prüfen
pm2 logs xchange

# Datei-Datenbank prüfen
cat files.json

# Upload-Verzeichnis prüfen
ls -la uploads/
```

### Session-Probleme
```bash
# Sessions zurücksetzen
echo '{}' > sessions.json
pm2 restart xchange
```

### Performance-Optimierung
- Nginx für statische Dateien verwenden
- PM2 Cluster-Modus für hohe Last
- Log-Rotation aktivieren

## Lizenz

MIT License

## Support

Bei Problemen oder Fragen:
1. Issues im Repository erstellen
2. Logs mit `pm2 logs xchange` prüfen
3. Debug-Modus in `server.js` aktivieren