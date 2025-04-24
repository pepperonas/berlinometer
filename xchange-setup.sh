#!/bin/bash
# Direkte Installationsbefehle für xchange auf Ubuntu 24.04

# Systemwerkzeuge aktualisieren
sudo apt update
sudo apt upgrade -y

# Node.js installieren (falls noch nicht vorhanden)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Nginx installieren (falls noch nicht vorhanden)
sudo apt install -y nginx

# Projektverzeichnisse erstellen
mkdir -p ~/xchange/public ~/xchange/uploads

# Ins Projektverzeichnis wechseln
cd ~/xchange

# package.json erstellen
cat > package.json << 'EOL'
{
  "name": "xchange",
  "version": "1.0.0",
  "description": "Online Dateispeicher API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-fileupload": "^1.4.2",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOL

# Abhängigkeiten installieren
npm install

# Nginx-Konfiguration einrichten
sudo tee /etc/nginx/sites-available/xchange > /dev/null << 'EOL'
server {
    listen 80;
    server_name _;

    location /xchange {
        proxy_pass http://localhost:5009/xchange;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Upload-Limits erhöhen
        client_max_body_size 50M;
    }

    access_log /var/log/nginx/xchange.access.log;
    error_log /var/log/nginx/xchange.error.log;
}
EOL

# Symlink erstellen und Nginx neustarten
sudo ln -sf /etc/nginx/sites-available/xchange /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# Systemd-Service einrichten
sudo tee /etc/systemd/system/xchange.service > /dev/null << EOL
[Unit]
Description=xchange Online Storage
After=network.target

[Service]
ExecStart=/usr/bin/node ${HOME}/xchange/server.js
Restart=always
User=${USER}
Group=${USER}
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=${HOME}/xchange

[Install]
WantedBy=multi-user.target
EOL

# Service aktivieren und starten
sudo systemctl enable xchange.service
sudo systemctl start xchange.service

echo "xchange Installation abgeschlossen"
echo "Rufe die Anwendung auf unter: http://$(hostname -I | awk '{print $1}')/xchange"