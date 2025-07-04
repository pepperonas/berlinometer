# Datenbank Übersicht - mrx3k1.de Portfolio

Diese Datei dokumentiert alle Datenbankverbindungen und -konfigurationen des mrx3k1.de Portfolios.

## 📊 Übersicht

**Gesamt:** 8 Anwendungen mit Datenbankverbindungen
- **MongoDB:** 7 Anwendungen (localhost:27017, eine auf 27018)
- **MySQL:** 1 Anwendung (localhost:3306)

---

## 🍃 MongoDB Datenbanken

### 1. Bartender System
- **Verzeichnis:** `bartender/`
- **Datenbank:** `bartender`
- **Host:** localhost:27017
- **Benutzer:** `mongoAdmin`
- **Passwort:** `#QGwODkgI7fx`
- **Auth Source:** admin
- **App Port:** 5024
- **Connection String:** `mongodb://mongoAdmin:%23QGwODkgI7fx@localhost:27017/bartender?authSource=admin`

**Schema/Collections:**
- User (Benutzer)
- Bar (Bars/Lokale)
- Drink (Getränke)
- Inventory (Lagerbestand)
- Sale (Verkäufe)
- Expense (Ausgaben)
- Income (Einnahmen)
- Supplier (Lieferanten)
- Staff (Personal)

**JWT Secret:** `#QGwODkgI7fx`

---

### 2. Medical AI Reports
- **Verzeichnis:** `medical-ai-reports/backend/`
- **Datenbank:** `medical-ai-reports`
- **Host:** localhost:27017
- **Benutzer:** (Standard MongoDB, keine Auth)
- **App Port:** 5063
- **Connection String:** `mongodb://localhost:27017/medical-ai-reports`

**Schema/Collections:**
- User (Benutzer)
- Practice (Praxen)
- Workflow (Arbeitsabläufe)

**JWT Secret:** `0oKlJ7GODFnw2W4uI38cg4Zwd4huJJ5qiRRCtYzf/8z8NvFTIlyDGy8FVfy3vVD+dL8dQ73nc1JsM6XypL7b7A==`
**OpenAI API Key:** `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`

---

### 3. MPSec (2FA Token Manager)
- **Verzeichnis:** `mpsec/server/`
- **Datenbank:** `mpsec`
- **Host:** localhost:27017
- **Benutzer:** `mongoAdmin`
- **Passwort:** `#QGwODkgI7fx`
- **Auth Source:** admin
- **App Port:** 5012
- **Connection String:** `mongodb://mongoAdmin:%23QGwODkgI7fx@localhost:27017/mpsec?authSource=admin`

**Schema/Collections:**
- User (Benutzer)
- Token (2FA Tokens)

**JWT Secret:** `afc487a82441c686102525f53e13bccd`
**Encryption Key:** `891c3527949d43043afe669ba7c88338`

---

### 4. TechDocs
- **Verzeichnis:** `techdocs/`
- **Datenbank:** `techdocs`
- **Host:** localhost:27017
- **Benutzer:** (Standard MongoDB, keine Auth)
- **App Port:** 5007
- **Connection String:** `mongodb://localhost:27017/techdocs`

**Schema/Collections:**
- User (Benutzer)
- Category (Kategorien)
- Document (Dokumente)

**JWT Secret:** `dein_geheimer_jwt_schluessel`

---

### 5. GlitterHue
- **Verzeichnis:** `glitter-hue/server/`
- **Datenbank:** `glitterhue`
- **Host:** localhost:27017
- **Benutzer:** (Standard MongoDB, keine Auth)
- **App Port:** 5001
- **Connection String:** `mongodb://localhost:27017/glitterhue`

**Schema/Collections:**
- EnergyData (Energiedaten)

**JWT Secret:** `geheimer_schluessel_fuer_authentifizierung`

---

### 6. Endeavour
- **Verzeichnis:** `endeavour/backend/`
- **Datenbank:** `endeavour`
- **Host:** localhost:27017
- **Benutzer:** (Standard MongoDB, keine Auth)
- **App Port:** 5000
- **Connection String:** `mongodb://localhost:27017/endeavour`

**Schema/Collections:**
- User (Benutzer)
- Challenge (Herausforderungen - mit eingebetteten Schemas)

**JWT Secret:** `endeavour_secret_key_change_in_production`
**OpenAI API Key:** `dein_openai_api_key_hier` (Platzhalter)

---

### 7. Secure Marketplace
- **Verzeichnis:** `secure-marketplace/backend/`
- **Datenbank:** `securemarket`
- **Host:** localhost:27018 ⚠️ (Nicht-Standard Port!)
- **Benutzer:** (Standard MongoDB, keine Auth)
- **App Port:** 5005
- **Connection String:** `mongodb://localhost:27018/securemarket`

