# Keyboard Logger

Ein einfacher Keyboard-Logger bestehend aus Express.js Server und Browser-Client für Entwicklungs- und Testzwecke.

## Voraussetzungen

- Node.js (v14+)
- npm

## Installation

```bash
# Dependencies installieren
npm install express cors
```

## Verwendung

### 1. Server starten

```bash
node express_server.js
```

Der Server läuft auf `http://localhost:3000` und zeigt eingehende Tastatureingaben in der Konsole an.

### 2. Client aktivieren

1. Öffne eine beliebige Website im Browser
2. Öffne die Entwicklertools (F12)
3. Gehe zur Konsole
4. Kopiere den kompletten Code aus `keyboard_logger.js` und füge ihn ein
5. Drücke Enter zum Ausführen

### 3. Testen

- Tippe auf der Website - alle Tastatureingaben werden an den Server gesendet
- Server-Konsole zeigt: Taste, Zeitstempel, URL und HTML-Element

## Ausgabe-Format

```
Key pressed: a at 14:25:30
URL: https://example.com
Target: INPUT
---
```

## Deaktivierung

Browser-Tab schließen oder Seite neu laden.

## ⚠️ Hinweis

Nur für eigene Entwicklungs- und Testzwecke verwenden. Respektiere Datenschutz und lokale Gesetze.