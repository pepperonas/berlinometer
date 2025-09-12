# 🔒 Tor-Check - Anonymitäts-Tester

Eine umfassende Webapp zum Testen der Tor-Anonymität und zur detaillierten Analyse von Netzwerkverbindungen. Entwickelt für das **Raspi Anonymity Control** Projekt.

## 🌟 Features

### Frontend (Client-seitige Tests)
- **Tor-Erkennung**: Mehrfache Verifikation über verschiedene IP-Services
- **WebRTC-Leak-Erkennung**: Prüfung auf lokale IP-Leaks
- **DNS-Leak-Tests**: Analyse der DNS-Auflösung
- **Browser-Fingerprinting**: Sammlung detaillierter Browser-Informationen
- **Real-time Logging**: Live-Anzeige aller Requests und Responses
- **Responsive Design**: Mobile-optimiert mit modernem UI

### Backend (Server-seitige Analyse)
- **Detailliertes Request-Logging**: Alle eingehenden Anfragen werden vollständig protokolliert
- **Header-Analyse**: Erkennung Tor-typischer Header-Muster
- **IP-Tracking**: Verfolgung verschiedener IP-Quellen (Direct, X-Forwarded-For, etc.)
- **JSON-Logs**: Strukturierte Logs für Analyse und Monitoring
- **API-Endpunkte**: RESTful APIs für programmatischen Zugriff
- **PM2-Integration**: Production-ready Process Management

## 🚀 Installation & Deployment

### Lokale Entwicklung

```bash
# Repository klonen (falls Teil eines größeren Projekts)
cd tor-check

# Abhängigkeiten installieren
npm install

# Server im Development-Modus starten
npm run dev
```

### VPS-Deployment

```bash
# Automatisches Deployment auf VPS
./deploy.sh
```

Das Deployment-Skript:
- ✅ Überträgt alle Dateien via rsync
- ✅ Installiert Abhängigkeiten auf dem VPS
- ✅ Konfiguriert PM2 für Production
- ✅ Erstellt Nginx-Konfiguration (optional)
- ✅ Führt automatische Tests durch

## 📊 API-Endpunkte

### `GET /api/client-info`
Detaillierte Client-Informationen:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ip": "1.2.3.4",
  "ips": {
    "direct": "1.2.3.4",
    "forwarded": "5.6.7.8",
    "realIP": null,
    "cfConnectingIP": null
  },
  "headers": { ... },
  "tor": {
    "torBrowser": false,
    "suspiciousHeaders": [],
    "possibleExitNode": false
  },
  "fingerprint": { ... }
}
```

### `GET /api/geoip`
GeoIP-Informationen (erwiterbar mit echten Services):
```json
{
  "ip": "1.2.3.4",
  "country": "Unknown",
  "city": "Unknown",
  "org": "Example ISP",
  "isTor": false
}
```

### `GET /api/logs`
Request-Logs einsehen:
```json
{
  "count": 42,
  "recent": [ ... ],
  "file": "requests-2024-01-15.json"
}
```

### `GET /api/status`
Server-Status und -Metriken:
```json
{
  "server": {
    "hostname": "vps-server",
    "uptime": 86400,
    "loadavg": [0.1, 0.2, 0.3]
  },
  "nodejs": { ... }
}
```

## 📝 Detailliertes Request-Logging

Alle Anfragen werden vollständig geloggt mit:

- **Timestamps**: Präzise Zeitstempel
- **IP-Adressen**: Alle verfügbaren IP-Quellen
- **Headers**: Vollständige HTTP-Headers
- **Connection-Details**: TCP-Verbindungsinformationen
- **Server-Metriken**: System-Performance-Daten
- **Tor-Indikatoren**: Erkennungsalgorithmen

### Log-Dateien

```
logs/
├── requests-2024-01-15.json    # Tägliche Request-Logs
├── combined.log                # PM2 Combined Logs
├── out.log                     # PM2 Stdout
└── error.log                   # PM2 Stderr
```

### Log-Beispiel

```json
{
  "timestamp": "2024-01-15T10:30:15.123Z",
  "ip": "185.220.101.42",
  "forwardedFor": null,
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
  "method": "GET",
  "url": "/",
  "headers": {
    "host": "tor-check.mrx3k1.de",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.5",
    "accept-encoding": "gzip, deflate, br",
    "dnt": "1",
    "upgrade-insecure-requests": "1"
  },
  "connection": {
    "encrypted": false,
    "localAddress": "10.0.0.1",
    "localPort": 3010,
    "remoteAddress": "185.220.101.42",
    "remotePort": 45123
  },
  "type": "request",
  "message": "Eingehender Request"
}
```

## 🛡️ Tor-Erkennungsalgorithmen

Die App verwendet mehrere Methoden zur Tor-Erkennung:

### 1. IP-basierte Erkennung
- Abfrage mehrerer IP-Services (ipify.org, ipinfo.io, ip-api.com)
- Vergleich mit bekannten Tor Exit Node Ranges
- Tor Project API Integration

### 2. Header-Analyse
- Tor Browser User-Agent Erkennung
- Analyse typischer Tor-Browser Header-Kombinationen
- DNT (Do Not Track) Pattern-Matching

### 3. WebRTC-Leak-Erkennung
- STUN-Server Tests für lokale IP-Erkennung
- Warnung bei IP-Leaks trotz Tor-Nutzung

### 4. DNS-Leak-Tests
- Multiple DNS-Resolver Tests
- Antwortzeit-Analyse
- DNS-over-HTTPS Verifikation

## 🎨 Frontend-Features

### Responsive Design
- Mobile-optimiert
- Moderne Glasmorphismus-Ästhetik
- Animierte Status-Indikatoren
- Real-time Updates

### Live-Logging
- Chronologische Request-Anzeige
- JSON-Viewer für detaillierte Daten
- Automatische Aktualisierung
- Farbkodierte Log-Levels

### Status-Dashboard
- Tor-Verbindungsstatus
- Verbindungsdetails-Grid
- Browser-Fingerprint-Anzeige
- WebRTC-Leak-Warnungen

## 🔧 Konfiguration

### Environment-Variablen

```bash
# .env (optional)
NODE_ENV=production
PORT=3010
LOG_LEVEL=info
ENABLE_GEOIP=true
```

### PM2-Konfiguration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'tor-check',
    script: 'server.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3010
    }
  }]
};
```

