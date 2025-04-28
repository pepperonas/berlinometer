#!/bin/bash
# Dieses Skript prüft, ob der MPSec-Server korrekt funktioniert

echo "===== MPSec Server-Diagnose ====="
echo "Prüfe Voraussetzungen..."

# 1. Prüfe, ob MongoDB läuft
echo -n "MongoDB Status: "
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.version()" --quiet &> /dev/null; then
        echo "Läuft"
    else
        echo "FEHLER - MongoDB scheint nicht zu laufen"
        echo "Starte MongoDB mit: sudo systemctl start mongod"
    fi
else
    echo "FEHLER - MongoDB CLI nicht gefunden"
fi

# 2. Prüfe, ob Node.js installiert ist
echo -n "Node.js Version: "
if command -v node &> /dev/null; then
    node -v
else
    echo "FEHLER - Node.js nicht gefunden"
fi

# 3. Prüfe, ob .env Datei existiert
echo -n ".env Datei: "
if [ -f "server/.env" ]; then
    echo "Gefunden"
    # Prüfe, ob wichtige Umgebungsvariablen gesetzt sind
    if grep -q "MONGO_URI" "server/.env" && grep -q "JWT_SECRET" "server/.env"; then
        echo "Wichtige Umgebungsvariablen gefunden"
    else
        echo "WARNUNG - Wichtige Umgebungsvariablen fehlen in .env"
    fi
else
    echo "FEHLER - .env Datei fehlt im server-Verzeichnis"
    echo "Erstelle eine .env Datei basierend auf dem Beispiel in der README"
fi

# 4. Prüfe, ob Server läuft
echo -n "Server Status: "
if lsof -i:5012 &> /dev/null; then
    echo "Läuft auf Port 5012"
else
    echo "FEHLER - Kein Prozess hört auf Port 5012"
    echo "Starte den Server mit: cd server && npm run dev"
fi

# 5. Teste API-Erreichbarkeit
echo -n "API-Erreichbarkeit: "
if command -v curl &> /dev/null; then
    if curl -s http://localhost:5012/api/ping > /dev/null; then
        echo "OK - /api/ping ist erreichbar"
    else
        echo "FEHLER - API nicht erreichbar"
        echo "Prüfe Server-Logs für weitere Informationen"
    fi
else
    echo "Übersprungen - curl nicht installiert"
fi

echo -e "\n===== Client-Konfiguration ====="
# 6. Prüfe proxy in package.json
echo -n "Proxy Konfiguration: "
if grep -q "\"proxy\": \"http://localhost:5012\"" "client/package.json"; then
    echo "Korrekt"
else
    echo "WARNUNG - Proxy möglicherweise falsch konfiguriert"
    echo "Die Zeile 'proxy': 'http://localhost:5012' sollte in client/package.json sein"
fi

echo -e "\n===== Diagnose abgeschlossen ====="
echo "Falls Probleme bestehen, versuche folgende Schritte:"
echo "1. Starte MongoDB, falls nicht aktiv: sudo systemctl start mongod"
echo "2. Starte den Server neu: cd server && npm run dev"
echo "3. Starte den Client neu: cd client && npm start"
echo "4. Prüfe .env-Datei auf korrekte Konfiguration"
echo "5. Prüfe die CORS-Konfiguration in server/app.js"