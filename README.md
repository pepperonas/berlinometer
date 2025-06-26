# Google Maps Auslastungsdaten-Scraper

Dieses Skript ermöglicht das automatisierte Abrufen und Speichern von Echtzeit-Auslastungsdaten von Bars in einem 5-km-Radius um die Flughafenstraße 24, 12053 Neukölln, Berlin.

## Installation

1. Stelle sicher, dass Node.js (Version 14 oder höher) installiert ist
2. Installiere die Abhängigkeiten:

```bash
npm install
```

3. Installiere die Playwright-Browser:

```bash
npx playwright install chromium
```

## Ausführung

```bash
npm start
```

## Ergebnisse

Die Ergebnisse werden in zwei JSON-Dateien im `~/Downloads`-Verzeichnis gespeichert:
- `bars_with_occupancy.json`: Bars mit Auslastungsdaten
- `bars_without_occupancy.json`: Bars ohne Auslastungsdaten

## Fehlerbehandlung

- Screenshots werden im Projektordner gespeichert zur Analyse
- Das Skript wartet automatisch zwischen den Klicks, um Stabilität zu gewährleisten
- Edge-Cases wie dauerhaft geschlossene Bars werden entsprechend behandelt

## Hinweise

- VPN kann standortbasierte Ergebnisse beeinflussen
- Google Maps-Spracheinstellungen können die Ergebnisse beeinflussen (DE bevorzugt)
