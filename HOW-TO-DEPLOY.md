# 🚀 Deployment Guide - MRX3K1 VPS

Vollständiger Leitfaden für das Deployment von Apps auf dem mrx3k1.de VPS.

## 📋 Inhaltsverzeichnis

1. [Voraussetzungen](#voraussetzungen)
2. [Port Management](#port-management)
3. [React App Deployment](#react-app-deployment)
4. [Backend Service Deployment](#backend-service-deployment)
5. [PM2 Management](#pm2-management)
6. [Nginx Konfiguration](#nginx-konfiguration)
7. [Testing & Debugging](#testing--debugging)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## 🔧 Voraussetzungen

### VPS Setup
- **Server**: Ubuntu 22.04 LTS
- **Domain**: mrx3k1.de (mit SSL via Let's Encrypt)
- **Web Server**: Nginx 1.24.0
- **Process Manager**: PM2
- **Node.js**: v20.19.2
- **NPM**: Latest

### Lokale Tools
- SSH-Zugang zum VPS
- SCP für Datei-Transfer
- Node.js für lokale Builds

## 🔌 Port Management

### 1. Verfügbare Ports prüfen

```bash
# Aktuelle Port-Belegung prüfen
cat /Users/martin/WebstormProjects/mrx3k1/PORTS.md

# Freie Ports finden
netstat -tulpn | grep :XXXX
```

### 2. Neuen Port reservieren

```bash
# PORTS.md bearbeiten
vim /Users/martin/WebstormProjects/mrx3k1/PORTS.md

# Format:
| 5XXX | App Name | app-name | `app-name/backend/server.js` |
```

### 3. Port-Bereiche

```
3000-3003: Frontend Development Servers
4000-4999: Special Services (Blog, WiFi, etc.)
5000-5081: Backend APIs
8000+: Proxy Services
```

**Empfehlung**: Nutze 5015-5080 für neue Backend-Services

## ⚛️ React App Deployment

### 1. Frontend für Subdirectory vorbereiten

```json
// package.json
{
  "name": "app-name",
  "homepage": "/app-name",
  // ...
}
```

### 2. Production Build erstellen

```bash
cd app-name/frontend
npm run build
```

### 3. Build auf VPS uploaden

```bash
# Temporäres Verzeichnis erstellen
ssh root@mrx3k1.de "mkdir -p /tmp/app-name-frontend"

# Build-Files uploaden
scp -r app-name/frontend/build/* root@mrx3k1.de:/tmp/app-name-frontend/

# In Production-Verzeichnis verschieben
ssh root@mrx3k1.de "
sudo mkdir -p /var/www/html/app-name/frontend
sudo cp -r /tmp/app-name-frontend/* /var/www/html/app-name/frontend/
sudo chown -R www-data:www-data /var/www/html/app-name/frontend
"
```

## 🔙 Backend Service Deployment

### 1. Backend-Code vorbereiten

```javascript
// server.js
const PORT = process.env.PORT || 5XXX; // Assigned port

// CORS für subdirectory
app.use(cors());

// Static files für uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

### 2. PM2 Ecosystem erstellen

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'app-name-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5XXX
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5XXX
    }
  }]
};
```

### 3. Backend auf VPS deployen

```bash
# Backend-Files uploaden
ssh root@mrx3k1.de "mkdir -p /tmp/app-name-backend"
scp -r app-name/backend/* root@mrx3k1.de:/tmp/app-name-backend/

# In Production verschieben
ssh root@mrx3k1.de "
sudo mkdir -p /var/www/html/app-name/backend
sudo cp -r /tmp/app-name-backend/* /var/www/html/app-name/backend/
sudo chown -R www-data:www-data /var/www/html/app-name/backend
"

# Dependencies installieren
ssh root@mrx3k1.de "
cd /var/www/html/app-name/backend
sudo npm install --production
"
```

## 🔄 PM2 Management

### 1. Service starten

```bash
ssh root@mrx3k1.de "
cd /var/www/html/app-name/backend
sudo pm2 start ecosystem.config.js
sudo pm2 save
"
```

### 2. PM2 Commands

```bash
# Status aller Services
sudo pm2 list

# Logs anzeigen
sudo pm2 logs app-name-backend

# Service neustarten
sudo pm2 restart app-name-backend

# Service stoppen
sudo pm2 stop app-name-backend

# Service löschen
sudo pm2 delete app-name-backend

# Monitoring
sudo pm2 monit

# Auto-startup aktivieren (einmalig)
sudo pm2 startup
```

### 3. Memory & Performance

```bash
# Memory-Limits setzen
sudo pm2 start ecosystem.config.js --max-memory-restart 1G

# CPU-Überwachung
sudo pm2 show app-name-backend
```

## 🌐 Nginx Konfiguration

### 1. Nginx Config Template

```nginx
# Frontend Static Files
location /app-name/ {
    alias /var/www/html/app-name/frontend/;
    try_files $uri $uri/ /app-name/index.html;
    index index.html;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    
    # Performance-Optimierung
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}

# Backend API Proxy
location /app-name/api/ {
    proxy_pass http://localhost:5XXX/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# File Uploads (falls benötigt)
location /app-name/uploads/ {
    proxy_pass http://localhost:5XXX/uploads/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 2. Config in Nginx einfügen

```bash
# Backup erstellen
ssh root@mrx3k1.de "sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup-$(date +%Y%m%d)"

# Config bearbeiten
ssh root@mrx3k1.de "sudo nano /etc/nginx/sites-available/default"

# An geeigneter Stelle im HTTPS-Server Block einfügen (vor ZipZap oder am Ende)
```

### 3. Nginx testen und neuladen

```bash
# Syntax testen
ssh root@mrx3k1.de "sudo nginx -t"

# Bei Erfolg: Nginx neuladen
ssh root@mrx3k1.de "sudo systemctl reload nginx"

# Status prüfen
ssh root@mrx3k1.de "sudo systemctl status nginx"
```

## 🧪 Testing & Debugging

### 1. Frontend testen

```bash
# HTML-Response prüfen
curl -I https://mrx3k1.de/app-name/

# CSS/JS-Files prüfen
curl -I https://mrx3k1.de/app-name/static/css/main.xxx.css
curl -I https://mrx3k1.de/app-name/static/js/main.xxx.js
```

### 2. Backend API testen

```bash
# API-Endpoint testen
curl https://mrx3k1.de/app-name/api/health

# POST-Request testen
curl -X POST https://mrx3k1.de/app-name/api/test \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
```

### 3. Debug-Logs

```bash
# Backend-Logs
sudo pm2 logs app-name-backend --lines 50

# Nginx-Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System-Logs
sudo journalctl -u nginx -f
```

## 🎯 Best Practices

### 1. Deployment Automation

```bash
# Deploy-Script erstellen
#!/bin/bash
APP_NAME="app-name"
PORT="5XXX"

echo "🚀 Deploying $APP_NAME..."

# Frontend build
cd frontend && npm run build

# Upload files
scp -r build/* root@mrx3k1.de:/tmp/$APP_NAME-frontend/
scp -r ../backend/* root@mrx3k1.de:/tmp/$APP_NAME-backend/

# Deploy on VPS
ssh root@mrx3k1.de "
  # Frontend
  sudo cp -r /tmp/$APP_NAME-frontend/* /var/www/html/$APP_NAME/frontend/
  sudo chown -R www-data:www-data /var/www/html/$APP_NAME/frontend
  
  # Backend
  sudo cp -r /tmp/$APP_NAME-backend/* /var/www/html/$APP_NAME/backend/
  cd /var/www/html/$APP_NAME/backend
  sudo npm install --production
  sudo pm2 restart $APP_NAME-backend || sudo pm2 start ecosystem.config.js
"

echo "✅ Deployment complete!"
```

### 2. Environment Variables

```bash
# .env für Backend
NODE_ENV=production
PORT=5XXX
CORS_ORIGIN=https://mrx3k1.de

# In PM2 Ecosystem
env: {
  NODE_ENV: 'production',
  PORT: 5XXX,
  CORS_ORIGIN: 'https://mrx3k1.de'
}
```

### 3. Security Headers

```nginx
# In Nginx Location Block
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### 4. File Upload Limits

```nginx
# Für Uploads > 1MB
client_max_body_size 50M;

# In Backend
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

## 🚨 Troubleshooting

### 1. Weiße Seite / React App lädt nicht

**Problem**: Frontend zeigt nur weiße Seite

**Lösungen**:
```bash
# 1. Homepage-Pfad prüfen
# package.json: "homepage": "/app-name"

# 2. Hard Refresh im Browser
# Ctrl+F5 / Cmd+Shift+R

# 3. Browser-Cache leeren
# F12 → Network → Disable Cache

# 4. Pfade in index.html prüfen
curl https://mrx3k1.de/app-name/ | grep -E "(src=|href=)"
```

### 2. API-Calls fehlschlagen

**Problem**: Frontend kann Backend nicht erreichen

**Lösungen**:
```bash
# 1. Backend-Status prüfen
sudo pm2 list | grep app-name

# 2. Port-Verfügbarkeit testen
curl http://localhost:5XXX/api/health

# 3. Nginx-Proxy prüfen
curl https://mrx3k1.de/app-name/api/health

# 4. CORS-Fehler beheben
# Backend: app.use(cors({ origin: 'https://mrx3k1.de' }))
```

### 3. PM2 Service startet nicht

**Problem**: Backend-Service läuft nicht

**Lösungen**:
```bash
# 1. Manueller Start
cd /var/www/html/app-name/backend
node server.js

# 2. Dependencies prüfen
npm install --production

# 3. Port-Konflikt prüfen
netstat -tulpn | grep 5XXX

# 4. Logs analysieren
sudo pm2 logs app-name-backend
```

### 4. Nginx-Fehler

**Problem**: 502 Bad Gateway / 404 Not Found

**Lösungen**:
```bash
# 1. Nginx-Syntax testen
sudo nginx -t

# 2. Backend-Erreichbarkeit prüfen
curl http://localhost:5XXX

# 3. Nginx-Logs prüfen
sudo tail -f /var/log/nginx/error.log

# 4. Config-Backup wiederherstellen
sudo cp /etc/nginx/sites-available/default.backup-YYYYMMDD /etc/nginx/sites-available/default
sudo systemctl reload nginx
```

### 5. File Upload Probleme

**Problem**: Datei-Uploads funktionieren nicht

**Lösungen**:
```bash
# 1. Upload-Verzeichnis erstellen
mkdir -p /var/www/html/app-name/backend/uploads
chown www-data:www-data /var/www/html/app-name/backend/uploads

# 2. Nginx-Limits erhöhen
# client_max_body_size 50M;

# 3. Express-Limits anpassen
# app.use(express.json({ limit: '50mb' }))
```

## 📊 Monitoring & Maintenance

### 1. Performance Monitoring

```bash
# PM2 Monitoring
sudo pm2 monit

# System-Ressourcen
htop
df -h
free -m

# Nginx-Status
sudo systemctl status nginx
```

### 2. Log Rotation

```bash
# PM2-Logs rotieren
sudo pm2 install pm2-logrotate

# Nginx-Logs (automatisch via logrotate)
sudo logrotate -f /etc/logrotate.d/nginx
```

### 3. Backup Strategy

```bash
# Wichtige Verzeichnisse
/var/www/html/app-name/
/etc/nginx/sites-available/default
/root/.pm2/dump.pm2

# Backup-Script
rsync -av /var/www/html/ backup@backup-server:/backups/www/
```

## 🎉 Quick Deploy Checklist

- [ ] Port in PORTS.md reserviert
- [ ] Frontend mit korrekter `homepage` gebaut
- [ ] Backend mit PM2 ecosystem.config.js
- [ ] Files auf VPS hochgeladen
- [ ] Dependencies installiert
- [ ] PM2 Service gestartet
- [ ] Nginx-Config hinzugefügt
- [ ] Nginx syntax getestet und neugeladen
- [ ] Frontend & API getestet
- [ ] Browser-Cache geleert
- [ ] Deployment dokumentiert

## 🔗 Nützliche Commands

```bash
# Schneller SSH-Zugang
alias vps="ssh root@mrx3k1.de"

# PM2 Quick Commands
alias pm2list="ssh root@mrx3k1.de 'sudo pm2 list'"
alias pm2save="ssh root@mrx3k1.de 'sudo pm2 save'"

# Nginx Quick Commands
alias nginxtest="ssh root@mrx3k1.de 'sudo nginx -t'"
alias nginxreload="ssh root@mrx3k1.de 'sudo systemctl reload nginx'"

# Log Monitoring
alias watchnginx="ssh root@mrx3k1.de 'sudo tail -f /var/log/nginx/error.log'"
```

---

*Happy Deploying! 🚀*

**Letzte Aktualisierung**: 2025-07-17  
**VPS**: mrx3k1.de  
**Maintainer**: Martin Pfeffer