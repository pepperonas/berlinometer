#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Medical AI Deployment${NC}"

echo -e "\n${YELLOW}Building Frontend...${NC}"
cd frontend
npm run build

echo -e "\n${YELLOW}Deploying Frontend...${NC}"
sudo mkdir -p /var/www/html/medical-ai-reports/frontend
sudo cp -r build /var/www/html/medical-ai-reports/frontend/
sudo chown -R www-data:www-data /var/www/html/medical-ai-reports
sudo chmod -R 755 /var/www/html/medical-ai-reports

echo -e "\n${YELLOW}Restarting Backend...${NC}"
cd ../backend
pm2 restart medical-ai-backend || pm2 start ecosystem.config.js

echo -e "\n${GREEN}✅ Deployment abgeschlossen!${NC}"
