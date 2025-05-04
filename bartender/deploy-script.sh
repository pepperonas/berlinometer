#!/bin/bash

# Deployment-Script für Bartender-App auf VPS
# ==========================================

echo "🍸 Bartender-App - VPS Deployment Tool 🍸"
echo "============================================"

# 1. Build für Produktion
echo "📦 Erstelle einen optimierten Produktions-Build..."
cp .env.production .env
npm run build

# 2. Dateien für VPS-Deployment vorbereiten
echo "🗂️ Dateien für VPS-Deployment vorbereiten..."
mkdir -p deploy
cp -r build server ecosystem.config.js package.json .env.production.server deploy/
mv deploy/.env.production.server deploy/.env
cp server.js deploy/

# 3. Erstellen der Nginx-Konfiguration
echo "📝 Erstelle Nginx-Konfiguration..."
cat > deploy/nginx.conf << EOF
server {
    listen 80;
    server_name YOUR_SERVER_DOMAIN;

    # Redirect HTTP to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name YOUR_SERVER_DOMAIN;

    # SSL-Konfiguration
    ssl_certificate /path/to/your/ssl/certificate.pem;
    ssl_certificate_key /path/to/your/ssl/privatekey.pem;

    # Frontend-Dateien
    location / {
        root /path/to/bartender/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend-API
    location /api {
        proxy_pass http://localhost:5024;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 4. Erstellen der Deployment-Anweisungen
echo "📄 Erstelle Deployment-Anweisungen..."
cat > deploy/README.md << EOF
# Bartender App - Deployment-Anweisungen

## Voraussetzungen
- Node.js 16+ 
- MongoDB 4.4+
- Nginx
- PM2 (npm install -g pm2)

## Installation

1. Kopiere alle Dateien in ein Verzeichnis auf deinem VPS, z.B. /var/www/bartender

2. Installiere die Abhängigkeiten:
   \`\`\`
   cd /var/www/bartender
   npm install
   \`\`\`

3. Starte den Server mit PM2:
   \`\`\`
   pm2 start server.js --name bartender
   pm2 save
   pm2 startup
   \`\`\`

4. Konfiguriere Nginx:
   \`\`\`
   # Bearbeite die nginx.conf-Datei und passe sie an deine Domain an
   nano nginx.conf
   
   # Kopiere die Konfiguration
   sudo cp nginx.conf /etc/nginx/sites-available/bartender
   
   # Erstelle einen Symlink
   sudo ln -s /etc/nginx/sites-available/bartender /etc/nginx/sites-enabled/
   
   # Teste die Konfiguration
   sudo nginx -t
   
   # Starte Nginx neu
   sudo systemctl restart nginx
   \`\`\`

5. Richte HTTPS ein (mit Let's Encrypt):
   \`\`\`
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   \`\`\`

## Wichtige Hinweise
- Die MongoDB-Verbindung ist aktuell auf localhost konfiguriert. Wenn deine MongoDB auf einem anderen Server läuft, passe die .env-Datei entsprechend an.
- Stelle sicher, dass der Server-Port (5024) nicht durch eine Firewall blockiert wird.
- Für Produktionsumgebungen solltest du erwägen, MongoDB mit Authentifizierung zu sichern.

## Updates
Um die App zu aktualisieren:
1. Erstelle einen neuen Build auf deinem Entwicklungsrechner
2. Kopiere die neuen Build-Dateien auf den Server
3. Starte den Server neu: \`pm2 restart bartender\`

## Datenbank-Backup
Regelmäßige Backups deiner MongoDB-Datenbank sind empfohlen:
\`\`\`
mongodump --db bartender --out /path/to/backup/\$(date +%Y-%m-%d)
\`\`\`
EOF

# 5. Erstellen einer Zip-Datei
echo "🗜️ Erstelle Zip-Datei für den Upload..."
cd deploy
zip -r ../bartender-deploy.zip .

# 6. Aufräumen
echo "🧹 Räume auf..."
cd ..
rm -rf deploy

echo "✅ Deployment-Paket wurde erfolgreich erstellt!"
echo "📦 Die Datei 'bartender-deploy.zip' enthält alle notwendigen Dateien."
echo "📝 Folge den Anweisungen in der README.md-Datei im Zip-Archiv für die Installation."
echo ""
echo "Hinweis: Passe die Nginx-Konfiguration und MongoDB-Verbindung an deine VPS-Umgebung an."