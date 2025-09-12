#!/bin/bash

# Deployment-Skript für Tor-Check auf VPS
# Verwendung: ./deploy.sh

echo "🚀 Starte Deployment von Tor-Check auf VPS..."

# Konfiguration
VPS_HOST="69.62.121.168"
VPS_USER="root"
VPS_PATH="/var/www/html/tor-check"
LOCAL_PATH="."

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fehlerbehandlung
set -e
trap 'echo -e "${RED}❌ Deployment fehlgeschlagen!${NC}"; exit 1' ERR

echo -e "${YELLOW}📝 Überprüfe Dateien...${NC}"
if [ ! -f "server.js" ] || [ ! -f "package.json" ] || [ ! -f "index.html" ]; then
    echo -e "${RED}❌ Erforderliche Dateien fehlen!${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Erstelle Deployment-Paket...${NC}"
# Temporäres Verzeichnis erstellen
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Dateien kopieren
cp server.js "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp ecosystem.config.js "$TEMP_DIR/"
cp index.html "$TEMP_DIR/"

# README für Deployment erstellen
cat > "$TEMP_DIR/DEPLOYMENT_INFO.md" << EOF
# Tor-Check Deployment Info

Deployed: $(date)
Version: $(grep '"version"' package.json | cut -d'"' -f4)
Server: $VPS_HOST
Path: $VPS_PATH

## Nach dem Deployment:

1. npm install
2. pm2 start ecosystem.config.js
3. Nginx-Konfiguration überprüfen
4. Logs überwachen: pm2 logs tor-check

## Verfügbare Endpunkte:

- http://$VPS_HOST:3010/ - Hauptseite
- http://$VPS_HOST:3010/api/client-info - Client-Informationen
- http://$VPS_HOST:3010/api/geoip - GeoIP-Daten
- http://$VPS_HOST:3010/api/logs - Request-Logs
- http://$VPS_HOST:3010/api/status - Server-Status
EOF

echo -e "${YELLOW}🔗 Verbinde zu VPS...${NC}"
# SSH-Verbindung testen
ssh -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "echo 'SSH-Verbindung erfolgreich'" || {
    echo -e "${RED}❌ SSH-Verbindung fehlgeschlagen!${NC}"
    exit 1
}

echo -e "${YELLOW}📁 Erstelle Verzeichnisstruktur auf VPS...${NC}"
ssh "$VPS_USER@$VPS_HOST" "
    mkdir -p $VPS_PATH/logs
    mkdir -p /var/log/tor-check
"

echo -e "${YELLOW}📤 Übertrage Dateien...${NC}"
# rsync für efiziente Übertragung
rsync -avz --progress "$TEMP_DIR/" "$VPS_USER@$VPS_HOST:$VPS_PATH/"

echo -e "${YELLOW}🔧 Installiere Abhängigkeiten...${NC}"
ssh "$VPS_USER@$VPS_HOST" "
    cd $VPS_PATH
    npm install --production
"

echo -e "${YELLOW}🛠️ Konfiguriere PM2...${NC}"
ssh "$VPS_USER@$VPS_HOST" "
    cd $VPS_PATH
    
    # Stoppe eventuell laufende Instanz
    pm2 stop tor-check 2>/dev/null || true
    pm2 delete tor-check 2>/dev/null || true
    
    # Starte neue Instanz
    pm2 start ecosystem.config.js
    pm2 save
    
    # Status anzeigen
    pm2 status tor-check
"

echo -e "${YELLOW}🌐 Konfiguriere Nginx (falls nötig)...${NC}"
ssh "$VPS_USER@$VPS_HOST" "
    # Nginx-Konfiguration für Reverse Proxy erstellen
    cat > /etc/nginx/sites-available/tor-check << 'EOF_NGINX'
server {
    listen 80;
    server_name tor-check.mrx3k1.de;
    
    location / {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Wichtig für Anonymitäts-Tests
        proxy_set_header X-Original-IP \$remote_addr;
    }
    
    # Logs für Analyse
    access_log /var/log/nginx/tor-check.access.log;
    error_log /var/log/nginx/tor-check.error.log;
}
EOF_NGINX

    # Nginx-Konfiguration aktivieren (optional)
    # ln -sf /etc/nginx/sites-available/tor-check /etc/nginx/sites-enabled/
    # nginx -t && systemctl reload nginx
    
    echo 'Nginx-Konfiguration erstellt (nicht aktiviert)'
"

echo -e "${YELLOW}🔍 Teste Deployment...${NC}"
sleep 3

# HTTP-Test
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$VPS_HOST:3010/" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ HTTP-Test erfolgreich (Status: $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ HTTP-Test fehlgeschlagen (Status: $HTTP_CODE)${NC}"
fi

# API-Test
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$VPS_HOST:3010/api/status" || echo "000")
if [ "$API_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API-Test erfolgreich (Status: $API_CODE)${NC}"
else
    echo -e "${RED}❌ API-Test fehlgeschlagen (Status: $API_CODE)${NC}"
fi

echo -e "${YELLOW}📊 Deployment-Zusammenfassung:${NC}"
ssh "$VPS_USER@$VPS_HOST" "
    cd $VPS_PATH
    echo '📁 Pfad: $VPS_PATH'
    echo '📦 Dateien:'
    ls -la
    echo ''
    echo '🔄 PM2-Status:'
    pm2 status tor-check
    echo ''
    echo '💾 Speicherverbrauch:'
    pm2 show tor-check | grep memory || true
"

echo -e "${GREEN}🎉 Deployment erfolgreich abgeschlossen!${NC}"
echo -e "${GREEN}🌐 Tor-Check ist verfügbar unter:${NC}"
echo -e "   ${YELLOW}• Direkt: http://$VPS_HOST:3010/${NC}"
echo -e "   ${YELLOW}• Subdomain: http://tor-check.$VPS_HOST${NC} (wenn Nginx konfiguriert)"
echo ""
echo -e "${YELLOW}📋 Nützliche Befehle:${NC}"
echo -e "   ${YELLOW}• Logs anzeigen: ssh $VPS_USER@$VPS_HOST 'pm2 logs tor-check'${NC}"
echo -e "   ${YELLOW}• Neustart: ssh $VPS_USER@$VPS_HOST 'pm2 restart tor-check'${NC}"
echo -e "   ${YELLOW}• Status: ssh $VPS_USER@$VPS_HOST 'pm2 status tor-check'${NC}"
echo ""
echo -e "${GREEN}✨ Happy Testing!${NC}"