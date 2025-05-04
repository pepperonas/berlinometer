# Fehlersuche für path-to-regexp Fehler

Der Fehler "Missing parameter name at 1: https://git.new/pathToRegexpError" tritt bei der Express-Routenbehandlung auf. Dies ist ein Fehler in der path-to-regexp Bibliothek, die von Express zur Verarbeitung von URL-Pfaden verwendet wird.

## Problematische Routen

Der Fehler tritt auf, wenn eine Route falsch formatiert ist oder einen ungültigen Pfadparameter enthält.

In der Fehlermeldung sehen wir:
```
TypeError: Missing parameter name at 1: https://git.new/pathToRegexpError
```

Das bedeutet, dass irgendwo in der Anwendung eine Route definiert ist, die versucht, den Text "https://git.new/pathToRegexpError" als Pfad zu verwenden, was für Express ungültig ist.

## Lösungsschritte

1. **Überprüfen Sie alle besonders verdächtigen Routen in Ihren Router-Dateien:**
   - `/api/sales/date/:start/:end` in sales.js
   - Routen mit Doppelpunkten wie `/api/drinks/:id`

2. **Suchen Sie nach Fehlern bei der Routendefinition**:
   - Eine Route wie `router.get('https://git.new/pathToRegexpError', ...)` wäre ungültig
   - Suchen Sie nach Routendefinitionen, die eine vollständige URL anstelle eines relativen Pfads verwenden

3. **Überprüfen Sie die Sortierung der Routen**:
   - In der Datei `server/routes/drinks.js` könnte es ein Problem geben, dass die Route `/api/drinks/popular/list` nach der Route `/:id` definiert ist
   - Express verarbeitet Routen in der Reihenfolge, in der sie definiert sind

4. **Überprüfen Sie sales.js**:
   - Die Route `/date/:start/:end` sollte vor allgemeineren Routen wie `/:id` definiert werden

## Beispiel für die Korrektur in drinks.js

```javascript
// Zuerst konkrete Routen definieren
router.get('/popular/list', async (req, res) => {
  // ...
});

// Danach Platzhalter-Routen definieren
router.get('/:id', async (req, res) => {
  // ...
});
```

## Überprüfen Sie alle Module auf falsche URL-Verwendungen

Überprüfen Sie auch, ob in Ihrer Anwendung versehentlich eine vollständige URL als Pfad in einer Route verwendet wird:

```javascript
// FALSCH:
router.get('https://git.new/pathToRegexpError', ...)

// RICHTIG:
router.get('/pfad', ...)
```