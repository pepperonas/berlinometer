#!/bin/bash

# Skript zum Erstellen der MongoDB-Datenbank für Bartender
# ======================================================

# Farben für die Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}🍸 Bartender MongoDB Datenbank-Setup 🍸${NC}"
echo -e "${BLUE}=======================================${NC}"

# Modus wählen
echo -e "${YELLOW}Wähle einen Modus:${NC}"
echo -e "1) ${GREEN}Lokaler Modus${NC} - Erstellt die Datenbank auf diesem System"
echo -e "2) ${GREEN}VPS-Modus${NC} - Erstellt die Datenbank auf einem entfernten Server"
read -p "Modus (1 oder 2): " MODE

if [ "$MODE" = "1" ]; then
    # Lokaler Modus
    echo -e "${BLUE}Lokaler Modus ausgewählt.${NC}"
    
    # Prüfen, ob Node.js installiert ist
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Fehler: Node.js ist nicht installiert!${NC}"
        echo -e "${YELLOW}Bitte installieren Sie Node.js: https://nodejs.org/de/download/${NC}"
        exit 1
    fi
    
    # Prüfen, ob das Datenbank-Skript existiert
    if [ ! -f "create-mongodb-db.js" ]; then
        echo -e "${RED}Fehler: Die Datei create-mongodb-db.js wurde nicht gefunden!${NC}"
        echo -e "${YELLOW}Bitte stellen Sie sicher, dass Sie dieses Script im Hauptverzeichnis der Bartender-App ausführen.${NC}"
        exit 1
    fi
    
    # MongoDB-Service prüfen
    echo -e "${YELLOW}Prüfe, ob MongoDB läuft...${colors.reset}"
    if command -v systemctl &> /dev/null && systemctl --all --type service | grep -q "mongod"; then
        if ! systemctl is-active --quiet mongod; then
            echo -e "${YELLOW}MongoDB-Service ist nicht aktiv. Versuche zu starten...${NC}"
            sudo systemctl start mongod
            if systemctl is-active --quiet mongod; then
                echo -e "${GREEN}MongoDB-Service gestartet.${NC}"
            else
                echo -e "${RED}Fehler: MongoDB-Service konnte nicht gestartet werden!${NC}"
                echo -e "${YELLOW}Bitte starten Sie MongoDB manuell und versuchen Sie es erneut.${NC}"
                exit 1
            fi
        else
            echo -e "${GREEN}MongoDB-Service läuft.${NC}"
        fi
    elif pgrep mongod > /dev/null; then
        echo -e "${GREEN}MongoDB-Prozess gefunden.${NC}"
    else
        echo -e "${YELLOW}MongoDB scheint nicht zu laufen oder wurde auf unkonventionelle Weise installiert.${NC}"
        echo -e "${YELLOW}Es wird trotzdem versucht, die Datenbank zu erstellen...${NC}"
    fi
    
    # Datenbank erstellen
    echo -e "${GREEN}Starte Datenbank-Setup...${NC}\n"
    node create-mongodb-db.js
    
    # Exit-Code des letzten Befehls abrufen
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -ne 0 ]; then
        echo -e "\n${RED}Das Datenbank-Setup wurde mit Exit-Code $EXIT_CODE beendet.${NC}"
        echo -e "${YELLOW}Bitte überprüfen Sie die Ausgabe auf Fehler.${NC}"
        exit $EXIT_CODE
    fi
    
    echo -e "\n${GREEN}Datenbank-Setup abgeschlossen!${NC}\n"
    
