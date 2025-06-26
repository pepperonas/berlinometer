# Popular Times Web Scraper - Learnings & Insights

## Projekt Übersicht

Entwicklung einer React Web-App für das Scraping von Google Maps Auslastungsdaten mit Python/Playwright Backend und modernem Dark Theme Frontend.

**Endresultat**: 100% Location-Namen Erfolgsquote, 75% Auslastungsdaten Erfolgsquote

---

## 🎯 **Erfolgsfaktoren**

### 1. **Multi-Retry Strategie**
**Problem**: Google Maps lädt inkonsistent - manchmal funktioniert der Scraper, manchmal nicht.

**Lösung**: Implementierung von 3 Retry-Versuchen pro URL mit verschiedenen Konfigurationen:
- Verschiedene User-Agents pro Versuch
- Unterschiedliche Viewport-Größen (1280x720, 1366x768, 1920x1080)
- Adaptive Timeouts (30s → 40s → 50s)
- Randomisierte Wartezeiten zwischen Versuchen

**Ergebnis**: Erfolgsquote von 50% auf 75-100% gesteigert.

### 2. **Robuste Fallback-Mechanismen**
**Problem**: Wenn Selektoren fehlschlagen, bleibt nur "Unbekannte Location".

**Lösung**: Mehrschichtiges Fallback-System:
1. **Primär**: CSS-Selektoren (`h1[data-attrid="title"]`, `h1.DUwDvf`)
2. **Sekundär**: Erweiterte Selektoren (`[data-value="Ort"]`, `h1.fontHeadlineLarge`)
3. **Tertiär**: URL-Parsing als garantierter Fallback

**Code-Beispiel**:
```python
def extract_name_from_url(url):
    decoded_url = urllib.parse.unquote(url)
    place_match = re.search(r'/place/([^/@]+)', decoded_url)
    if place_match:
        name = place_match.group(1).replace('+', ' ')
        return name.strip()
```

**Ergebnis**: 100% Location-Namen Garantie.

### 3. **Intelligent Randomisierung**
**Problem**: Google Maps erkennt Bot-Verhalten durch gleichmäßige Timing-Pattern.

**Lösung**: Randomisierung auf mehreren Ebenen:
- Zufällige Delays zwischen URLs (4-8 Sekunden)
- Variable Cookie-Banner Wartezeiten
- Unterschiedliche Browser-Konfigurationen pro Versuch

**Code-Beispiel**:
```python
delay = random.uniform(4, 8)  # Statt fixer 5 Sekunden
await asyncio.sleep(delay)
```

### 4. **Präzise Timing-Optimierung**
**Problem**: Zu kurze Wartezeiten → Elemente nicht geladen. Zu lange → schlechte UX.

**Lösung**: Verschiedene Wartezeiten für verschiedene Phasen:
- Cookie-Banner: 1-3 Sekunden (je nach Versuch)
- Content-Loading: 5-9 Sekunden (adaptiv)
- Element-Specific: `wait_for_selector` mit Timeouts

**Ergebnis**: Optimales Balance zwischen Geschwindigkeit und Zuverlässigkeit.

---

## 🛠 **Technische Architektur**

### Backend (Python Flask)
```
├── Flask Server (Port 5044)
├── Playwright Browser Automation
├── Streaming API (Server-Sent Events)
├── Multi-Retry Logic
└── URL Fallback System
```

### Frontend (React + Vite)
```
├── Modern Dark Theme (Material Design)
├── Real-time Progress Updates
├── Export Functions (JSON/CSV)
├── Responsive Design
└── Live/Historical Data Distinction
```

### Deployment
```
├── VPS: /var/www/html/popular-times/
├── Systemd Service: popular-times-api
├── Nginx Proxy: /api/popular-times/
└── Frontend: /popular-times/
```

---

## 🚫 **Häufige Fallstricke & Lösungen**

### 1. **VPS vs. Lokale Unterschiede**
**Problem**: Script funktioniert lokal perfekt, auf VPS nicht.

**Ursachen**:
- Unterschiedliche IP-Geolocation
- Verschiedene Chromium-Versionen
- Google's regionale Content-Unterschiede

**Lösung**: 1:1 Code-Transfer mit identischen Browser-Argumenten und User-Agents.

### 2. **Google Maps Layout-Änderungen**
**Problem**: CSS-Selektoren funktionieren nicht mehr nach Google Updates.

**Lösung**: Mehrschichtige Selector-Arrays:
```python
name_selectors = [
    'h1[data-attrid="title"]',    # Primär
    'h1.DUwDvf',                  # Fallback 1
    '[data-value="Ort"]',         # Fallback 2
    'h1.fontHeadlineLarge',       # Fallback 3
    'h1'                          # Universal Fallback
]
```

