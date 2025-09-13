# 🚀 Berlinometer Deployment Anleitung

## Überblick
Diese Anleitung beschreibt das korrekte Deployment der mehrsprachigen Berlinometer React-App auf den VPS.

## ⚠️ KRITISCHE INFORMATIONEN

### Server Details
- **VPS IP**: `69.62.121.168`
- **User**: `root`
- **Ziel-Domain**: `berlinometer.de`
- **Deployment-Pfad**: `/var/www/html/popular-times/`

### ⚠️ NIEMALS DEPLOYEN NACH:
- ❌ `/var/www/html/` (WEB ROOT) - überschreibt die Hauptseite!
- ❌ `192.168.2.134` (Raspberry Pi Weather Station)
- ❌ `/tmp/` Verzeichnisse für finales Deployment

## 🔧 Build-Konfigurationen

### 1. Standard Build (mrx3k1.de/popular-times)
```bash
npm run build
```
- **Output**: `build/`
- **Asset-Pfade**: `/popular-times/assets/`
- **Verwendung**: Für mrx3k1.de Subdirectory

### 2. Berlinometer Build (berlinometer.de)
```bash
npx vite build --config vite.config.berlinometer.js
```
- **Output**: `build-berlinometer/`
- **Asset-Pfade**: `/assets/` (relativ)
- **Verwendung**: Für berlinometer.de Root-Domain

## 📦 Korrektes Deployment-Verfahren

### Schritt 1: Build erstellen
```bash
# Navigiere zum Projekt-Ordner
cd /Users/martin/WebstormProjects/mrx3k1/popular-times/webapp

# Berlinometer Build (für berlinometer.de)
npx vite build --config vite.config.berlinometer.js
```

### Schritt 2: Direktes Deployment
```bash
# ✅ KORREKT: Direkt zum Zielverzeichnis
scp -r build-berlinometer/* root@69.62.121.168:/var/www/html/popular-times/
```

### ❌ FALSCHE Deployment-Wege (NICHT VERWENDEN):
```bash
# FALSCH: Über Zwischenschritt
scp -r build-berlinometer/* root@69.62.121.168:/tmp/berlinometer-build/
ssh root@69.62.121.168 "rsync -avz /tmp/berlinometer-build/ /var/www/html/popular-times/"

# FALSCH: Ins Web Root (zerstört Hauptseite!)
scp -r build-berlinometer/* root@69.62.121.168:/var/www/html/
```

## 🔍 Deployment-Verifikation

### 1. HTTP Status Check
```bash
curl -s -w "%{http_code}" https://berlinometer.de/ | tail -1
# Erwartetes Ergebnis: 200
```

### 2. Asset-Pfade Check
```bash
curl -s https://berlinometer.de/ | grep -o 'src="/assets/[^"]*"'
# Erwartetes Ergebnis: src="/assets/index-XXXXXX.js"
```

### 3. Browser DevTools Check
- Öffne https://berlinometer.de/
- DevTools → Console
- ❌ Keine 404-Fehler für CSS/JS
- ❌ Keine JavaScript Runtime Errors
- ✅ "SW registered" sollte erscheinen

## 🌍 Mehrsprachigkeit

### Version-Aktualisierung
Bei neuen Deployments Version in `src/App.jsx` aktualisieren:
```javascript
// Cache bust: v2.X.X-description
// Footer Version:
v2.X.X
```

### Sprachtest
1. Öffne User Profile → Language Tab
2. Wechsle zwischen Deutsch/English
3. Prüfe alle UI-Komponenten:
   - ✅ MoodBarometer
   - ✅ ResultsDisplay
   - ✅ AuthDialog
   - ✅ Theme-Beschreibungen

## 🚨 Troubleshooting

### Problem: 500 Internal Server Error
```bash
# Check nginx status
ssh root@69.62.121.168 "nginx -t && systemctl status nginx"

# Check nginx error logs
ssh root@69.62.121.168 "tail -10 /var/log/nginx/error.log"
```

### Problem: 404 Asset Errors
- **Ursache**: Falsche Asset-Pfade (meist `/popular-times/assets/` statt `/assets/`)
- **Lösung**: Berlinometer-Build verwenden (`vite.config.berlinometer.js`)

### Problem: JavaScript Runtime Errors
- **Häufige Ursache**: Variablen vor Initialisierung verwendet
- **Debugging**: Browser DevTools → Console
- **Lösung**: Variable-Deklarationen nach oben verschieben

## 📁 Nginx-Konfiguration

### Berlinometer nginx config
```nginx
# /etc/nginx/sites-enabled/berlinometer.de
server {
    server_name berlinometer.de www.berlinometer.de;
    root /var/www/html/popular-times;  # ← WICHTIG!
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔄 Deployment-Workflow Zusammenfassung

1. **Code ändern** in `/webapp/src/`
2. **Berlinometer build**: `npx vite build --config vite.config.berlinometer.js`
3. **Direkt deployen**: `scp -r build-berlinometer/* root@69.62.121.168:/var/www/html/popular-times/`
4. **Testen**: https://berlinometer.de/
5. **Bei Problemen**: Browser DevTools + nginx logs checken

## ✅ Erfolgreiche Deployments

- **v2.3.0** (2025-09-13): Vollständige Mehrsprachigkeit
- **Hotfix** (2025-09-13): MoodBarometer Variable-Reihenfolge Fix

---

**Erstellt**: 2025-09-13  
**Letztes Update**: 2025-09-13  
**Status**: Funktional ✅