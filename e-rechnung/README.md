# HandwerkOS - ModularERP

Ein modernes, E-Rechnung-konformes ERP-System für kleine Unternehmen (Handwerker, Gastro, Dienstleister) mit Fokus auf deutsche Compliance und einfache Bedienung.

## 🚀 Features

### ✅ Phase 1 - Core (verfügbar)
- **Multi-Tenant Architektur** - Jeder Mandant hat eigene Daten
- **Kundenverwaltung** - Vollständige CRUD-Funktionen
- **Rechnungserstellung** - Mit Positionszeilen und automatischer Steuerberechnung
- **E-Rechnung Export** - XRechnung 3.0.1 und ZUGFeRD 2.3 konform
- **PDF-Generierung** - Professionelle Rechnungslayouts
- **Dashboard** - Übersicht über KPIs und Aktivitäten
- **Responsive Design** - Optimiert für Desktop und Mobile

### 🔄 Phase 2 - Expansion (geplant)
- Angebotsverwaltung mit Konvertierung zu Rechnungen
- Auftragsverwaltung
- Artikel-/Dienstleistungskatalog
- Zahlungsverfolgung
- Mahnwesen (3-stufig)

### 🎯 Phase 3 - Advanced (geplant)
- Projektverwaltung mit Zeiterfassung
- Lagerverwaltung
- Ausgabenverwaltung
- Erweiterte Berichte und Analytics

### 🔌 Phase 4 - Integration (geplant)
- DATEV Export für Steuerberater
- Banking-Integration (EBICS/PSD2)
- E-Mail Integration
- Kalender-Synchronisation
- API für Drittanbieter

## 🏗️ Technische Architektur

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Fastify, TypeScript, Prisma ORM
- **Datenbank**: PostgreSQL 16
- **Cache/Queue**: Redis mit BullMQ
- **Storage**: MinIO (S3-kompatibel)
- **Authentication**: JWT mit Refresh Tokens

### Monorepo-Struktur
```
e-rechnung/
├── apps/
│   ├── web/                 # Next.js Frontend
│   └── api/                 # Fastify Backend
├── packages/
│   ├── database/            # Prisma Schema
│   ├── types/               # Shared TypeScript Types
│   ├── ui/                  # Shadcn/ui Components
│   └── utils/               # Shared Utilities
├── docker-compose.yml       # Development Services
└── README.md
```

## 🚀 Schnellstart

### Voraussetzungen
- Node.js 18.17.0 oder höher
- Docker und Docker Compose
- Git

### Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd e-rechnung
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Environment-Variablen konfigurieren**
   ```bash
   cp .env.example .env.local
   # Bearbeite .env.local nach deinen Bedürfnissen
   ```

4. **Services starten (PostgreSQL, Redis, MinIO)**
   ```bash
   npm run docker:up
   ```

5. **Datenbank initialisieren**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed  # Optional: Testdaten laden
   ```

6. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

### Zugriff
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Adminer** (DB Management): http://localhost:8080
- **MinIO Console**: http://localhost:9001
- **MailHog** (Email Testing): http://localhost:8025

## 📚 Entwicklung

### Wichtige Kommandos

```bash
# Entwicklung
npm run dev                    # Starte Frontend + Backend
npm run dev:web               # Nur Frontend
npm run dev:api               # Nur Backend

# Build
npm run build                 # Build alle Workspaces
npm run build:web             # Nur Frontend
npm run build:api             # Nur Backend

# Datenbank
npm run db:generate           # Prisma Client generieren
npm run db:push              # Schema zu DB pushen
npm run db:migrate           # Migration erstellen/ausführen
npm run db:studio            # Prisma Studio öffnen
npm run db:seed              # Testdaten laden

# Docker
npm run docker:up            # Services starten
npm run docker:down          # Services stoppen
npm run docker:logs          # Logs anzeigen

