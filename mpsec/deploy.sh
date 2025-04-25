#!/bin/bash

# MPSec Deployment-Skript für VPS
# Nutzung: ./deploy.sh [vps_benutzer] [vps_adresse] [vps_port] [vps_zielverzeichnis]

# Beispiel: ./deploy.sh user 123.456.789.0 22 /var/www/mpsec

set -e  # Script beenden, wenn ein Befehl fehlschlägt

# Parameter überprüfen
if [ "$#" -ne 4 ]; then
    echo "Fehler: Falsche Anzahl an Parametern."
    echo "Nutzung: ./deploy.sh [vps_benutzer] [vps_adresse] [vps_port] [vps_zielverzeichnis]"
    exit 1
fi

VPS_USER=$1
VPS_HOST=$2
VPS_PORT=$3
VPS_DIR=$4

# Farben für Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starte Deployment von MPSec auf VPS...${NC}"

# 1. Frontend bauen
echo -e "${GREEN}1. Frontend wird gebaut...${NC}"
cd client
npm ci
npm run build
cd ..

# 2. Backend-Abhängigkeiten installieren
echo -e "${GREEN}2. Backend-Abhängigkeiten werden installiert...${NC}"
cd server
npm ci --production
cd ..

# 3. Env-Datei für Produktion vorbereiten
echo -e "${GREEN}3. Umgebungsvariablen werden für Produktion angepasst...${NC}"
# Hier können zusätzliche Einstellungen für die Produktionsumgebung vorgenommen werden

# 4. Alles in ein Verzeichnis für den Upload packen
echo -e "${GREEN}4. Dateien werden für Upload vorbereitet...${NC}"
mkdir -p deploy
cp -r server deploy/
cp -r client/build deploy/public

# 5. Auf VPS hochladen
echo -e "${GREEN}5. Dateien werden auf VPS hochgeladen...${NC}"
scp -P $VPS_PORT -r deploy/* $VPS_USER@$VPS_HOST:$VPS_DIR

# 6. Aufräumen
echo -e "${GREEN}6. Temporäre Dateien werden gelöscht...${NC}"
rm -rf deploy

echo -e "${GREEN}Deployment abgeschlossen!${NC}"
echo -e "${YELLOW}Hinweis: Stelle sicher, dass auf dem VPS der Node.js-Server konfiguriert ist und läuft.${NC}"
echo -e "${YELLOW}Du kannst PM2 verwenden, um den Node.js-Server zu verwalten:${NC}"
echo -e "   ssh -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $VPS_DIR && pm2 restart app.js || pm2 start app.js --name=\"mpsec\"'"
