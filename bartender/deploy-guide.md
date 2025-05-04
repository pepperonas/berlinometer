# Bartender-App Deployment-Anleitung

Diese Anleitung beschreibt, wie du die Bartender-App auf deinem VPS einrichten kannst.

## Voraussetzungen

- Node.js (v14+)
- npm
- MongoDB
- Nginx
- Ein VPS mit Zugriff auf `/var/www/html/bartender`

## 1. Frontend bauen und hochladen

### Auf deinem lokalen System:

1. Erstelle eine `.env.production` Datei im Hauptverzeichnis des Projekts:

```
REACT_APP_API_URL=/bartender/api
```

2. Baue das Frontend:

```bash
npm run build
```

3. Übertrage die erzeugten Build-Dateien auf deinen VPS:

```bash
scp -r build/* benutzer@deine-vps-ip:/var/www/html/bartender/build/
```

## 2. Backend einrichten

### Auf deinem VPS:

1. Stelle sicher, dass das Backend-Verzeichnis vorhanden ist:

```bash
mkdir -p /var/www/html/bartender
```

2. Übertrage die Backend-Dateien (alles außer dem `build`-Verzeichnis und `node_modules`):

```bash
# Beispiel (von deinem lokalen System aus):
rsync -avz --exclude='node_modules' --exclude='build' --exclude='.git' ./ benutzer@deine-vps-ip:/var/www/html/bartender/
```

3. Erstelle auf dem VPS eine `.env.server` Datei im Hauptverzeichnis des Projekts:

```
NODE_ENV=production
SERVER_PORT=5024
PORT=5024
MONGODB_URI=mongodb://localhost:27017/bartender
JWT_SECRET=dein_geheimes_jwt_token
JWT_EXPIRE=30d
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=sicheres_passwort
```

4. Installiere die Abhängigkeiten:

```bash
cd /var/www/html/bartender
npm install
```

5. Mache das Start-Skript ausführbar:

```bash
chmod +x start-server.sh
```

## 3. Nginx konfigurieren

Stelle sicher, dass deine Nginx-Konfiguration die Bartender-App korrekt einrichtet:

```nginx
location /bartender/ {
    alias /var/www/html/bartender/build/;
    try_files $uri $uri/ /bartender/index.html;
    index index.html;
    # Prevent caching of index.html to see app updates immediately
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}

location /bartender/api/ {
    proxy_pass http://localhost:5024/api/;
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
```

Lade die Nginx-Konfiguration neu:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 4. Backend starten

Starte den Server:

```bash
cd /var/www/html/bartender
./start-server.sh
```

Um den Server dauerhaft im Hintergrund laufen zu lassen, kannst du PM2 verwenden:

```bash
# Installiere PM2 falls noch nicht vorhanden
npm install -g pm2

# Starte die App mit PM2
pm2 start server.js --name "bartender" -- -r dotenv/config dotenv_config_path=.env.server

# Starte PM2 automatisch beim Systemstart
pm2 startup
pm2 save
```

## 5. Prüfen

Öffne einen Browser und navigiere zu:
```
http://deine-vps-ip/bartender/
```

## Fehlersuche

Falls die App nicht wie erwartet funktioniert:

1. Überprüfe die Logs:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

2. Überprüfe den Server-Status:
   ```bash
   pm2 logs bartender
   ```

3. Teste die API direkt:
   ```bash
   curl http://localhost:5024/api/health
   ```

4. Prüfe, ob MongoDB läuft:
   ```bash
   sudo systemctl status mongodb
   ```