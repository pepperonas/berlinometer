#!/bin/bash

# MongoDB-Testskript für Bartender-App auf VPS
# ===========================================

# Farben für die Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}🍸 Bartender MongoDB Test Tool 🍸${NC}"
echo -e "${BLUE}=================================${NC}"

# VPS-Zugangsdaten abfragen
echo -e "${YELLOW}Bitte gib die Zugangsdaten für deinen VPS ein:${NC}"
read -p "VPS-Benutzer (z.B. root): " SSH_USER
read -p "VPS-Adresse (IP oder Domain): " SSH_HOST
read -p "SSH-Port (Standard: 22): " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

# MongoDB-Abfragen auf dem VPS ausführen
echo -e "${YELLOW}Führe MongoDB-Tests auf dem VPS aus...${NC}"

ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'EOF'
    # Farben für die Ausgabe innerhalb der SSH-Sitzung
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'

    # Banner
    echo -e "${BLUE}MongoDB-Testskript wird auf dem VPS ausgeführt...${NC}"
    
    # 1. MongoDB-Status prüfen
    echo -e "${YELLOW}1. Prüfe MongoDB-Status:${NC}"
    if systemctl is-active --quiet mongod; then
        echo -e "${GREEN}MongoDB-Service läuft.${NC}"
    else
        echo -e "${RED}MongoDB-Service läuft nicht!${NC}"
        echo -e "${YELLOW}Starte MongoDB...${NC}"
        systemctl start mongod
        if systemctl is-active --quiet mongod; then
            echo -e "${GREEN}MongoDB wurde erfolgreich gestartet.${NC}"
        else
            echo -e "${RED}MongoDB konnte nicht gestartet werden!${NC}"
            systemctl status mongod
            exit 1
        fi
    fi
    
    # 2. MongoDB-Version anzeigen
    echo -e "${YELLOW}2. MongoDB-Version:${NC}"
    mongo --version
    
    # 3. Datenbankverbindung testen
    echo -e "${YELLOW}3. Teste Verbindung zur MongoDB:${NC}"
    mongo --eval "db.version()" bartender
    
    # 4. Ist die Bartender-Datenbank vorhanden?
    echo -e "${YELLOW}4. Prüfe, ob die Bartender-Datenbank existiert:${NC}"
    mongo --eval "printjson(db.getMongo().getDBNames())" | grep -q "bartender"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Die Bartender-Datenbank existiert.${NC}"
    else
        echo -e "${RED}Die Bartender-Datenbank wurde nicht gefunden!${NC}"
        echo -e "${YELLOW}Verfügbare Datenbanken:${NC}"
        mongo --eval "printjson(db.getMongo().getDBNames())"
    fi
    
    # 5. Prüfe vorhandene Collections in der Bartender-Datenbank
    echo -e "${YELLOW}5. Collections in der Bartender-Datenbank:${NC}"
    mongo bartender --eval "db.getCollectionNames().forEach(function(c) { print(c); })"
    
    # 6. Anzahl der User in der users-Collection anzeigen
    echo -e "${YELLOW}6. Anzahl der Benutzer:${NC}"
    COUNT=$(mongo bartender --eval "printjson(db.users.count())" --quiet)
    echo -e "Es gibt ${GREEN}$COUNT${NC} Benutzer in der Datenbank."
    
    # 7. Benutzer auflisten
    echo -e "${YELLOW}7. Liste aller Benutzer:${NC}"
    mongo bartender --eval "db.users.find({}, {name:1, email:1, role:1, active:1, _id:0}).forEach(printjson)"
    
    # 8. Drinks auflisten
    echo -e "${YELLOW}8. Liste aller Getränke:${NC}"
    mongo bartender --eval "db.drinks.find({}, {name:1, price:1, category:1, _id:0}).forEach(printjson)"
    
    # 9. Speichernutzung der Datenbank
    echo -e "${YELLOW}9. Speichernutzung der Datenbank:${NC}"
    mongo bartender --eval "printjson(db.stats())"
    
    echo -e "${GREEN}MongoDB-Tests abgeschlossen.${NC}"
EOF

# Interaktiver MongoDB-Shell-Zugriff anbieten
echo -e "\n${YELLOW}Möchtest du eine interaktive MongoDB-Shell starten? (j/n)${NC}"
read start_shell

if [ "$start_shell" = "j" ] || [ "$start_shell" = "J" ]; then
    echo -e "${BLUE}Verbinde mit MongoDB-Shell auf dem VPS...${NC}"
    echo -e "${YELLOW}Hinweis: Gib 'exit' ein, um die MongoDB-Shell zu verlassen.${NC}"
    echo -e "${YELLOW}Nützliche Befehle:${NC}"
    echo -e "  ${GREEN}show dbs${NC} - Zeigt alle Datenbanken an"
    echo -e "  ${GREEN}use bartender${NC} - Wechselt zur Bartender-Datenbank"
    echo -e "  ${GREEN}show collections${NC} - Zeigt alle Collections an"
    echo -e "  ${GREEN}db.users.find().pretty()${NC} - Zeigt alle Benutzer an"
    echo -e "  ${GREEN}db.drinks.find().pretty()${NC} - Zeigt alle Getränke an"
    
    ssh -t -p $SSH_PORT $SSH_USER@$SSH_HOST "mongo bartender"
fi

echo -e "\n${GREEN}MongoDB-Test abgeschlossen.${NC}"