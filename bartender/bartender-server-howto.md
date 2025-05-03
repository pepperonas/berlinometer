# Backend-Server für Bartender-App hosten

## Überblick

Die Bartender-App besteht aus zwei Teilen:
1. **Frontend**: React-App (bereits in `/var/www/html/bartender/build/` deployt)
2. **Backend**: Node.js/Express-Server (noch nicht deployt)

Die Frontend-App ist bereits konfiguriert und funktioniert. Der Backend-Server muss noch gestartet werden, um API-Endpunkte bereitzustellen.

## Server einrichten

### 1. Abhängigkeiten installieren

Bevor du den Server starten kannst, musst du die benötigten Node.js-Pakete installieren:

```bash
cd /var/www/html/bartender
npm install express cors path
```

### 2. Server-Datei übertragen

Die `server.js` Datei ist ein einfacher Express-Server mit zwei API-Endpunkten:
- `/api/health`: Gibt Status des Servers zurück
- `/api/info`: Gibt Basisinformationen zur App zurück

Du kannst die Datei direkt auf deinen Server übertragen oder sie dort erstellen.

### 3. Server mit PM2 starten

Der Server verwendet den Port 5024, wie in der nginx-Konfiguration definiert. Starte ihn mit PM2 für Prozess-Management:

```bash
# PM2 installieren, falls noch nicht vorhanden
npm install -g pm2

# Server starten
cd /var/www/html/bartender
pm2 start server.js --name "bartender"

# Server automatisch bei Neustart starten
pm2 save
pm2 startup
```

Alternativ kannst du die vorhandene `ecosystem.config.js` Datei verwenden:

```bash
cd /var/www/html/bartender
pm2 start ecosystem.config.js
```

### 4. Nginx-Konfiguration prüfen

Deine nginx-Konfiguration leitet bereits Anfragen an `/bartender/api/` an den lokalen Server weiter:

```nginx
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

### 5. API testen

Nach dem Start des Servers kannst du testen, ob die API funktioniert:

```bash
curl http://localhost:5024/api/health
curl http://deine-domain.com/bartender/api/health
```

## Hinweise zur Weiterentwicklung

Aktuell verwendet die App Mockdaten in `src/services/mockData.js` und `src/services/api.js`. 

Um in Zukunft echte Daten zu verwenden:
1. Erweitere den Express-Server um weitere API-Endpunkte
2. Verbinde den Server mit einer Datenbank (z.B. MongoDB)
3. Aktualisiere die API-Aufrufe im Frontend, um die Server-Endpunkte zu nutzen

## Fehlersuche

Wenn der Server nicht erreichbar ist:
1. Prüfe, ob der Server läuft: `pm2 list`
2. Prüfe die Logs: `pm2 logs bartender`
3. Prüfe, ob Port 5024 offen ist: `netstat -tulpn | grep 5024`
4. Prüfe die nginx-Konfiguration: `nginx -t`
5. Prüfe die nginx-Logs: `tail -f /var/log/nginx/error.log`