**Schema/Collections:**
- User (Benutzer)
- Product (Produkte)
- Order (Bestellungen)
- Message (Nachrichten)

**JWT Secret:** `faa24c211ecd2173063948ac316df4cba9434b378df0ac494491d10aa79d3a3e`

---

## 🐬 MySQL Datenbanken

### 1. Weather Tracker API
- **Verzeichnis:** `api/weather-tracker/`
- **Datenbank:** `weather_tracker`
- **Host:** localhost:3306
- **Benutzer:** `martin`
- **Passwort:** `N)ZyhegaJ#YLH(c&Jhx7`
- **Port:** 3306

**Tabellen/Schema:**
- Wetter-Tracking Daten (spezifische Struktur nicht dokumentiert in den gefundenen Dateien)

---

## 🔒 Sicherheitshinweise

### ⚠️ Kritische Sicherheitsprobleme

1. **Geteilte MongoDB Credentials:**
   - `mongoAdmin:#QGwODkgI7fx` wird in Bartender UND MPSec verwendet
   - Sollte pro Anwendung separate Benutzer haben

2. **Gehärtete Passwörter in .env Dateien:**
   - MongoDB Passwort: `#QGwODkgI7fx`
   - MySQL Passwort: `N)ZyhegaJ#YLH(c&Jhx7`
   - OpenAI API Keys in Klartext

3. **JWT Secrets:**
   - Verschiedene Secrets pro App (gut!)
   - Einige sind zu schwach (techdocs, glitter-hue)

### 🔧 Empfehlungen

1. **Für VPS Deployment:**
   - Separate Datenbankbenutzer pro Anwendung erstellen
   - Starke, einzigartige Passwörter generieren
   - JWT Secrets rotieren und stärken
   - API Keys als Umgebungsvariablen setzen

2. **Backup Strategie:**
   - Tägliche MongoDB Dumps aller Datenbanken
   - MySQL Backups für weather_tracker
   - Backup-Rotation (7 Tage, 4 Wochen, 12 Monate)

3. **Monitoring:**
   - Datenbankverbindungen überwachen
   - Speicherplatz beobachten
   - Langsame Queries identifizieren

---

## 📋 Port Übersicht

| Anwendung | App Port | DB Port | DB Type |
|-----------|----------|---------|---------|
| Bartender | 5024 | 27017 | MongoDB |
| Medical AI Reports | 5063 | 27017 | MongoDB |
| MPSec | 5012 | 27017 | MongoDB |
| TechDocs | 5007 | 27017 | MongoDB |
| GlitterHue | 5001 | 27017 | MongoDB |
| Endeavour | 5000 | 27017 | MongoDB |
| Secure Marketplace | 5005 | 27018 | MongoDB |
| Weather Tracker | - | 3306 | MySQL |

---

## 🚀 VPS Deployment Checklist

### MongoDB Setup
```bash
# Erstelle Datenbankbenutzer für jede App
use bartender
db.createUser({user: "bartender_user", pwd: "NEUES_STARKES_PASSWORT", roles: ["readWrite"]})

use mpsec  
db.createUser({user: "mpsec_user", pwd: "NEUES_STARKES_PASSWORT", roles: ["readWrite"]})

# ... für alle anderen DBs
```

### MySQL Setup
```bash
# Erstelle separaten Benutzer für weather_tracker
CREATE USER 'weather_user'@'localhost' IDENTIFIED BY 'NEUES_STARKES_PASSWORT';
GRANT ALL PRIVILEGES ON weather_tracker.* TO 'weather_user'@'localhost';
FLUSH PRIVILEGES;
```

### Umgebungsvariablen
- Alle `.env` Dateien für Produktion anpassen
- Sichere Secrets generieren
- API Keys als Systemumgebungsvariablen setzen

---

---

## 🖥️ VPS Status (mrx3k1.de) - Ubuntu 24.04

**Verbindung:** `ssh root@mrx3k1.de`  
**System:** Linux mrx3k1 6.8.0-60-generic #63-Ubuntu SMP PREEMPT_DYNAMIC

### 🍃 MongoDB Konfiguration auf VPS

**Service Status:** ✅ Aktiv (läuft seit 2025-06-12)  
**Port:** 27017  
**Bind IP:** 0.0.0.0 (alle Interfaces)  
**Auth:** ✅ Aktiviert  
**Config:** `/etc/mongod.conf`

