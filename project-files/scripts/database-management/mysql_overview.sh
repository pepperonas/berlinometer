#!/bin/bash

# MySQL Database Overview Script
# Für macOS/Linux/Ubuntu

echo "=== MySQL Database Overview ==="
echo "Datum: $(date)"
echo

# Farben für bessere Lesbarkeit
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# MySQL Service Status prüfen
echo -e "${BLUE}1. MySQL Service Status:${NC}"
if systemctl is-active --quiet mysql 2>/dev/null || systemctl is-active --quiet mysqld 2>/dev/null; then
    echo -e "${GREEN}✓ MySQL läuft${NC}"
elif brew services list | grep mysql | grep started >/dev/null 2>&1; then
    echo -e "${GREEN}✓ MySQL läuft (Homebrew)${NC}"
else
    echo -e "${RED}✗ MySQL läuft nicht oder nicht erkannt${NC}"
fi
echo

# MySQL-Verbindung testen
echo -e "${BLUE}2. MySQL-Verbindung (als root):${NC}"
echo "Bitte root-Passwort eingeben (oder Enter für kein Passwort):"
read -s MYSQL_ROOT_PASS

if [ -z "$MYSQL_ROOT_PASS" ]; then
    MYSQL_CMD="mysql -u root"
else
    MYSQL_CMD="mysql -u root -p$MYSQL_ROOT_PASS"
fi

# Test ob Verbindung funktioniert
if $MYSQL_CMD -e "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Verbindung erfolgreich${NC}"
else
    echo -e "${RED}✗ Verbindung fehlgeschlagen - prüfe Passwort${NC}"
    exit 1
fi
echo

# Alle Datenbanken anzeigen
echo -e "${BLUE}3. Alle Datenbanken:${NC}"
$MYSQL_CMD -e "SHOW DATABASES;" | grep -v "Database\|information_schema\|performance_schema\|mysql\|sys" | while read db; do
    if [ ! -z "$db" ]; then
        echo -e "${GREEN}- $db${NC}"
    fi
done
echo

# Alle MySQL-User anzeigen
echo -e "${BLUE}4. Alle MySQL-User:${NC}"
$MYSQL_CMD -e "SELECT user, host FROM mysql.user WHERE user != '';" --table
echo

# User-Berechtigungen für jede Datenbank
echo -e "${BLUE}5. User-Berechtigungen pro Datenbank:${NC}"
DATABASES=$($MYSQL_CMD -e "SHOW DATABASES;" | grep -v "Database\|information_schema\|performance_schema\|mysql\|sys")

for db in $DATABASES; do
    if [ ! -z "$db" ]; then
        echo -e "${YELLOW}Datenbank: $db${NC}"
        $MYSQL_CMD -e "SELECT DISTINCT grantee FROM information_schema.schema_privileges WHERE table_schema = '$db';" --skip-column-names | while read user; do
            if [ ! -z "$user" ]; then
                echo "  User: $user"
                $MYSQL_CMD -e "SHOW GRANTS FOR $user;" 2>/dev/null | grep "$db" || echo "    Keine spezifischen Grants für $db"
            fi
        done
        echo
    fi
done

# Aktive Verbindungen
echo -e "${BLUE}6. Aktive Verbindungen:${NC}"
$MYSQL_CMD -e "SHOW PROCESSLIST;" --table
echo

# MySQL-Konfiguration
echo -e "${BLUE}7. MySQL-Konfiguration:${NC}"
echo "Port: $($MYSQL_CMD -e "SHOW VARIABLES LIKE 'port';" --skip-column-names | cut -f2)"
echo "Socket: $($MYSQL_CMD -e "SHOW VARIABLES LIKE 'socket';" --skip-column-names | cut -f2)"
echo "Data Directory: $($MYSQL_CMD -e "SHOW VARIABLES LIKE 'datadir';" --skip-column-names | cut -f2)"
echo

# Tabellen pro Datenbank
echo -e "${BLUE}8. Tabellen pro Datenbank:${NC}"
for db in $DATABASES; do
    if [ ! -z "$db" ]; then
        table_count=$($MYSQL_CMD -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$db';" --skip-column-names)
        echo -e "${YELLOW}$db${NC}: $table_count Tabellen"
        
        # Zeige ersten 5 Tabellen
        tables=$($MYSQL_CMD -e "SELECT table_name FROM information_schema.tables WHERE table_schema = '$db' LIMIT 5;" --skip-column-names)
        for table in $tables; do
            if [ ! -z "$table" ]; then
                echo "  - $table"
            fi
        done
        echo
    fi
done

echo -e "${GREEN}=== MySQL Overview abgeschlossen ===${NC}"