### Nginx-Konfiguration (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name tor-check.mrx3k1.de;
    
    location / {
        proxy_pass http://localhost:3010;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Original-IP $remote_addr;
    }
}
```

## 📈 Performance & Monitoring

### PM2-Befehle
```bash
# Status prüfen
pm2 status tor-check

# Logs anzeigen
pm2 logs tor-check --lines 50

# Neustart
pm2 restart tor-check

# Memory-Monitor
pm2 monit
```

### Log-Rotation
Automatische tägliche Log-Rotation basierend auf Datum.

### System-Monitoring
- CPU & Memory Usage Tracking
- Request-Rate Monitoring
- Error-Rate Alerts (via PM2)

## 🧪 Testing

### Lokale Tests
```bash
# Server starten
npm start

# Browser öffnen
open http://localhost:3010

# API testen
curl http://localhost:3010/api/client-info | jq
```

### Tor-Tests
1. Tor Browser starten
2. http://localhost:3010 aufrufen
3. Status-Indikator sollte "Tor erkannt" anzeigen
4. Request-Logs auf Tor-spezifische Header prüfen

### Production-Tests
```bash
# Remote API testen
curl https://tor-check.mrx3k1.de/api/status

# Logs auf VPS prüfen
ssh root@mrx3k1.de "pm2 logs tor-check --lines 20"
```

## 🔐 Sicherheitshinweise

### Datenschutz
- Alle IP-Adressen werden geloggt (für Anonymitäts-Tests notwendig)
- Logs enthalten Browser-Fingerprints
- Keine Persistierung sensibler Daten außer Logs

### Produktions-Sicherheit
- Nur HTTP (HTTPS-Terminierung über Reverse Proxy)
- Keine Authentifizierung (öffentlicher Service)
- Rate-Limiting empfohlen für Produktions-Deployment

### Log-Sicherheit
- Log-Dateien rotieren täglich
- Zugriff nur über Server-Admin
- Keine automatische Log-Bereinigung (manuell erforderlich)

## 🛠️ Entwicklung

### Lokale Entwicklung
```bash
# Development-Server mit Auto-Reload
npm run dev

# Logs in Echtzeit
tail -f logs/requests-$(date +%Y-%m-%d).json | jq
```

### Code-Struktur
```
tor-check/
├── server.js              # Express-Server mit API
├── index.html             # Frontend Single-Page-App
├── package.json           # Node.js Dependencies
├── ecosystem.config.js    # PM2 Configuration
├── deploy.sh              # Deployment Script
├── logs/                  # Request Logs (auto-generated)
└── README.md              # This file
```

### Erweiterungsmöglichkeiten
- GeoIP-Service Integration (MaxMind, IP2Location)
- Tor Exit Node Liste (live updates)
- WebRTC STUN Server Tests erweitern
- DNS-over-HTTPS Server Tests
- VPN-Erkennung (zusätzlich zu Tor)
- Browser-Fingerprint-Analyse erweitern

## 📞 Support & Debugging

### Häufige Probleme

**Problem**: Server startet nicht auf Port 3010
```bash
# Port-Nutzung prüfen
lsof -i :3010
# Oder anderen Port verwenden
PORT=3011 npm start
```

**Problem**: Logs werden nicht geschrieben
```bash
# Berechtigung prüfen
ls -la logs/
chmod 755 logs/
```

**Problem**: API gibt 500-Fehler
```bash
# Server-Logs prüfen
pm2 logs tor-check --lines 50
```

### Debug-Modus
```bash
# Detaillierte Logs aktivieren
DEBUG=* npm start
```

### Remote-Debugging
```bash
# VPS-Logs live verfolgen
ssh root@mrx3k1.de "tail -f /var/www/html/tor-check/logs/requests-$(date +%Y-%m-%d).json"
```

## 📄 Lizenz

MIT License - Siehe LICENSE-Datei für Details.

## 🤝 Beitragen

1. Fork das Repository
2. Feature-Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request öffnen

---

**Entwickelt für maximale Anonymitäts-Transparenz und Sicherheits-Auditing** 🔒✨