else
    # VPS-Modus
    echo -e "${BLUE}VPS-Modus ausgewählt.${NC}"
    
    # VPS-Zugangsdaten abfragen
    echo -e "${YELLOW}Bitte gib die Zugangsdaten für deinen VPS ein:${NC}"
    read -p "VPS-Benutzer (z.B. root): " SSH_USER
    read -p "VPS-Adresse (IP oder Domain): " SSH_HOST
    read -p "SSH-Port (Standard: 22): " SSH_PORT
    SSH_PORT=${SSH_PORT:-22}
    
    # Temporäre Datei zum Speichern des Server-Pfads
    TMP_FILE=$(mktemp)
    
    # Ermittle das Installationsverzeichnis der Bartender-App auf dem VPS
    ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "find /var /home /opt -name 'server.js' -not -path \"*/node_modules/*\" 2>/dev/null | head -n 1" > $TMP_FILE
    SERVER_PATH=$(cat $TMP_FILE)
    SERVER_DIR=$(dirname "$SERVER_PATH")
    
    if [ -z "$SERVER_PATH" ]; then
        echo -e "${YELLOW}Bartender-App wurde auf dem VPS nicht gefunden.${NC}"
        
        # Frage nach dem Zielverzeichnis
        read -p "Zielverzeichnis auf dem VPS (z.B. /home/user/bartender): " SERVER_DIR
        
        # Überprüfe, ob das Verzeichnis existiert
        ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "test -d $SERVER_DIR"
        if [ $? -ne 0 ]; then
            echo -e "${RED}Das angegebene Verzeichnis existiert nicht auf dem VPS!${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}Bartender-App gefunden auf dem VPS: $SERVER_DIR${NC}"
    fi
    
    # Entferne temporäre Datei
    rm -f $TMP_FILE
    
    # Lade das Datenbank-Skript hoch
    echo -e "${YELLOW}Lade Datenbank-Skript auf den VPS hoch...${NC}"
    
    scp -P $SSH_PORT create-mongodb-db.js $SSH_USER@$SSH_HOST:$SERVER_DIR/
    if [ $? -ne 0 ]; then
        echo -e "${RED}Fehler beim Hochladen des Datenbank-Skripts!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Datenbank-Skript erfolgreich hochgeladen.${NC}"
    
    # MongoDB-Service prüfen und starten
    echo -e "${YELLOW}Prüfe MongoDB-Status auf dem VPS...${NC}"
    
    ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'EOF'
        if command -v systemctl &> /dev/null && systemctl --all --type service | grep -q "mongod"; then
            if ! systemctl is-active --quiet mongod; then
                echo "MongoDB-Service ist nicht aktiv. Versuche zu starten..."
                sudo systemctl start mongod
                if systemctl is-active --quiet mongod; then
                    echo "MongoDB-Service gestartet."
                else
                    echo "Fehler: MongoDB-Service konnte nicht gestartet werden!"
                    exit 1
                fi
            else
                echo "MongoDB-Service läuft."
            fi
        elif pgrep mongod > /dev/null; then
            echo "MongoDB-Prozess gefunden."
        else
            echo "MongoDB scheint nicht zu laufen oder wurde auf unkonventionelle Weise installiert."
            echo "Installiere MongoDB..."
            
            # Prüfen des Betriebssystems
            if [ -f /etc/os-release ]; then
                . /etc/os-release
                if [ "$ID" = "ubuntu" ] || [ "$ID" = "debian" ]; then
                    # MongoDB-Repository hinzufügen
                    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
                    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
                    sudo apt-get update
                    sudo apt-get install -y mongodb-org
                    
                    # MongoDB starten
                    sudo systemctl start mongod
                    sudo systemctl enable mongod
                    
                    if systemctl is-active --quiet mongod; then
                        echo "MongoDB erfolgreich installiert und gestartet."
                    else
                        echo "Fehler: MongoDB konnte nicht gestartet werden!"
                        exit 1
                    fi
                else
                    echo "Dieses Betriebssystem wird nicht automatisch unterstützt."
                    echo "Bitte installieren Sie MongoDB manuell und führen Sie dieses Skript erneut aus."
                    exit 1
                fi
            else
                echo "Betriebssystem konnte nicht erkannt werden."
                echo "Bitte installieren Sie MongoDB manuell und führen Sie dieses Skript erneut aus."
                exit 1
            fi
        fi
EOF
    
    # Prüfen, ob MongoDB-Setup erfolgreich war
    if [ $? -ne 0 ]; then
        echo -e "${RED}Fehler beim Überprüfen/Starten von MongoDB auf dem VPS!${NC}"
        exit 1
    fi
    
    # Datenbank auf dem VPS erstellen
    echo -e "${YELLOW}Erstelle Datenbank auf dem VPS...${NC}"
    
    ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << EOF
        cd $SERVER_DIR
        echo "Starte Datenbank-Setup..."
        node create-mongodb-db.js
EOF
    
    # Prüfen, ob Datenbank-Setup erfolgreich war
    if [ $? -ne 0 ]; then
        echo -e "${RED}Fehler beim Erstellen der Datenbank auf dem VPS!${NC}"
        exit 1
    fi
    
    echo -e "\n${GREEN}Datenbank wurde erfolgreich auf dem VPS erstellt.${NC}"
    echo -e "${YELLOW}Admin-Zugangsdaten:${NC}"
    echo -e "${YELLOW}E-Mail: admin@bartender.de${NC}"
    echo -e "${YELLOW}Passwort: admin1234${NC}"
    echo -e "\n${CYAN}Bitte ändere das Passwort nach dem ersten Login!${NC}\n"
fi