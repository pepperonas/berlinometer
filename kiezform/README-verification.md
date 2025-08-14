# KiezForm Verification System

Ein digitales Echtheitszertifikat-System für 3D-gedruckte Schmuckstücke von KiezForm.

## 🎯 Überblick

Das KiezForm Verification System ermöglicht es Kunden, die Authentizität ihrer erworbenen Schmuckstücke digital zu verifizieren. Jedes Produkt erhält eine eindeutige ID und einen QR-Code, über den die Echtheit nachgewiesen werden kann.

## 🏗️ Architektur

### Backend (Node.js/Express)
- REST API für Produktverwaltung
- MongoDB Datenspeicherung
- JWT Authentifizierung für Admins
- QR-Code Generierung
- Sichere Endpunkte

### Frontend
- Öffentliche Verifikationsseite (ohne Login)
- Admin Dashboard (React - geplant)
- Mobile-optimiert

### Datenbank (MongoDB)
- Produktinformationen
- Admin-Benutzer
- Metadaten und Besitzerinformationen

## 🚀 Installation

### Voraussetzungen
- Node.js (v16+)
- MongoDB
- PM2 (für Produktionsumgebung)
- Nginx (für Reverse Proxy)

### Lokale Entwicklung

```bash
# Repository klonen
git clone <repository-url>
cd kiezform-verification

# Backend Dependencies installieren
cd backend
npm install

# Environment Variables konfigurieren
cp .env.example .env
# .env Datei bearbeiten

# MongoDB starten (lokal)
mongod

# Server starten
npm run dev
```

### Produktionsdeployment

```bash
# Auf VPS deployen
rsync -avz kiezform-verification/ user@server:/var/www/

# Dependencies installieren
cd /var/www/kiezform-verification/backend
npm install --production

# PM2 Service starten
pm2 start ecosystem.config.js
pm2 save

# Nginx konfigurieren (siehe nginx-verification.conf)
```

## 🔧 Konfiguration

### Environment Variables (.env)

```bash
PORT=5090
JWT_SECRET=your-secret-key-here
MONGODB_URI=mongodb://localhost:27017/kiezform_verification
BASE_URL=https://kiezform.de
NODE_ENV=production
```

### MongoDB Setup

```javascript
// Benutzer und Datenbank erstellen
use kiezform_verification;
db.createUser({
  user: 'kiezform_user',
  pwd: 'secure-password',
  roles: [{ role: 'readWrite', db: 'kiezform_verification' }]
});
```

### Nginx Konfiguration

```nginx
# API Proxy
location /api/ {
    proxy_pass http://127.0.0.1:5090;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Verifikationsseite
location /verify/ {
    alias /var/www/public/;
    try_files /verify.html =404;
}
```

## 📊 API Endpunkte

### Öffentliche Endpunkte
- `GET /api/health` - Gesundheitscheck
- `GET /api/verify/:id` - Produktverifizierung
- `GET /api/qrcode/:id` - QR-Code generieren

### Admin Endpunkte (Authentifizierung erforderlich)
- `POST /api/admin/login` - Admin Login
- `POST /api/admin/register` - Admin registrieren
- `GET /api/products` - Alle Produkte abrufen
- `POST /api/products` - Neues Produkt erstellen
- `PUT /api/products/:id` - Produkt aktualisieren
- `DELETE /api/products/:id` - Produkt löschen
- `GET /api/stats` - Statistiken

## 🔐 Sicherheit

### Authentifizierung
- JWT Token mit 24h Gültigkeit
- bcrypt Passwort-Hashing (12 Salt Rounds)
- Sichere HTTP-Header

### Rate Limiting
- API Endpunkte: 30 Requests/Minute
- Verifizierung: 60 Requests/Minute

### Datenvalidierung
- Input Sanitization
- Schema Validierung
- Eindeutige Seriennummern

## 🎨 Verwendung

### Admin: Neues Produkt anlegen

```bash
# Admin einloggen
curl -X POST https://kiezform.de/api/admin/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "admin", "password": "password"}'

# Produkt erstellen
curl -X POST https://kiezform.de/api/products \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "serialNumber": "RING-2024-001",
    "productName": "BRUTALIST RING",
    "category": "rings",
    "metadata": {
      "material": "Recycled PLA",
      "size": "M",
      "price": 89
    }
  }'
```

### Kunde: Produkt verifizieren

1. QR-Code scannen oder Link öffnen: `https://kiezform.de/verify/PRODUCT-ID`
2. Echtheitszertifikat wird angezeigt
3. Produktdetails und Metadaten werden validiert

## 📱 QR-Code Integration

QR-Codes enthalten Links zur Verifikationsseite:
- Format: `https://kiezform.de/verify/{productId}`
- Fehlerkorrektur: Medium (M)
- Größe: 400x400px
- Schwarz/Weiß für maximalen Kontrast

## 🔄 Workflow

1. **Produktion**: Schmuckstück wird 3D-gedruckt
2. **Registrierung**: Admin erstellt Produkteintrag im System
3. **QR-Code**: System generiert eindeutigen QR-Code
4. **Packaging**: QR-Code wird auf Verpackung/Karte gedruckt
5. **Verkauf**: Kunde erhält Produkt mit QR-Code
6. **Verifizierung**: Kunde scannt Code → Echtheitszertifikat

## 📈 Monitoring

### PM2 Commands
```bash
# Status prüfen
pm2 status

# Logs anzeigen
pm2 logs kiezform-verification-api

# Service neustarten
pm2 restart kiezform-verification-api

# Monitoring Dashboard
pm2 monit
```

### Wichtige Metriken
- API Response Time
- Verifikationsanzahl pro Tag
- Fehlerrate
- MongoDB Verbindungsstatus

## 🐛 Troubleshooting

### Häufige Probleme

**MongoDB Verbindungsfehler**
```bash
# MongoDB Status prüfen
systemctl status mongod

# Logs überprüfen
tail -f /var/log/mongodb/mongod.log
```

**API nicht erreichbar**
```bash
# Port prüfen
netstat -tlnp | grep 5090

# PM2 Status
pm2 status

# Nginx Logs
tail -f /var/log/nginx/error.log
```

**SSL/HTTPS Probleme**
```bash
# Zertifikat erneuern
certbot renew

# Nginx Konfiguration testen
nginx -t
```

## 🔄 Backup & Recovery

### Automatisches Backup
```bash
# Tägliches Backup um 2 Uhr
0 2 * * * mongodump --db kiezform_verification --out /backup/mongodb/$(date +\%Y\%m\%d)
```

### Disaster Recovery
```bash
# Backup wiederherstellen
mongorestore --db kiezform_verification /backup/mongodb/YYYYMMDD/kiezform_verification

# PM2 Services wiederherstellen
pm2 resurrect
```

## 📝 Entwicklung

### Code Style
- ESLint für JavaScript
- Prettier für Formatierung
- Async/Await für asynchrone Operationen
- Error Handling mit try/catch

### Testing
```bash
# Unit Tests
npm test

# Integration Tests
npm run test:integration

# API Tests mit curl
./test-api.sh
```

## 🤝 Contributing

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt ist proprietary und für den internen Gebrauch von KiezForm bestimmt.

## 📞 Support

Bei Fragen oder Problemen:
- Email: martin.pfeffer@celox.io
- Issues: GitHub Repository
- Dokumentation: Dieses README

---

**KiezForm Verification System v1.0.0**  
Made with ❤️ in Berlin