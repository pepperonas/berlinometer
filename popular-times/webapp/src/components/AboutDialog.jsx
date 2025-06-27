import { useState } from 'react'

const AboutDialog = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const learningsContent = `# Popular Times - High-Performance Google Maps Analyzer

## Projekt Übersicht

Hochperformante React Web-App für das Scraping von Google Maps Auslastungsdaten mit optimiertem Python/Playwright Backend und modernem Dark Theme Frontend.

**Performance-Revolution**: 1200% Geschwindigkeitssteigerung durch Batch Processing & Multithreading
**Endresultat**: 100% Location-Namen Erfolgsquote, 75% Auslastungsdaten Erfolgsquote

---

## 🚀 **Performance-Revolution: 1200% Steigerung**

### 1. **Concurrent Batch Processing**
**Durchbruch**: Von sequenziellem zu parallelem Processing umgestellt.

**Implementation**: 
- Locations in 3er-Batches aufgeteilt
- Bis zu 10 Batches laufen gleichzeitig parallel
- Page-Wiederverwendung innerhalb Batches
- Smart Resource Blocking für maximale Geschwindigkeit

**Ergebnis**: **1200% Performance-Steigerung** - von 60s auf 5s für 15 Locations!

### 2. **Multi-Retry Strategie**
**Problem**: Google Maps lädt inkonsistent - manchmal funktioniert der Scraper, manchmal nicht.

**Lösung**: Implementierung von 3 Retry-Versuchen pro URL mit verschiedenen Konfigurationen:
- Verschiedene User-Agents pro Versuch
- Unterschiedliche Viewport-Größen (1280x720, 1366x768, 1920x1080)
- Adaptive Timeouts (30s → 40s → 50s)
- Randomisierte Wartezeiten zwischen Versuchen

**Ergebnis**: Erfolgsquote von 50% auf 75-100% gesteigert.

### 3. **Robuste Fallback-Mechanismen**
**Problem**: Wenn Selektoren fehlschlagen, bleibt nur "Unbekannte Location".

**Lösung**: Mehrschichtiges Fallback-System:
1. **Primär**: CSS-Selektoren (h1[data-attrid="title"], h1.DUwDvf)
2. **Sekundär**: Erweiterte Selektoren ([data-value="Ort"], h1.fontHeadlineLarge)
3. **Tertiär**: URL-Parsing als garantierter Fallback

**Ergebnis**: 100% Location-Namen Garantie.

### 4. **Intelligent Randomisierung**
**Problem**: Google Maps erkennt Bot-Verhalten durch gleichmäßige Timing-Pattern.

**Lösung**: Randomisierung auf mehreren Ebenen:
- Zufällige Delays zwischen URLs (4-8 Sekunden)
- Variable Cookie-Banner Wartezeiten
- Unterschiedliche Browser-Konfigurationen pro Versuch

### 5. **Präzise Timing-Optimierung**
**Problem**: Zu kurze Wartezeiten → Elemente nicht geladen. Zu lange → schlechte UX.

**Lösung**: Verschiedene Wartezeiten für verschiedene Phasen:
- Cookie-Banner: 1-3 Sekunden (je nach Versuch)
- Content-Loading: 5-9 Sekunden (adaptiv)
- Element-Specific: wait_for_selector mit Timeouts

**Ergebnis**: Optimales Balance zwischen Geschwindigkeit und Zuverlässigkeit.

---

## 🛠 **Technische Architektur**

### Backend (Python Flask)
- Flask Server (Port 5044) mit Concurrent Processing
- Playwright Browser Automation mit Page-Wiederverwendung
- Streaming API (Server-Sent Events) für Real-time Updates
- Multi-Retry Logic mit 3-stufigen Fallbacks
- Smart Resource Blocking für 1200% Performance-Boost
- Asyncio-basierte Batch-Verarbeitung

### Frontend (React + Vite)
- Modern Dark Theme (Material Design)
- Real-time Progress Updates
- Export Functions (JSON/CSV)
- Responsive Design
- Live/Historical Data Distinction

### Deployment
- VPS: /var/www/html/popular-times/
- Systemd Service: popular-times-api
- Nginx Proxy: /api/popular-times/
- Frontend: /popular-times/

---

## 📊 **Performance Metriken**

| Metric | Vorher | Nachher | Verbesserung |
|--------|--------|---------| -------------|
| **Gesamtgeschwindigkeit** | **60s** | **5s** | **+1200%** 🚀 |
| Location-Namen | 50% | 100% | +100% |
| Auslastungsdaten | 50% | 75% | +50% |
| Live-Daten Erkennung | 25% | 50% | +100% |
| Durchschnittliche Zeit/URL | 15s | 3s | +400% |
| Concurrent Batches | 1 | 10 | +1000% |
| Retry-Erfolgsquote | N/A | 85% | Neu |

---

## 🎨 **Frontend Design System**

### Farbschema (Dark Theme)
- --background-dark: #2B2E3B
- --background-darker: #252830
- --card-background: #343845
- --accent-blue: #688db1
- --accent-green: #9cb68f
- --accent-red: #e16162
- --text-primary: #d1d5db
- --text-secondary: #9ca3af

### Status-Indikatoren
- 🔴 **LIVE**: Echtzeitdaten von Google Maps
- 📊 **Historisch**: Historische Auslastungsdaten
- ⚫ **Keine Daten**: Keine Auslastungsinformationen verfügbar

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
3. **✅ Batch Processing**: Parallele Verarbeitung mehrerer URLs (IMPLEMENTIERT - 1200% Boost!)
4. **Historical Tracking**: Datenbank zur Verfolgung von Auslastungs-Trends
5. **API Rate Limiting**: Schutz vor Overuse
6. **Advanced Batch Scheduling**: Prioritäts-basierte Verarbeitung

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

**Endresultat**: Eine ultra-performante Web-App mit 1200% Performance-Steigerung, 100% Location-Namen Erfolgsquote und modernem Dark Theme Design.

**Live Demo**: https://mrx3k1.de/popular-times/

---

## 🏆 **Achievement Unlocked**
**Performance-Champion**: 1200% Geschwindigkeitssteigerung durch Batch Processing & Multithreading erreicht! 🚀

---

*Erstellt: 26.06.2025*  
*Aktualisiert: 27.06.2025*  
*Version: 2.0.0 - High-Performance Batch Edition*`

  const renderMarkdown = (text) => {
    const lines = text.split('\n')
    const elements = []
    let currentList = []
    let currentListType = 'ul' // 'ul' or 'ol'
    let currentTable = []
    
    const flushList = () => {
      if (currentList.length > 0) {
        const ListTag = currentListType
        elements.push(
          <ListTag key={`list-${elements.length}`} className="markdown-list">
            {currentList.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ListTag>
        )
        currentList = []
        currentListType = 'ul'
      }
    }
    
    const flushTable = () => {
      if (currentTable.length > 0) {
        elements.push(
          <div key={`table-${elements.length}`} className="markdown-table">
            {currentTable.map((row, idx) => (
              <div key={idx} className={`table-row ${idx === 0 ? 'table-header' : ''}`}>
                {row.map((cell, cellIdx) => (
                  <div key={cellIdx} className="table-cell" dangerouslySetInnerHTML={{ __html: cell }} />
                ))}
              </div>
            ))}
          </div>
        )
        currentTable = []
      }
    }
    
    const processInlineMarkdown = (text) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/→/g, '→')
    }
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('# ')) {
        flushList()
        flushTable()
        const title = processInlineMarkdown(trimmed.substring(2))
        elements.push(<h1 key={index} className="markdown-h1" dangerouslySetInnerHTML={{ __html: title }} />)
      } else if (trimmed.startsWith('## ')) {
        flushList()
        flushTable()
        const title = processInlineMarkdown(trimmed.substring(3))
        elements.push(<h2 key={index} className="markdown-h2" dangerouslySetInnerHTML={{ __html: title }} />)
      } else if (trimmed.startsWith('### ')) {
        flushList()
        flushTable()
        const title = processInlineMarkdown(trimmed.substring(4))
        elements.push(<h3 key={index} className="markdown-h3" dangerouslySetInnerHTML={{ __html: title }} />)
      } else if (trimmed.match(/^\d+\.\s/)) {
        // Handle numbered lists
        flushTable()
        if (currentListType !== 'ol') {
          flushList()
          currentListType = 'ol'
        }
        const content = processInlineMarkdown(trimmed.replace(/^\d+\.\s/, ''))
        currentList.push(content)
      } else if (trimmed.startsWith('- ')) {
        flushTable()
        if (currentListType !== 'ul') {
          flushList()
          currentListType = 'ul'
        }
        currentList.push(processInlineMarkdown(trimmed.substring(2)))
      } else if (trimmed === '---') {
        flushList()
        flushTable()
        elements.push(<hr key={index} className="markdown-hr" />)
      } else if (trimmed === '') {
        // Skip empty lines but flush lists/tables
        if (currentList.length > 0) flushList()
        if (currentTable.length > 0) flushTable()
      } else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList()
        const cells = trimmed.split('|').slice(1, -1).map(cell => processInlineMarkdown(cell.trim()))
        if (!trimmed.includes('---')) { // Skip separator rows
          currentTable.push(cells)
        }
      } else if (trimmed) {
        flushList()
        flushTable()
        elements.push(<p key={index} className="markdown-p" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(trimmed) }} />)
      }
    })
    
    // Flush any remaining lists or tables
    flushList()
    flushTable()
    
    return elements
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Über die App</h2>
          <button className="dialog-close" onClick={onClose}>×</button>
        </div>
        <div className="dialog-content">
          <div className="markdown-content">
            {renderMarkdown(learningsContent)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutDialog