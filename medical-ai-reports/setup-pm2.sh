#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}PM2 Autostart Setup${NC}"
echo "===================="

if ! command -v pm2 &> /dev/null; then
    echo "PM2 nicht gefunden. Installiere PM2..."
    sudo npm install -g pm2
fi

cd backend
pm2 start ecosystem.config.js

pm2 save
pm2 startup systemd -u $USER --hp $HOME

echo -e "\n${GREEN}✅ PM2 Setup abgeschlossen!${NC}"
echo ""
echo "PM2 Befehle:"
echo "  Status:    pm2 status"
echo "  Logs:      pm2 logs medical-ai-backend"
echo "  Restart:   pm2 restart medical-ai-backend"
