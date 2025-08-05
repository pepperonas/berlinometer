# Instagram Cookie Setup für Authentifizierte Downloads

Um Instagram Videos herunterzuladen, benötigen wir Cookies von einer angemeldeten Instagram-Session.

## 🍪 Cookie-Extraktion - Schnellanleitung

### Methode 1: Browser Extension (Empfohlen)

1. **Extension installieren:**
   - Chrome: [Get cookies.txt](https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid)
   - Firefox: [Get cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/get-cookies-txt/)

2. **Cookies exportieren:**
   - Gehe zu https://instagram.com und logge dich ein
   - Klicke auf das Extension-Icon
   - Klicke "Export" oder "To clipboard"
   - Speichere den Inhalt als `instagram-cookies.txt` im backend-Ordner

### Methode 2: yt-dlp Browser-Cookie Extraktion

```bash
# Direkt vom Browser extrahieren (Chrome)
yt-dlp --cookies-from-browser chrome --write-pages --write-info-json 'https://instagram.com/p/BEISPIEL/'

# Für andere Browser:
# --cookies-from-browser firefox
# --cookies-from-browser safari
# --cookies-from-browser edge
```

### Methode 3: Manuell (Developer Tools)

1. Öffne Instagram.com und logge dich ein
2. Öffne Developer Tools (F12)
3. Gehe zu Application/Storage → Cookies → instagram.com
4. Kopiere die wichtigsten Cookies:
   - `sessionid`
   - `csrftoken` 
   - `ds_user_id`

## 📁 Cookie-Datei Format

Die `instagram-cookies.txt` sollte im Netscape-Format sein:

```
# Netscape HTTP Cookie File
.instagram.com	TRUE	/	TRUE	1756789200	sessionid	DEIN_SESSION_ID
.instagram.com	TRUE	/	FALSE	1756789200	csrftoken	DEIN_CSRF_TOKEN
```

## 🔧 Installation & Test

1. **Cookie-Datei platzieren:**
   ```bash
   # Kopiere deine cookie-datei nach:
   /var/www/html/instagram-dl/backend/instagram-cookies.txt
   ```

2. **Cookie-Validator ausführen:**
   ```bash
   cd /var/www/html/instagram-dl/backend
   node cookie-extractor.js
   ```

3. **Service neu starten:**
   ```bash
   pm2 restart instagram-dl-backend
   ```

## 🔒 Sicherheit

- **Cookies sind vertraulich** - teile sie niemals
- **Cookies ablaufen** - erneuere sie alle 30 Tage
- **Nur für eigene Accounts** - verwende nur deine eigenen Login-Daten
- **Server-Zugriff** - nur vertrauenswürdige Personen sollten Zugriff haben

## ✅ Funktionstest

Nach dem Setup sollten diese Logs erscheinen:
```
Using Instagram cookies for authenticated download
```

Wenn Downloads immer noch fehlschlagen:
- Cookies überprüfen (sind sie aktuell?)
- Instagram-Session erneuern
- Cookie-Format validieren

## 🎯 Erwartung

Mit Cookies funktionieren:
- ✅ Öffentliche Posts
- ✅ Posts von Accounts denen du folgst  
- ✅ Deine eigenen Posts
- ❌ Komplett private Accounts (die du nicht abonniert hast)

## 🔄 Cookie-Aktualisierung

Instagram-Cookies sollten regelmäßig erneuert werden:
```bash
# Prüfe Cookie-Alter
node cookie-extractor.js

# Bei Bedarf neue Cookies extrahieren und ersetzen
```

## 🚨 Troubleshooting

### "HTTP redirect to login page"
- Cookies sind abgelaufen → neue Cookies extrahieren
- Falsche Cookie-Format → Netscape-Format verwenden
- Instagram hat Session invalidiert → neu einloggen

### "No cookies found"
- Datei-Pfad prüfen: `/var/www/html/instagram-dl/backend/instagram-cookies.txt`
- Datei-Berechtigung prüfen: `chmod 644 instagram-cookies.txt`
- Cookie-Format validieren mit `node cookie-extractor.js`

### Immer noch Fehler?
- Instagram kann zusätzliche Anti-Bot-Maßnahmen haben
- Versuche es mit verschiedenen Browser-Cookie-Exporten
- Warte einige Minuten zwischen Versuchen (Rate-Limiting)