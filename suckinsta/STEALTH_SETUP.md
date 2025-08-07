# Instagram Anti-Detection Setup

## 🚨 Problem
Instagram erkennt automatisierte Downloads und blockiert Accounts.

## 🛡️ Lösungsansätze

### 1. Neue Cookies mit separatem Account

```bash
# 1. Erstelle einen neuen Instagram Account (oder nutze einen wenig genutzten)
# 2. Nutze einen anderen Browser/Inkognito Modus
# 3. Logge dich nur für Cookie-Export ein, dann sofort wieder aus
# 4. Exportiere Cookies mit "Get cookies.txt LOCALLY" Extension

# Alte Cookies löschen
ssh root@mrx3k1.de "rm /var/www/html/suckinsta/backend/instagram-cookies.txt"

# Neue Cookies hochladen
scp neue-instagram-cookies.txt root@mrx3k1.de:/var/www/html/suckinsta/backend/instagram-cookies.txt

# Service neu starten
ssh root@mrx3k1.de "pm2 restart suckinsta-backend"
```

### 2. Proxy/VPN Rotation

```bash
# Optional: Proxies verwenden
# In server.js erweitern:
'--proxy', 'http://proxy-server:port'
```

### 3. Multiple Cookie Rotation

Erstelle mehrere Cookie-Dateien und rotiere zwischen ihnen:

```javascript
// In server.js hinzufügen:
const cookieFiles = [
    'instagram-cookies-1.txt',
    'instagram-cookies-2.txt', 
    'instagram-cookies-3.txt'
];

const randomCookieFile = cookieFiles[Math.floor(Math.random() * cookieFiles.length)];
const cookieFilePath = path.join(__dirname, randomCookieFile);
```

### 4. Alternative: Ohne Cookies

Für öffentliche Posts funktioniert auch ohne Login:

```bash
ssh root@mrx3k1.de "rm /var/www/html/suckinsta/backend/instagram-cookies.txt"
```

### 5. Mobile User Agents

```javascript
// Mobile User Agents hinzufügen:
const mobileUserAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
];
```

## 📊 Überwachung

```bash
# Logs überwachen auf Blockierungen
ssh root@mrx3k1.de "pm2 logs suckinsta-backend | grep -i 'error\|block\|forbidden'"

# Request-Rate überwachen
ssh root@mrx3k1.de "tail -f /var/log/nginx/access.log | grep suckinsta"
```

## 🔄 Cookie Update Prozess

1. **Account vorbereiten:**
   - Separaten Instagram Account verwenden
   - Nicht für normale Nutzung verwenden
   - Nur zum Cookie-Export einloggen

2. **Cookie Export:**
   - Browser Extension "Get cookies.txt LOCALLY" installieren
   - Instagram.com besuchen und einloggen
   - Cookies exportieren (Netscape Format)
   - Sofort wieder ausloggen

3. **Deployment:**
   ```bash
   # Alte Cookies sichern
   ssh root@mrx3k1.de "cp /var/www/html/suckinsta/backend/instagram-cookies.txt /var/www/html/suckinsta/backend/instagram-cookies-backup.txt"
   
   # Neue Cookies hochladen
   scp fresh-instagram-cookies.txt root@mrx3k1.de:/var/www/html/suckinsta/backend/instagram-cookies.txt
   
   # Service neu starten
   ssh root@mrx3k1.de "pm2 restart suckinsta-backend"
   
   # Testen
   curl -s "https://mrx3k1.de/api/health"
   ```

## ⚠️ Wichtige Hinweise

- **Rate Limiting:** Nur 3 Downloads pro Minute (bereits implementiert)
- **Random Delays:** 1-5 Sekunden zwischen Requests (implementiert)
- **User Agent Rotation:** Verschiedene Browser simulieren (implementiert)
- **Separate Accounts:** Niemals deinen Haupt-Instagram Account verwenden
- **VPN/Proxy:** Optional für zusätzliche Anonymität

## 🧪 Test nach Update

```bash
# Backend Updates deployen
rsync -avz /Users/martin/WebstormProjects/mrx3k1/suckinsta/backend/ root@mrx3k1.de:/var/www/html/suckinsta/backend/
ssh root@mrx3k1.de "pm2 restart suckinsta-backend"

# Funktionalität testen
curl -X POST https://mrx3k1.de/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.instagram.com/p/PUBLIC_POST_ID/"}'
```