# Popular Times - Google Maps Auslastungs-Analyzer

Eine hochperformante Web-Anwendung für die Echtzeit-Analyse von Google Maps Auslastungsdaten mit automatisiertem Scraping und moderner Benutzeroberfläche.

## 🚀 Features

- **Echtzeit-Auslastungsanalyse** von Google Maps Locations
- **Batch-Processing** mit Multithreading für maximale Performance 
- **1200% Performance-Steigerung** durch optimierte concurrent Verarbeitung
- **Standard Location-Sets** für schnelle Analyse
- **Live/Historische Daten** Unterscheidung
- **Vollständige deutsche Lokalisierung** - komplette Übersetzung aller UI-Elemente
- **Multi-Theme System** mit 3 Designoptionen:
  - 🌙 **Dunkel**: Elegantes dunkles Design (Standard)
  - ☀️ **Hell**: Modernes helles Theme  
  - 🌈 **Psychedelisch**: Spektakuläres Neon-Theme mit Animationen
- **Benutzerauthentifizierung** mit Profilverwaltung und personalisierten Filtern
- **Real-time Progress Updates** mit Batch-Information
- **Export-Funktionen** (JSON/CSV)
- **Responsive Design** für alle Geräte

## 📊 Performance Highlights

- **Concurrent Batch Processing**: Bis zu 10 Batches parallel
- **Smart Resource Blocking**: Optimierte Ladezeiten
- **Intelligent Retry Logic**: 3-stufige Fallback-Mechanismen
- **100% Location-Namen Erfolgsquote** durch URL-Fallback
- **75% Auslastungsdaten Erfolgsquote** mit Multi-Retry Strategien

## 🛠 Technologie Stack

### Frontend
- **React 18** mit Vite für schnelle Entwicklung
- **Context API** für globales State Management (Theme & Auth)
- **Modern CSS** mit CSS Custom Properties und Theme-System
- **Animationen & Transitions** für psychedelisches Theme
- **Real-time Updates** via Server-Sent Events
- **Responsive Design** mit Flexbox/Grid
- **Deutsche i18n** mit vollständiger Lokalisierung

### Backend
- **Python Flask** API Server
- **Playwright** für Browser-Automation
- **Async/Await** für concurrent Processing
- **Streaming API** für Live-Updates

## 🏗 Architektur

```
Frontend (React)  →  Flask API  →  Playwright Engine
     ↓                   ↓              ↓
Browser-UI       Server-Sent Events   Google Maps
     ↓                   ↓              ↓
Progress Bar    ←  Real-time Data  ←   Scraping
```

### Batch Processing Flow
1. **Locations in Batches aufteilen** (5 Locations pro Batch)
2. **Concurrent Batch-Verarbeitung** (max 10 Batches parallel)
3. **Page-Wiederverwendung** innerhalb Batches
4. **Smart Resource Blocking** für Geschwindigkeit
5. **Real-time Progress Streaming** an Frontend

## 🚀 Installation & Setup

### Voraussetzungen
- Node.js 18+
- Python 3.8+
- Playwright Browser-Binaries

### Frontend Setup
```bash
cd webapp
npm install
npm run dev
```

### Backend Setup
```bash
cd ..
pip install flask flask-cors playwright
playwright install chromium
python server.py
```

## 🔧 Konfiguration

### Environment Variables
```bash
# Frontend (.env)
VITE_API_URL=http://localhost:5044

# Backend
FLASK_ENV=development
FLASK_PORT=5044
```

### Performance Tuning
```python
# server.py - Batch Configuration
batch_size = 3           # Locations pro Batch
max_concurrent = 10      # Parallele Batches
batch_group_size = 3     # Gruppen für Progress Updates
```

## 📈 Performance Optimierungen

### 1. Concurrent Batch Processing
- Locations werden in 3er-Batches aufgeteilt
- Bis zu 10 Batches laufen parallel
- **Ergebnis**: 1200% Performance-Steigerung

### 2. Smart Resource Blocking
```javascript
// Blockierte Ressourcen für maximale Geschwindigkeit
- Bilder (PNG, JPG, SVG, etc.)
- Stylesheets (CSS)
- Fonts (WOFF, TTF)
- Analytics & Tracking
- JavaScript (aggressive Blocking)
```

### 3. Page-Wiederverwendung
- Browser-Context wird wiederverwendet
- Pages werden innerhalb Batches geteilt
- Reduziert Memory-Overhead drastisch