#### Tatsächlich vorhandene Datenbanken:
1. **admin** (184 KB) - Admin/Auth DB
2. **bartender** (725 KB) - ✅ Läuft auf Port 5024
3. **config** (49 KB) - MongoDB System DB
4. **darts3k1** (512 KB) - 🎯 Darts App (nicht in lokaler Entwicklung gefunden)
5. **local** (82 KB) - MongoDB System DB
6. **mpsec** (184 KB) - ✅ Läuft auf Port 5012
7. **techdocs** (94 KB) - ✅ Läuft auf Port 5007

#### MongoDB Benutzer auf VPS:
- **mongoAdmin** - Admin-Benutzer (in admin DB)
- **bartenderUser** - Dedizierter User für Bartender DB
- **mongoAdmin** - Zusätzliche Rechte für darts3k1 DB

**⚠️ Fehlende Datenbanken auf VPS:**
- medical-ai-reports
- glitterhue
- endeavour  
- securemarket

### 🐬 MySQL Konfiguration auf VPS

**Service Status:** ✅ Aktiv (läuft seit 2025-06-12)  
**Port:** 3306  
**Status:** Server is operational

#### Tatsächlich vorhandene Datenbanken:
1. **weather_tracker** - ✅ Läuft auf Port 5033
2. **firma_db** - 🏢 Zusätzliche DB (nicht in lokaler Entwicklung gefunden)
3. **fooddb** - 🍔 Zusätzliche DB (nicht in lokaler Entwicklung gefunden)
4. **test_db** - 🧪 Test-Datenbank

#### MySQL Benutzer auf VPS:
- **martin** (@localhost & @%)
- **root** (@localhost)
- **debian-sys-maint** (@localhost)

### 📊 Aktive PM2 Prozesse auf VPS (27 Apps)

| ID | App Name | Port | Status | DB Connected |
|----|----------|------|--------|--------------|
| 16 | bartender | 5024 | ✅ online | bartender (MongoDB) |
| 15 | mpsec-backend | 5012 | ✅ online | mpsec (MongoDB) |
| 3 | techdocs | 5007 | ✅ online | techdocs (MongoDB) |
| 22 | medical-ai-backend | 5063 | ✅ online | ❌ DB fehlt |
| 18 | weather-tracker | 5033 | ✅ online | weather_tracker (MySQL) |
| 17 | darts-backend | - | ✅ online | darts3k1 (MongoDB) |

**Weitere aktive Apps ohne DB-Verbindung:**
- azul-multiplayer (5057), bomberman-multiplayer, poker-server
- objectcut, voicextract-api, seolytix-backend
- popular-times-server (5044), xchange-server (5009)
- free-wifi, secret-content-server, zipzap-server-fixed
- und weitere...

### 🔍 VPS vs. Lokale Entwicklung - Unterschiede

#### ✅ Übereinstimmungen:
- **Bartender:** Identische Konfiguration und Collections
- **MPSec:** Identische Konfiguration und Collections  
- **TechDocs:** Identische Konfiguration
- **Weather Tracker:** Läuft auf VPS mit korrekten Daten

#### ❌ Abweichungen:

**Nur auf VPS vorhanden:**
- **darts3k1** MongoDB DB (512 KB)
- **firma_db** MySQL DB
- **fooddb** MySQL DB

**Nur lokal entwickelt, fehlt auf VPS:**
- medical-ai-reports DB
- glitterhue DB
- endeavour DB  
- securemarket DB (Port 27018)

**Port-Unterschiede:**
- Weather Tracker: Lokale API läuft direkt, VPS auf Port 5033

### 🚨 Kritische Befunde

1. **Fehlende Datenbanken:** 4 lokale DBs nicht auf VPS deployed
2. **Medical AI läuft ohne DB:** Backend online aber DB fehlt
3. **Zusätzliche DBs auf VPS:** darts3k1, firma_db, fooddb nicht dokumentiert
4. **Shared Credentials:** mongoAdmin weiterhin für mehrere DBs verwendet

### 📋 Empfohlene Maßnahmen

1. **Sofort:**
   - medical-ai-reports DB auf VPS erstellen
   - Andere fehlende DBs nach Bedarf deployen
   - Darts3k1, firma_db, fooddb dokumentieren

2. **Sicherheit:**
   - Separate DB-Benutzer für jede Anwendung
   - Credential-Rotation durchführen

3. **Monitoring:**
   - DB-Größen regelmäßig prüfen
   - Performance-Überwachung einrichten

---

**Letzte Aktualisierung:** 2025-07-03  
**Status:** VPS-Analyse abgeschlossen - Abweichungen identifiziert