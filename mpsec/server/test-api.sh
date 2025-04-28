#!/bin/bash
# API-Test-Skript für MPSec

# Farben für Ausgabe
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}MPSec API-Test${NC}"
echo "================="

# Teste verschiedene API-Endpunkte
echo -e "\n${YELLOW}Teste Login-Endpunkte:${NC}"

# Test 1: Direkter API-Aufruf auf Standardport
echo -e "\n${YELLOW}Test 1:${NC} http://localhost:5012/api/auth/login"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"martin","password":"hallo123"}' \
  http://localhost:5012/api/auth/login | jq . 2>/dev/null || echo "Fehler: Endpunkt nicht erreichbar oder kein JSON zurückgegeben"

# Test 2: Über mpsec-Pfad
echo -e "\n${YELLOW}Test 2:${NC} http://localhost:5012/mpsec/api/auth/login"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"martin","password":"hallo123"}' \
  http://localhost:5012/mpsec/api/auth/login | jq . 2>/dev/null || echo "Fehler: Endpunkt nicht erreichbar oder kein JSON zurückgegeben"

# Test 3: Über nginx mit Port 80
echo -e "\n${YELLOW}Test 3:${NC} http://localhost/mpsec/api/auth/login"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"martin","password":"hallo123"}' \
  http://localhost/mpsec/api/auth/login | jq . 2>/dev/null || echo "Fehler: Endpunkt nicht erreichbar oder kein JSON zurückgegeben"

# Teste Serverzeit-Endpunkt (benötigt gültiges Token)
echo -e "\n${YELLOW}Teste Serverzeit-Endpunkt:${NC}"
echo "Bitte gib ein gültiges Token ein (oder drücke Enter zum Überspringen):"
read -r TOKEN

if [ -n "$TOKEN" ]; then
  echo -e "\n${YELLOW}Serverzeit-Test:${NC} http://localhost:5012/api/tokens/servertime"
  curl -s \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:5012/api/tokens/servertime | jq . 2>/dev/null || echo "Fehler: Endpunkt nicht erreichbar oder kein JSON zurückgegeben"
fi

echo -e "\n${YELLOW}Hinweis:${NC} Wenn einer der Tests erfolgreich ist, nutze diesen Endpunkt für deine Frontend-Konfiguration."
echo "Prüfe in client/src/services/api.js, ob die baseURL korrekt ist."