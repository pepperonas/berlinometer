#!/bin/bash
# Build-Skript für GlitterHue Electron-App
# Dieses Skript baut die React-App und überträgt sie in die Electron-App

# Farbcodes für Ausgaben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}     GlitterHue Electron Build Tool     ${NC}"
echo -e "${BLUE}==========================================${NC}"

# Prüfen, ob wir im richtigen Verzeichnis sind
if [ ! -f "main.js" ] || [ ! -f "package.json" ]; then
  echo -e "${RED}Fehler: Dieses Skript muss im glitter-hue-electron Verzeichnis ausgeführt werden.${NC}"
  exit 1
fi

# Prüfen, ob das React-Quellverzeichnis existiert
if [ ! -d "../glitter-hue" ]; then
  echo -e "${RED}Fehler: Das React-Quellverzeichnis '../glitter-hue' wurde nicht gefunden.${NC}"
  exit 1
fi

# 1. React-App bauen
echo -e "${YELLOW}1. Baue die React-App...${NC}"
cd ../glitter-hue

# Prüfen, ob npm installiert ist
if ! command -v npm &> /dev/null; then
  echo -e "${RED}Fehler: npm ist nicht installiert. Bitte installiere Node.js und npm.${NC}"
  exit 1
fi

# Installiere React-Abhängigkeiten falls nötig
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installiere React-Abhängigkeiten...${NC}"
  npm install
fi

# Baue die React-App
echo -e "${YELLOW}Führe React build aus...${NC}"
npm run build

# Prüfen, ob der Build erfolgreich war
if [ ! -d "build" ]; then
  echo -e "${RED}Fehler: React-Build fehlgeschlagen. Bitte überprüfe die Fehlermeldungen.${NC}"
  cd ../glitter-hue-electron
  exit 1
fi

echo -e "${GREEN}React-App wurde erfolgreich gebaut.${NC}"

# 2. Zurück zum Electron-Verzeichnis wechseln
cd ../glitter-hue-electron

# 3. Alte Build-Dateien löschen falls vorhanden
echo -e "${YELLOW}2. Lösche alte Build-Dateien...${NC}"
if [ -d "build" ]; then
  rm -rf build
fi

# 4. Build-Dateien kopieren
echo -e "${YELLOW}3. Kopiere Build-Dateien in die Electron-App...${NC}"
mkdir -p build
cp -r ../glitter-hue/build/* build/

# 5. Electron-Abhängigkeiten installieren/aktualisieren
echo -e "${YELLOW}4. Installiere/Aktualisiere Electron-Abhängigkeiten...${NC}"
npm install

# 6. OS-spezifische Icons und Ressourcen kopieren
echo -e "${YELLOW}5. Kopiere Icons und Ressourcen...${NC}"
mkdir -p assets
cp build/logo512.png assets/icon.png

# 7. Fertig
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Build abgeschlossen! Die App kann jetzt mit folgenden Befehlen gestartet werden:${NC}"
echo -e "${BLUE}  npm start${NC}          - Startet die Electron-App"
echo -e "${BLUE}  npm run package-mac${NC}    - Erstellt ein macOS-Paket"
echo -e "${BLUE}  npm run package-win${NC}    - Erstellt ein Windows-Paket"
echo -e "${BLUE}  npm run package-linux${NC}  - Erstellt ein Linux-Paket"
echo -e "${GREEN}=========================================${NC}"
