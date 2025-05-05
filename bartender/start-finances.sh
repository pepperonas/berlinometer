#!/bin/bash

# Start-Skript für Bartender-App mit Finanzen-Modul
# Dieses Skript startet den Server und stellt sicher, dass das Finanzen-Modul korrekt eingerichtet ist.

echo "=== Bartender-App mit Finanzen-Modul starten ==="
echo "Prüfe Finanzen-Konfiguration..."

# Prüfe, ob die notwendigen Dateien existieren
if [ ! -f "./server/models/Expense.js" ] || [ ! -f "./server/models/Income.js" ]; then
  echo "Fehler: Modell-Dateien für Finanzen fehlen!"
  exit 1
fi

if [ ! -f "./server/routes/finances.js" ]; then
  echo "Fehler: Routen-Datei für Finanzen fehlt!"
  exit 1
fi

# Prüfe, ob Node.js installiert ist
if ! command -v node &> /dev/null; then
  echo "Fehler: Node.js ist nicht installiert!"
  exit 1
fi

# Wichtige Information anzeigen
echo
echo "HINWEIS: Dieses Skript kann den Server starten, aber es kann die MongoDB-"
echo "Collections für Finanzen nicht automatisch erstellen, da eine Authentifizierung"
echo "erforderlich ist."
echo
echo "WICHTIG: Um die Finanzen-Collections zu erstellen, gibt es zwei Möglichkeiten:"
echo
echo "1. Direkt mit MongoDB Shell oder MongoDB Compass die Collections erstellen:"
echo "   - Kopiere den Inhalt aus ./server/scripts/finance-queries.txt"
echo "   - Führe diese Abfragen in der MongoDB-Konsole aus"
echo
echo "2. Starte den Server und verwende dann das Setup-Skript mit den richtigen"
echo "   Authentifizierungsinformationen:"
echo "   - node ./server/scripts/setup-finances-direct.js"
echo 
echo "Ist MongoDB bereits korrekt eingerichtet? [j/n]"
read -p "> " response

if [[ "$response" != "j" && "$response" != "J" ]]; then
  echo "Bitte richte MongoDB zuerst ein und führe dieses Skript dann erneut aus."
  exit 1
fi

# Server starten
echo "Starte den Bartender-Server..."
if [ -f "./ecosystem.config.js" ]; then
  # Wenn PM2 vorhanden ist, nutze PM2
  if command -v pm2 &> /dev/null; then
    echo "Starte Server mit PM2..."
    pm2 restart server || pm2 start ecosystem.config.js
  else
    echo "PM2 nicht gefunden, starte Server direkt mit Node..."
    node server.js
  fi
else
  # Ansonsten starte direkt mit Node
  node server.js
fi

echo
echo "Server läuft nun!"
echo
echo "API-Test: http://localhost:5024/api/finances/test"
echo "Frontend: http://localhost:3000/finances"
echo
echo "Um den Finanzen-API-Test auszuführen, führe in einem neuen Terminal aus:"
echo "node ./server/scripts/test-finances-api.js"
echo
echo "Falls die Finanzen-Daten noch nicht in der Datenbank eingerichtet sind,"
echo "kopiere den Inhalt aus ./server/scripts/finance-queries.txt und führe"
echo "ihn in der MongoDB-Konsole aus."