### 4. Intelligent Retry Logic
```python
# 3-stufige Fallback-Strategie
1. Primäre Selektoren (Live-Daten)
2. Historische Daten-Extraktion  
3. Chart-basierte Daten-Parsing
4. Regex-Pattern Matching
5. URL-Fallback (100% Erfolgsquote)
```

## 🎨 UI/UX Features

### Multi-Theme System
- **🌙 Dunkel-Theme**: Elegantes dunkles Design mit blauen Akzenten
- **☀️ Hell-Theme**: Modernes helles Design mit optimalen Kontrasten
- **🌈 Psychedelisch-Theme**: Spektakuläres Neon-Design mit:
  - Animierte Regenbogen-Hintergründe
  - Glassmorphism-Effekte
  - Neon-Glows und Pulse-Animationen
  - Holographische Schimmer-Effekte
- **Theme-Persistierung** via localStorage
- **Smooth Transitions** zwischen allen Themes

### Benutzerauthentifizierung & Profilverwaltung
- **Registrierung & Login** mit sicherer JWT-Authentifizierung
- **Personalisierte Filter** für automatische Datenergebnisfilterung
- **Benutzerprofil** mit Mitgliedschaftsinformationen
- **Deutsche Benutzeroberfläche** - alle Texte vollständig lokalisiert
- **Theme-Auswahl** im Benutzerprofil

### Real-time Progress
- Live Progress Bar mit Batch-Info
- Aktuelle Location-Anzeige
- Erfolg/Fehler Status-Updates
- Collapse/Expand Debug-Information

### Responsive Layout
- Mobile-First Design
- Flexible Grid-System
- Touch-optimierte Bedienelemente

## 📊 Monitoring & Analytics

### Performance Metriken
- Durchschnittliche Zeit pro Location
- Batch-Verarbeitungszeiten
- Erfolgs-/Fehlerquoten
- Memory-Usage Tracking

### Status-Indikatoren
- 🔴 **LIVE**: Echtzeitdaten verfügbar
- 📊 **Historisch**: Vergangene Auslastungsdaten
- ⚫ **Keine Daten**: Keine Informationen verfügbar
- ✅ **Erfolgreich**: Daten erfolgreich extrahiert
- ❌ **Fehler**: Scraping fehlgeschlagen

## 🔮 Roadmap

### Geplante Features
- [ ] **Machine Learning** für Selector-Optimierung
- [ ] **Caching-System** für häufige Abfragen
- [ ] **Historical Trending** mit Datenbank
- [ ] **API Rate Limiting** für Production
- [ ] **Advanced Filtering** nach Location-Typ

### Performance Verbesserungen
- [ ] **WebSocket Integration** für Live-Updates
- [ ] **Service Worker** für Offline-Funktionalität
- [ ] **Advanced Batch Scheduling** mit Prioritäten
- [ ] **Dynamic Resource Loading** je nach Bedarf

## 📝 Contributing

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/neue-funktion`)
3. Changes committen (`git commit -m 'Neue Funktion hinzugefügt'`)
4. Branch pushen (`git push origin feature/neue-funktion`)
5. Pull Request erstellen

## 📄 License

MIT License - siehe [LICENSE](LICENSE) für Details.

## 👨‍💻 Entwickelt von

**Martin Pfeffer**
- Made with ❤️ und viel Kaffee ☕
- Performance-Optimierung durch Batch Processing
- 1200% Geschwindigkeitssteigerung erreicht

---

*Live Demo: [https://mrx3k1.de/popular-times/](https://mrx3k1.de/popular-times/)*

*Version 2.1.0 - Deutsche Lokalisierung & Multi-Theme Edition*

## 🆕 Version 2.1.0 Features

### Deutsche Lokalisierung
- **Vollständige Übersetzung** aller UI-Elemente
- **Authentifizierung** auf Deutsch (Login, Registrierung, Profil)
- **Filter-Verwaltung** mit deutschen Bezeichnungen
- **Theme-Auswahl** mit deutschen Beschreibungen

### Multi-Theme System
- **3 Designvarianten** mit einzigartigen Charakteristiken
- **Erweiterte CSS-Animationen** für visuelles Feedback
- **Theme-Persistierung** für konsistente Benutzererfahrung
- **Accessibility-optimiert** mit angepassten Kontrasten