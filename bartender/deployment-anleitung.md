# Bartender-App Deployment-Anleitung

Diese Anleitung führt dich durch den Prozess, deine Bartender-App auf dem VPS zu deployen.

## 1. Lokale Vorbereitung

### Korrigierte Dateien

Die Router-Dateien wurden korrigiert, um Routing-Probleme zu vermeiden:
- In `server/routes/drinks.js` wurde die Reihenfolge der Routen angepasst
- In `server/routes/sales.js` wurde die Reihenfolge der Routen angepasst

**Wichtig:** Dynamische Routen (mit `:id` Parameter) müssen nach spezifischen Routen definiert werden.

### Frontend bauen

1. Stelle sicher, dass die `.env.production` Datei die korrekte API-URL enthält:
   ```
   REACT_APP_API_URL=/bartender/api
   ```

2. Führe den Production-Build aus:
   ```bash
   npm run build:prod
   ```
   
   Dies verwendet env-cmd, um die .env.production Umgebungsvariablen zu laden.

3. Der Build wird im `build`-Verzeichnis erstellt.

## 2. Deployment auf dem VPS

### Frontend hochladen

1. Übertrage die Build-Dateien auf den VPS:
   ```bash
   scp -r build/* user@deine-vps:/var/www/html/bartender/build/
   ```

### Backend konfigurieren

1. Übertrage die aktualisierten Server-Dateien:
   ```bash
   # Erstelle ein Archiv ohne node_modules und build
   tar --exclude='node_modules' --exclude='build' -czvf bartender-server.tar.gz .

   # Übertrage das Archiv
   scp bartender-server.tar.gz user@deine-vps:/tmp/

   # Auf dem VPS: Entpacke das Archiv
   ssh user@deine-vps
   cd /var/www/html/bartender
   tar -xzvf /tmp/bartender-server.tar.gz
   ```

2. Erstelle/aktualisiere die `.env.server` Datei auf dem VPS:
   ```
   NODE_ENV=production
   SERVER_PORT=5024
   PORT=5024
   MONGODB_URI=mongodb://mongoAdmin:%23QGwODkgI7fx@localhost:27017/bartender?authSource=admin
   JWT_SECRET=dein_geheimes_jwt_token
   JWT_EXPIRE=30d
   ADMIN_NAME=Admin
   ADMIN_EMAIL=admin@bartender.app
   ADMIN_PASSWORD=admin123
   ```
   
   **Hinweis:** Für das MongoDB-Passwort wird das #-Zeichen als %23 URL-kodiert.

3. Installiere abhängige Pakete:
   ```bash
   cd /var/www/html/bartender
   npm install
   ```

### Server starten

1. Mit PM2 (empfohlen für Produktion):
   ```bash
   # Falls PM2 noch nicht installiert ist
   npm install -g pm2
   
   # Server mit PM2 starten
   pm2 stop bartender
   pm2 start server.js --name "bartender" -- -r dotenv/config dotenv_config_path=.env.server
   
   # PM2 automatisch beim System-Start ausführen
   pm2 startup
   pm2 save
   ```

2. Alternative: Direkt mit dem Start-Skript:
   ```bash
   chmod +x start-server.sh
   ./start-server.sh
   ```

## 3. Testen

1. Öffne die App im Browser:
   ```
   https://deine-domain.de/bartender/
   ```

2. Überprüfe die Server-Logs bei Problemen:
   ```bash
   # PM2 Logs ansehen
   pm2 logs bartender
   
   # Nginx Fehler-Logs prüfen
   tail -f /var/log/nginx/error.log
   ```

## Fehlerbehebung

### Problem: "Missing parameter name" Fehler
Wenn du einen Fehler wie `TypeError: Missing parameter name at 1: https://git.new/pathToRegexpError` siehst:
- Überprüfe die Reihenfolge der Routen in allen Route-Dateien
- Spezifische Routen (wie `/popular/list`) müssen VOR dynamischen Routen (mit `:id`) definiert werden

### Problem: MongoDB-Authentifizierungsfehler
Wenn du einen Fehler wie `Command find requires authentication` siehst:
- Überprüfe die MONGODB_URI in der .env.server Datei
- Stelle sicher, dass Benutzername und Passwort korrekt sind und Sonderzeichen URL-kodiert sind
- Überprüfe, ob die angegebene Datenbank existiert

### Problem: 502 Bad Gateway
Wenn du einen 502-Fehler siehst:
- Überprüfe, ob der Node.js-Server läuft: `ps aux | grep node`
- Überprüfe, ob der Server auf Port 5024 lauscht: `netstat -tlpn | grep 5024`
- Überprüfe die Nginx-Logs: `tail -f /var/log/nginx/error.log`