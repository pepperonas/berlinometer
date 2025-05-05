# Einrichtung der Finanzen-Datenbank für Bartender

Diese Anleitung beschreibt, wie Sie die Finances-Funktionalität (Ausgaben und Einnahmen) für die Bartender-App vollständig einrichten.

## Voraussetzungen

- MongoDB-Datenbank ist bereits eingerichtet und erreichbar
- Node.js und npm sind installiert
- Projekt ist bereits geklont und installiert

## 1. Modelle und Routen hinzufügen

Alle benötigten Dateien wurden bereits erstellt:

- `/server/models/Expense.js` - Ausgaben-Modell
- `/server/models/Income.js` - Einnahmen-Modell
- `/server/routes/finances.js` - API-Routen für Finanzen
- `/server/utils/constants.js` wurde um INCOME_CATEGORIES erweitert
- `server.js` wurde aktualisiert, um die Finanz-Routen zu registrieren

## 2. Datenbankschema einrichten

Führen Sie das Setup-Skript aus, um die Datenbank zu initialisieren:

```bash
# Navigieren Sie zum Projektverzeichnis
cd /pfad/zum/bartender-projekt

# Führen Sie das Setup-Skript aus
node server/scripts/setup-finances.js
```

Das Skript führt folgende Aktionen aus:

1. Erstellt die Expense-Collection (Ausgaben-Tabelle)
2. Erstellt die Income-Collection (Einnahmen-Tabelle)
3. Fügt Beispieldaten für Ausgaben und Einnahmen hinzu
4. Zeigt eine Zusammenfassung der erstellten Datensätze an

## 3. Server neu starten

Nach der Einrichtung der Datenbank müssen Sie den Server neu starten:

```bash
# Mit PM2 (falls installiert)
pm2 restart server

# Oder direkt mit Node
node server.js
```

## 4. Testen der Finanz-Funktionalität

Nachdem der Server neu gestartet wurde, können Sie die Finanz-Funktionalität testen:

1. Öffnen Sie die Bartender-App in einem Browser
2. Navigieren Sie zur "Finanzen"-Seite
3. Sie sollten die Beispiel-Ausgaben und -Einnahmen sehen
4. Testen Sie das Hinzufügen, Bearbeiten und Löschen von Finanzen

## Fehlerbehebung

Falls Probleme auftreten:

1. Überprüfen Sie die Server-Logs auf Fehlermeldungen
2. Stellen Sie sicher, dass die MongoDB-Verbindungsdaten korrekt sind
3. Überprüfen Sie, ob die neuen Collections in der Datenbank erstellt wurden:
   ```
   mongo
   use bartender
   show collections
   db.expenses.find().pretty()
   db.incomes.find().pretty()
   ```

## Hinweise zur Weiterentwicklung

- Erweitern Sie die Kategorien nach Bedarf in `server/utils/constants.js`
- Für erweiterte Berichtsfunktionen können Sie zusätzliche Endpunkte in `server/routes/finances.js` hinzufügen
- Die Frontend-Komponenten sind bereits für die Nutzung mit echten Daten vorbereitet