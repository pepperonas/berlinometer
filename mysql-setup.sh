#!/bin/bash
# Weniger strikt, damit einzelne Fehler nicht das ganze Skript abbrechen
set +e

# Problematisches MongoDB-Repository temporär deaktivieren
if [ -f /etc/apt/sources.list.d/mongodb-org-6.0.list ]; then
    echo "Deaktiviere temporär MongoDB 6.0 Repository..."
    sudo mv /etc/apt/sources.list.d/mongodb-org-6.0.list /etc/apt/sources.list.d/mongodb-org-6.0.list.bak
fi

# MySQL-Server installieren, falls noch nicht vorhanden
echo "MySQL-Server wird installiert..."
if ! dpkg -l | grep -q mysql-server; then
    sudo apt update || true  # Fehler ignorieren
    sudo apt install -y mysql-server
else
    echo "MySQL-Server ist bereits installiert."
fi

# Repository wieder aktivieren, wenn es zuvor deaktiviert wurde
if [ -f /etc/apt/sources.list.d/mongodb-org-6.0.list.bak ]; then
    echo "Aktiviere MongoDB 6.0 Repository wieder..."
    sudo mv /etc/apt/sources.list.d/mongodb-org-6.0.list.bak /etc/apt/sources.list.d/mongodb-org-6.0.list
fi

# In MySQL als Root einloggen und Benutzer, Datenbank und Tabellen erstellen
echo "Benutzer, Datenbank und Tabellen werden erstellt..."
sudo mysql <<EOF
# Sicherheitseinstellungen
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

# Benutzer erstellen und Rechte zuweisen
CREATE USER IF NOT EXISTS 'martin'@'localhost' IDENTIFIED BY 'N)ZyhegaJ#YLH(c&Jhx7';
CREATE USER IF NOT EXISTS 'martin'@'%' IDENTIFIED BY 'N)ZyhegaJ#YLH(c&Jhx7';
GRANT ALL PRIVILEGES ON *.* TO 'martin'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'martin'@'%';
FLUSH PRIVILEGES;

# Datenbank erstellen
DROP DATABASE IF EXISTS test_db;
CREATE DATABASE test_db;
USE test_db;

# Tabellen erstellen
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# Dummy-Daten einfügen
INSERT INTO users (name, email) VALUES 
('Max Mustermann', 'max@example.com'),
('Anna Schmidt', 'anna@example.com'),
('Tom Müller', 'tom@example.com');

INSERT INTO products (name, price, description) VALUES 
('Laptop', 999.99, 'High-performance laptop with 16GB RAM'),
('Smartphone', 499.99, 'Latest model with 5G support'),
('Tablet', 299.99, 'Lightweight tablet with 10-inch display');
EOF

# MySQL-Dienst neu starten
echo "MySQL-Dienst wird neu gestartet..."
sudo systemctl restart mysql

# Konfiguration für Remote-Zugriff
echo "Konfiguriere Remote-Zugriff..."
# Pfad zur MySQL-Konfigurationsdatei kann je nach Version variieren
CONFIG_PATH="/etc/mysql/mysql.conf.d/mysqld.cnf"
if [ ! -f "$CONFIG_PATH" ]; then
    CONFIG_PATH="/etc/mysql/mariadb.conf.d/50-server.cnf"
fi

if grep -q "bind-address" "$CONFIG_PATH"; then
    sudo sed -i 's/bind-address\s*=\s*127.0.0.1/bind-address = 0.0.0.0/' "$CONFIG_PATH"
else
    echo "bind-address = 0.0.0.0" | sudo tee -a "$CONFIG_PATH"
fi

sudo systemctl restart mysql

# Firewall-Regel für MySQL hinzufügen (falls UFW aktiv ist)
if command -v ufw >/dev/null 2>&1 && sudo ufw status | grep -q "Status: active"; then
    echo "Firewall-Regel für MySQL wird hinzugefügt..."
    sudo ufw allow 3306/tcp
fi

echo "Installation abgeschlossen."
echo "MySQL-Server wurde installiert und konfiguriert."
echo "Benutzer 'martin' mit dem angegebenen Passwort wurde erstellt."
echo "Datenbank 'test_db' mit zwei Tabellen und Dummy-Daten wurde erstellt."
echo "Du kannst dich jetzt mit 'mysql -u martin -p' anmelden."