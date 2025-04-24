# 1. Erstelle das Hauptprojekt
mkdir mpsec
cd mpsec

# 2. Erstelle die React-App
npx create-react-app client
cd client
npm install axios react-router-dom styled-components jwt-decode
cd ..

# 3. Erstelle den Server
mkdir server
cd server
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cors dotenv otplib
npm install --save-dev nodemon
cd ..