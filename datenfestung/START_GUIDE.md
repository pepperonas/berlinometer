# Datenfestung - Startanleitung

## 🚀 App starten

### Backend starten (Port 3001):
```bash
cd /Users/martin/WebstormProjects/mrx3k1/datenfestung/backend
npm run dev
```

Das Backend sollte mit folgender Meldung starten:
```
🚀 Datenfestung API server running on port 3001
📋 Environment: development
🌍 CORS Origin: http://localhost:3002
📊 Health check: http://localhost:3001/health
```

### Frontend starten (Port 3002):
```bash
cd /Users/martin/WebstormProjects/mrx3k1/datenfestung/frontend
PORT=3002 npm start
```

Das Frontend öffnet sich automatisch im Browser unter: http://localhost:3002

## 🔐 Test-Login

Da wir noch keine Datenbank haben, können Sie sich mit diesen Test-Credentials einloggen:
- **E-Mail:** test@datenfestung.com
- **Passwort:** password123

## 📋 Verfügbare Features

### ✅ Funktioniert bereits:
- Login-System mit JWT-Authentifizierung
- Dashboard mit Widgets und Statistiken
- Sidebar-Navigation
- Verarbeitungstätigkeiten-Liste und Formular
- Responsive Design mit Material-UI

### 🔄 Mock-Daten:
- Das System verwendet derzeit Mock-Daten
- Alle Änderungen werden nur im Memory gespeichert
- Beim Neustart sind alle Daten weg

## 🛠 Nächste Schritte

1. **Datenbank einrichten:**
   - PostgreSQL installieren
   - Schema aus `DATABASE_SCHEMA.sql` importieren
   - Prisma ORM konfigurieren

2. **Weitere Module implementieren:**
   - TOM-Verwaltung
   - Vertragsmanagement
   - Aufgaben-System
   - E-Learning-Module

3. **Produktions-Setup:**
   - Environment-Variablen konfigurieren
   - E-Mail-Server einrichten
   - File-Upload konfigurieren

## 🐛 Troubleshooting

### Frontend startet nicht:
```bash
# Prüfen Sie, ob Port 3000 bereits belegt ist
lsof -i:3000
# Verwenden Sie einen anderen Port
PORT=3002 npm start
```

### Backend Fehler:
```bash
# Prüfen Sie die .env Datei
cat /Users/martin/WebstormProjects/mrx3k1/datenfestung/backend/.env
```

### CORS-Fehler:
- Stellen Sie sicher, dass Frontend auf Port 3002 läuft
- Backend CORS ist auf http://localhost:3002 konfiguriert

## 📖 API-Dokumentation

Die API-Endpunkte sind in `API_ENDPOINTS.md` dokumentiert.

Health-Check: http://localhost:3001/health