# Tests & Qualität
npm run test                 # Alle Tests
npm run test:e2e            # E2E Tests
npm run lint                # Code-Qualität prüfen
npm run type-check          # TypeScript prüfen
```

### Workspace-Struktur

#### Frontend (`apps/web`)
- Next.js 14 mit App Router
- Shadcn/ui Components
- React Hook Form + Zod Validierung
- TanStack Query für API-Calls
- Recharts für Visualisierungen

#### Backend (`apps/api`)
- Fastify mit TypeScript
- Zod für Input-Validierung
- Prisma für Datenbankzugriff
- BullMQ für Job-Verarbeitung
- JWT Authentication

#### Packages
- `database`: Prisma Schema und Client
- `types`: Geteilte TypeScript-Typen
- `ui`: Wiederverwendbare UI-Komponenten
- `utils`: Utility-Funktionen

## 🎨 Design System

### Farbschema
- **Primary**: #2C2E3B (Dunkelgrau)
- **Secondary**: #4F46E5 (Indigo)
- **Success**: #10B981 (Grün)
- **Warning**: #F59E0B (Orange)
- **Error**: #EF4444 (Rot)

### Komponenten
- Basierend auf Radix UI Primitives
- Shadcn/ui als Component Library
- Tailwind CSS für Styling
- Dark/Light Mode Support

## 📋 Compliance & Sicherheit

### E-Rechnung
- **XRechnung 3.0.1** - Deutscher Standard
- **ZUGFeRD 2.3** - Hybrid-Format (PDF + XML)
- **Leitweg-ID** - Für Behörden-Rechnungen
- **Peppol** - Europäischer Standard

### Datenschutz & Sicherheit
- **DSGVO-konform** - Deutsche Datenschutz-Standards
- **GoBD-konform** - Grundsätze ordnungsgemäßer Buchführung
- **Verschlüsselung** - JWT Tokens, bcrypt Passwords
- **Audit-Log** - Alle kritischen Aktionen werden protokolliert

### Multi-Tenancy
- **Schema-per-Tenant** - Komplette Datentrennung
- **Subdomain-Routing** - firma.handwerkos.de
- **Role-based Access** - Granulare Berechtigungen

## 🚀 Deployment

### Production Build
```bash
# Build für Production
npm run build

# Start Production Server
npm run start
```

### Docker Production
```bash
# Build Docker Images
docker build -t handwerkos-web ./apps/web
docker build -t handwerkos-api ./apps/api

# Deploy mit Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
Siehe `.env.example` für alle verfügbaren Konfigurationsoptionen.

## 📈 Roadmap

### Q1 2024
- [x] Core ERP-Funktionen
- [x] E-Rechnung Export
- [x] Multi-Tenant Architektur
- [ ] Beta-Launch

### Q2 2024
- [ ] Erweiterte Projektmanagement-Features
- [ ] DATEV-Integration
- [ ] Mobile App (PWA)
- [ ] Advanced Analytics

### Q3 2024
- [ ] Banking-Integration
- [ ] Marketplace für Erweiterungen
- [ ] Enterprise Features
- [ ] Internationalisierung

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Erstelle einen Pull Request

## 📝 Lizenz

Dieses Projekt steht unter der MIT Lizenz. Siehe `LICENSE` Datei für Details.

## 💬 Support

- **GitHub Issues**: Für Bugs und Feature Requests
- **Dokumentation**: [docs.handwerkos.de](https://docs.handwerkos.de)
- **Community**: [Discord Server](https://discord.gg/handwerkos)

## 🙏 Danksagungen

- [Shadcn/ui](https://ui.shadcn.com/) für die großartigen UI-Komponenten
- [Prisma](https://prisma.io/) für die moderne Datenbank-Abstraktion
- [Fastify](https://www.fastify.io/) für das schnelle Backend-Framework
- Alle Contributors und Beta-Tester

---

**HandwerkOS** - Modernes ERP für das deutsche Handwerk 🔨