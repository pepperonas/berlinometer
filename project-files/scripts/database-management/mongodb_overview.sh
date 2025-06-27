#!/bin/bash

# MongoDB Database Overview Script
# Für macOS/Linux/Ubuntu

echo "=== MongoDB Database Overview ==="
echo "Datum: $(date)"
echo

# Farben für bessere Lesbarkeit
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# MongoDB Service Status prüfen
echo -e "${BLUE}1. MongoDB Service Status:${NC}"
if systemctl is-active --quiet mongod 2>/dev/null; then
    echo -e "${GREEN}✓ MongoDB läuft (systemd)${NC}"
elif brew services list | grep mongodb | grep started >/dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB läuft (Homebrew)${NC}"
elif pgrep mongod >/dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB läuft${NC}"
else
    echo -e "${RED}✗ MongoDB läuft nicht oder nicht erkannt${NC}"
fi
echo

# MongoDB-Verbindung testen
echo -e "${BLUE}2. MongoDB-Verbindung:${NC}"
echo "Standard-Verbindung (localhost:27017) oder custom? [Enter für Standard, oder URI eingeben]:"
read MONGO_URI

if [ -z "$MONGO_URI" ]; then
    MONGO_URI="mongodb://localhost:27017"
fi

# Test ob mongosh verfügbar ist
if command -v mongosh >/dev/null 2>&1; then
    MONGO_CMD="mongosh"
elif command -v mongo >/dev/null 2>&1; then
    MONGO_CMD="mongo"
else
    echo -e "${RED}✗ Weder mongosh noch mongo CLI gefunden${NC}"
    exit 1
fi

# Verbindung testen
if $MONGO_CMD "$MONGO_URI" --eval "db.runCommand('ping')" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Verbindung erfolgreich${NC}"
else
    echo -e "${RED}✗ Verbindung fehlgeschlagen${NC}"
    echo "Versuche ohne Authentifizierung..."
    if $MONGO_CMD --eval "db.runCommand('ping')" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Lokale Verbindung erfolgreich${NC}"
        MONGO_URI=""
    else
        exit 1
    fi
fi
echo

# Alle Datenbanken anzeigen
echo -e "${BLUE}3. Alle Datenbanken:${NC}"
if [ -z "$MONGO_URI" ]; then
    databases=$($MONGO_CMD --quiet --eval "db.adminCommand('listDatabases').databases.forEach(function(db){ print(db.name + ' (' + (db.sizeOnDisk/1024/1024).toFixed(2) + ' MB)') })")
else
    databases=$($MONGO_CMD "$MONGO_URI" --quiet --eval "db.adminCommand('listDatabases').databases.forEach(function(db){ print(db.name + ' (' + (db.sizeOnDisk/1024/1024).toFixed(2) + ' MB)') })")
fi

echo "$databases" | grep -v "admin\|config\|local" | while read line; do
    if [ ! -z "$line" ]; then
        echo -e "${GREEN}- $line${NC}"
    fi
done
echo

# MongoDB-Benutzer anzeigen
echo -e "${BLUE}4. MongoDB-Benutzer:${NC}"
if [ -z "$MONGO_URI" ]; then
    $MONGO_CMD --quiet --eval "
        try {
            db.getSiblingDB('admin').getUsers().forEach(function(user) {
                print('Admin DB - User: ' + user.user + ', Roles: ' + JSON.stringify(user.roles));
            });
        } catch(e) {
            print('Keine Admin-Rechte oder keine Benutzer in admin DB');
        }
    "
else
    $MONGO_CMD "$MONGO_URI" --quiet --eval "
        try {
            db.getSiblingDB('admin').getUsers().forEach(function(user) {
                print('Admin DB - User: ' + user.user + ', Roles: ' + JSON.stringify(user.roles));
            });
        } catch(e) {
            print('Keine Admin-Rechte oder keine Benutzer in admin DB');
        }
    "
fi
echo

# Collections pro Datenbank
echo -e "${BLUE}5. Collections pro Datenbank:${NC}"
if [ -z "$MONGO_URI" ]; then
    db_names=$($MONGO_CMD --quiet --eval "db.adminCommand('listDatabases').databases.forEach(function(db){ if(db.name != 'admin' && db.name != 'config' && db.name != 'local') print(db.name) })")
else
    db_names=$($MONGO_CMD "$MONGO_URI" --quiet --eval "db.adminCommand('listDatabases').databases.forEach(function(db){ if(db.name != 'admin' && db.name != 'config' && db.name != 'local') print(db.name) })")
