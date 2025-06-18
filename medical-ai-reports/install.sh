#!/bin/bash

echo "📦 Installing Backend Dependencies..."
cd backend
npm install

echo "📦 Installing Frontend Dependencies..."
cd ../frontend
npm install

echo "📦 Installing PM2 globally..."
sudo npm install -g pm2

echo "✅ Installation abgeschlossen!"
echo ""
echo "🚀 Zum Starten:"
echo "1. Backend mit PM2: cd backend && npm run pm2:start"
echo "2. Frontend: cd frontend && npm run dev"
