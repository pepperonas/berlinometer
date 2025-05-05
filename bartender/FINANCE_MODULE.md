# Finanzen-Modul für Bartender App

Diese Dokumentation enthält alle Informationen zur Einrichtung und Nutzung des Finanzen-Moduls der Bartender App, das es ermöglicht, Einnahmen und Ausgaben zu verwalten.

## Übersicht

Das Finanzen-Modul besteht aus folgenden Komponenten:

1. **Datenbank-Modelle**: 
   - `Expense.js` (Ausgaben)
   - `Income.js` (Einnahmen)

2. **API-Endpunkte**: 
   - `/api/finances/expenses` - CRUD-Operationen für Ausgaben
   - `/api/finances/income` - CRUD-Operationen für Einnahmen

3. **Frontend-Komponenten**:
   - `Finances.jsx` - Haupt-Finanzen-Seite
   - `ExpenseForm.jsx` - Formular für Ausgaben
   - `IncomeForm.jsx` - Formular für Einnahmen
   - `TransactionList.jsx` - Listenansicht für Transaktionen

## Einrichtung

### Voraussetzungen

- Node.js (v14+) und NPM
- MongoDB (v4+) 
- Die Bartender App muss installiert und konfiguriert sein

### Setup-Schritte

1. **Datenbank einrichten**:
   ```bash
   # Finanzen-Collections und Beispieldaten erstellen
   node ./server/scripts/setup-finances.js
   ```

2. **Server starten**:
   ```bash
   # Server mit Finanzen-Modul starten
   ./start-finances.sh
   ```

3. **API-Endpunkte testen**:
   ```bash
   # API-Endpunkte testen
   node ./server/scripts/test-finances-api.js
   ```

## Datenbankmodelle

### Ausgaben (Expense)

```javascript
{
  category: String,   // Kategorie, z.B. 'rent', 'utilities', 'inventory'
  amount: Number,     // Betrag in Euro
  date: Date,         // Datum der Ausgabe
  description: String, // Beschreibung
  recurring: Boolean, // Wiederkehrende Ausgabe?
  createdAt: Date,    // Erstellungsdatum
  updatedAt: Date     // Aktualisierungsdatum
}
```

### Einnahmen (Income)

```javascript
{
  category: String,   // Kategorie, z.B. 'bar', 'food', 'events'
  amount: Number,     // Betrag in Euro
  date: Date,         // Datum der Einnahme
  description: String, // Beschreibung
  createdAt: Date,    // Erstellungsdatum
  updatedAt: Date     // Aktualisierungsdatum
}
```

## API-Endpunkte

### Ausgaben

- `GET /api/finances/expenses` - Alle Ausgaben abrufen
- `GET /api/finances/expenses/:id` - Einzelne Ausgabe abrufen
- `POST /api/finances/expenses` - Neue Ausgabe erstellen
- `PUT /api/finances/expenses/:id` - Ausgabe aktualisieren
- `DELETE /api/finances/expenses/:id` - Ausgabe löschen

### Einnahmen

- `GET /api/finances/income` - Alle Einnahmen abrufen
- `GET /api/finances/income/:id` - Einzelne Einnahme abrufen
- `POST /api/finances/income` - Neue Einnahme erstellen
- `PUT /api/finances/income/:id` - Einnahme aktualisieren
- `DELETE /api/finances/income/:id` - Einnahme löschen

## Frontend-Komponenten

### Finances.jsx (Hauptseite)

Die Hauptseite zeigt:
- Übersichtskarten mit Gesamtbeträgen
- Tabs zum Umschalten zwischen Einnahmen und Ausgaben
- Listen der Transaktionen mit Sortier- und Filterfunktionen
- Buttons zum Hinzufügen, Bearbeiten und Löschen von Transaktionen

### ExpenseForm.jsx / IncomeForm.jsx

Formulare zur Erfassung und Bearbeitung von Ausgaben und Einnahmen mit:
- Kategorieauswahl
- Datumswahl
- Betragsangabe
- Beschreibungsfeld
- Option für wiederkehrende Ausgaben (nur bei Ausgaben)

### TransactionList.jsx

Komponente zur Anzeige von Transaktionen mit:
- Sortierung nach verschiedenen Spalten
- Filterung durch Suchfeld
- Detailansicht durch Klicken auf eine Zeile
- Bearbeiten- und Löschen-Buttons für jede Transaktion

## Fehlerbehebung

### API-Endpunkte nicht erreichbar

1. Prüfen Sie, ob der Server läuft
2. Testen Sie den Endpunkt mit `curl http://localhost:5024/api/finances/test`
3. Überprüfen Sie, ob die Datei `server/routes/finances.js` existiert
4. Stellen Sie sicher, dass in `server.js` die Zeile `app.use('/api/finances', require('./server/routes/finances'))` enthalten ist

### Datenbank-Fehler

1. Führen Sie `node ./server/scripts/test-mongodb.js` aus, um die allgemeine Datenbankverbindung zu testen
2. Prüfen Sie, ob die Collections `expenses` und `incomes` existieren
3. Führen Sie `node ./server/scripts/setup-finances.js` aus, um die Datenbank-Collections anzulegen

### Frontend zeigt keine Daten an

1. Stellen Sie sicher, dass die API-Endpunkte funktionieren
2. Überprüfen Sie die Browser-Konsole auf mögliche Fehler
3. Prüfen Sie, ob das Frontend die richtigen API-Endpunkte aufruft (siehe `src/services/api.js`)

## Erweiterungsmöglichkeiten

- Grafische Auswertungen (Diagramme, Statistiken)
- Export-Funktion für Finanzdaten (CSV, PDF)
- Budget-Planung und -Überwachung
- Integration mit dem Inventar-System
- Automatische Erinnerungen für wiederkehrende Ausgaben