fi

for db_name in $db_names; do
    if [ ! -z "$db_name" ]; then
        echo -e "${YELLOW}Datenbank: $db_name${NC}"
        
        if [ -z "$MONGO_URI" ]; then
            collections=$($MONGO_CMD --quiet --eval "
                db.getSiblingDB('$db_name').getCollectionNames().forEach(function(col) {
                    var count = db.getSiblingDB('$db_name').getCollection(col).countDocuments();
                    print('  - ' + col + ' (' + count + ' Dokumente)');
                });
            ")
        else
            collections=$($MONGO_CMD "$MONGO_URI" --quiet --eval "
                db.getSiblingDB('$db_name').getCollectionNames().forEach(function(col) {
                    var count = db.getSiblingDB('$db_name').getCollection(col).countDocuments();
                    print('  - ' + col + ' (' + count + ' Dokumente)');
                });
            ")
        fi
        
        echo "$collections"
        echo
    fi
done

# MongoDB-Konfiguration
echo -e "${BLUE}6. MongoDB-Konfiguration:${NC}"
if [ -z "$MONGO_URI" ]; then
    config_info=$($MONGO_CMD --quiet --eval "
        var config = db.adminCommand('getCmdLineOpts');
        print('Version: ' + db.version());
        print('Port: ' + (config.parsed && config.parsed.net && config.parsed.net.port ? config.parsed.net.port : '27017'));
        print('Storage Engine: ' + db.serverStatus().storageEngine.name);
        print('Auth enabled: ' + (config.parsed && config.parsed.security && config.parsed.security.authorization ? 'Yes' : 'No'));
    ")
else
    config_info=$($MONGO_CMD "$MONGO_URI" --quiet --eval "
        var config = db.adminCommand('getCmdLineOpts');
        print('Version: ' + db.version());
        print('Port: ' + (config.parsed && config.parsed.net && config.parsed.net.port ? config.parsed.net.port : '27017'));
        print('Storage Engine: ' + db.serverStatus().storageEngine.name);
        print('Auth enabled: ' + (config.parsed && config.parsed.security && config.parsed.security.authorization ? 'Yes' : 'No'));
    ")
fi

echo "$config_info"
echo

# Aktive Verbindungen
echo -e "${BLUE}7. Aktive Verbindungen:${NC}"
if [ -z "$MONGO_URI" ]; then
    $MONGO_CMD --quiet --eval "
        try {
            db.adminCommand('currentOp').inprog.forEach(function(op) {
                if(op.client) {
                    print('Client: ' + op.client + ', DB: ' + (op.ns ? op.ns.split('.')[0] : 'N/A'));
                }
            });
        } catch(e) {
            print('Keine Berechtigung für currentOp oder keine aktiven Operationen');
        }
    "
else
    $MONGO_CMD "$MONGO_URI" --quiet --eval "
        try {
            db.adminCommand('currentOp').inprog.forEach(function(op) {
                if(op.client) {
                    print('Client: ' + op.client + ', DB: ' + (op.ns ? op.ns.split('.')[0] : 'N/A'));
                }
            });
        } catch(e) {
            print('Keine Berechtigung für currentOp oder keine aktiven Operationen');
        }
    "
fi
echo

# Indizes pro Collection (nur für erste 3 Collections pro DB)
echo -e "${BLUE}8. Indizes (erste 3 Collections pro DB):${NC}"
for db_name in $db_names; do
    if [ ! -z "$db_name" ]; then
        echo -e "${YELLOW}Datenbank: $db_name${NC}"
        
        if [ -z "$MONGO_URI" ]; then
            $MONGO_CMD --quiet --eval "
                db.getSiblingDB('$db_name').getCollectionNames().slice(0,3).forEach(function(col) {
                    print('  Collection: ' + col);
                    db.getSiblingDB('$db_name').getCollection(col).getIndexes().forEach(function(idx) {
                        print('    - ' + idx.name + ': ' + JSON.stringify(idx.key));
                    });
                });
            "
        else
            $MONGO_CMD "$MONGO_URI" --quiet --eval "
                db.getSiblingDB('$db_name').getCollectionNames().slice(0,3).forEach(function(col) {
                    print('  Collection: ' + col);
                    db.getSiblingDB('$db_name').getCollection(col).getIndexes().forEach(function(idx) {
                        print('    - ' + idx.name + ': ' + JSON.stringify(idx.key));
                    });
                });
            "
        fi
        echo
    fi
done

echo -e "${GREEN}=== MongoDB Overview abgeschlossen ===${NC}"