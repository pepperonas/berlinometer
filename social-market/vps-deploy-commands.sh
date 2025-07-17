#!/bin/bash

echo "🚀 Deploying Social Market to VPS..."

# 1. Verzeichnisse erstellen
sudo mkdir -p /var/www/html/social-market/backend
sudo mkdir -p /var/www/html/social-market/frontend

echo "📁 Directories created"

# 2. Backend Files kopieren (aus /tmp nach Production)
sudo cp -r /tmp/social-market-backend/* /var/www/html/social-market/backend/
sudo chown -R www-data:www-data /var/www/html/social-market/backend

echo "⚙️ Backend files deployed"

# 3. Frontend Build kopieren
sudo cp -r /tmp/social-market-frontend/* /var/www/html/social-market/frontend/
sudo chown -R www-data:www-data /var/www/html/social-market/frontend

echo "🎨 Frontend build deployed"

# 4. Backend Dependencies installieren
cd /var/www/html/social-market/backend
sudo npm install --production

echo "📦 Backend dependencies installed"

# 5. PM2 Backend starten
sudo pm2 start ecosystem.config.js
sudo pm2 save

echo "🔄 Backend started with PM2"

# 6. Status anzeigen
echo "📊 Current PM2 status:"
sudo pm2 list

echo ""
echo "✅ Social Market Backend deployed!"
echo ""
echo "🔧 Next steps:"
echo "1. Add nginx config to /etc/nginx/sites-available/default"
echo "2. Test nginx: sudo nginx -t"
echo "3. Reload nginx: sudo systemctl reload nginx"
echo "4. Access at: https://mrx3k1.de/social-market/"
echo ""
echo "🛠️ PM2 Commands:"
echo "- Logs: sudo pm2 logs social-market-backend"
echo "- Restart: sudo pm2 restart social-market-backend"
echo "- Stop: sudo pm2 stop social-market-backend"