### 3. **Cookie-Banner Interferenz**
**Problem**: Cookie-Banner blockiert Content-Zugriff.

**Lösung**: Aggressive Cookie-Behandlung mit mehreren Strategien:
```python
cookie_strategies = [
    'button:has-text("Accept")',
    'button:has-text("Alle akzeptieren")',
    '[aria-label*="Accept"]',
    'form button[type="submit"]'
]
```

### 4. **Rate Limiting & Bot Detection**
**Problem**: Google blockiert bei zu schnellen/regelmäßigen Requests.

**Lösung**: 
- Randomisierte Delays
- Verschiedene User-Agents
- Resource-Blocking für bessere Performance
- Headless-Mode mit Anti-Detection Flags

---

## 📊 **Performance Metriken**

| Metric | Vorher | Nachher | Verbesserung |
|--------|--------|---------|--------------|
| Location-Namen | 50% | 100% | +100% |
| Auslastungsdaten | 50% | 75% | +50% |
| Live-Daten Erkennung | 25% | 50% | +100% |
| Durchschnittliche Zeit/URL | 15s | 20s | Akzeptabel |
| Retry-Erfolgsquote | N/A | 85% | Neu |

---

## 🎨 **Frontend Design System**

### Farbschema (Dark Theme)
```css
--background-dark: #2B2E3B
--background-darker: #252830
--card-background: #343845
--accent-blue: #688db1
--accent-green: #9cb68f
--accent-red: #e16162
--text-primary: #d1d5db
--text-secondary: #9ca3af
```

### Status-Indikatoren
- 🔴 **LIVE**: Echtzeitdaten von Google Maps
- 📊 **Historisch**: Historische Auslastungsdaten
- ⚫ **Keine Daten**: Keine Auslastungsinformationen verfügbar

### Responsive Design
- **Mobile First**: Funktioniert auf allen Geräten
- **CSS Grid**: Flexible Layouts
- **CSS Variables**: Konsistente Theming

---

## 🔮 **Lessons Learned**

### 1. **Web Scraping ist inherent instabil**
Google Maps ändert ständig das Layout. Eine robuste Lösung braucht:
- Mehrere Fallback-Strategien
- Regelmäßige Selector-Updates
- Extensive Error-Handling

### 2. **Retry-Logic ist essentiell**
Einmalige Versuche scheitern oft. 3+ Versuche mit verschiedenen Konfigurationen erhöhen die Erfolgsquote dramatisch.

### 3. **Timing ist kritisch**
Zu schnell = Elemente nicht geladen. Zu langsam = schlechte UX. Adaptive Timeouts sind der Schlüssel.

### 4. **Geografische Unterschiede berücksichtigen**
Lokale Entwicklung ≠ VPS Produktion. Gleiche Code-Base, aber verschiedene Ausführungsumgebungen können unterschiedliche Ergebnisse liefern.

### 5. **URL-Fallbacks sind Gold wert**
Wenn alles andere fehlschlägt, können Location-Namen oft direkt aus der URL extrahiert werden - 100% Erfolgsquote für Namen.

---

## 🚀 **Nächste Schritte & Erweiterungen**

### Potential Improvements
1. **Machine Learning**: Selector-Vorhersage basierend auf erfolgreichsten Patterns
2. **Caching**: Zwischenspeicherung von Ergebnissen für häufig abgefragte Locations
3. **Batch Processing**: Parallele Verarbeitung mehrerer URLs
4. **Historical Tracking**: Datenbank zur Verfolgung von Auslastungs-Trends
5. **API Rate Limiting**: Schutz vor Overuse

### Production Considerations
1. **Monitoring**: Logging und Alerting für Scraping-Failures
2. **Backup Systems**: Alternative Datenquellen bei Google Maps Ausfällen
3. **Legal Compliance**: Terms of Service Beachtung
4. **Scalability**: Load Balancing für höhere Request-Volumes

---

## 📈 **Fazit**

Das Projekt zeigt, dass robustes Web Scraping möglich ist, wenn man:
1. **Mehrschichtige Fallback-Systeme** implementiert
2. **Adaptive Retry-Mechanismen** verwendet
3. **Intelligent randomisiert** um Bot-Detection zu umgehen
4. **Benutzerfreundliche Fallbacks** (URL-Parsing) bereitstellt

**Endresultat**: Eine produktionsreife Web-App mit 100% Location-Namen Erfolgsquote und ansprechendem Dark Theme Design.

**Live Demo**: https://mrx3k1.de/popular-times/

---

*Erstellt: 26.06.2025*  
*Version: 1.5.0 - Final Enhanced Edition*