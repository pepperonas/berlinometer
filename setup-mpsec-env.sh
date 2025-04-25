#!/bin/bash

# Verzeichniswechsel zum Server-Verzeichnis
cd mpsec/server

# Generieren eines zufälligen 32-Byte Keys (ergibt 64 Zeichen in Hex)
ENCRYPTION_KEY=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 16)

# Erstellen der .env-Datei
cat > .env << EOL
PORT=5012
MONGO_URI=mongodb://127.0.0.1:27017/mpsec
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=30d
ENCRYPTION_KEY=${ENCRYPTION_KEY}
EOL

echo "✅ .env-Datei wurde erstellt mit:"
echo "ENCRYPTION_KEY: ${ENCRYPTION_KEY}"
echo "JWT_SECRET: ${JWT_SECRET}"

# MongoDB starten, falls nötig (für macOS mit Homebrew)
if [[ "$OSTYPE" == "darwin"* ]]; then
    brew services start mongodb-community || echo "⚠️ MongoDB konnte nicht gestartet werden. Bitte installiere es mit 'brew install mongodb-community'."
# Für Linux/Ubuntu
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo systemctl start mongodb || echo "⚠️ MongoDB konnte nicht gestartet werden. Bitte installiere es mit 'sudo apt install mongodb'."
fi

# Node.js-Pakete installieren
npm install

# Server starten
echo "🚀 Starte den Server mit 'npm run dev'..."
