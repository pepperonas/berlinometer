# Anleitung: Automatische Energiedatenerfassung für GlitterHue

Mit dieser Anleitung kannst du eine server-seitige Datenerfassung einrichten, die kontinuierlich läuft - auch wenn der Browser geschlossen ist.

## 1. Benötigte Pakete installieren

Im Server-Verzeichnis:

```bash
cd /Users/martin/WebstormProjects/mrx3k1/glitter-hue/server
npm install axios
```

## 2. Energy Collector-Script erstellen

Erstelle die Datei `energy-collector.js` im Server-Verzeichnis:

```bash
touch energy-collector.js
```

Kopiere den Code aus dem bereitgestellten Artifact in diese Datei.

## 3. Script ausführen

Um das Script manuell zu starten:

```bash
node energy-collector.js
```

Bei der ersten Ausführung wirst du nach der Bridge-IP und dem API-Username gefragt. Dies sind die gleichen Zugangsdaten, die du in der Web-App verwendest.

## 4. Als Systemdienst einrichten (für Dauerbetrieb)

### Für macOS:

1. Erstelle eine .plist-Datei:

```bash
touch ~/Library/LaunchAgents/com.glitterhue.energycollector.plist
```

2. Füge folgenden Inhalt ein (passe die Pfade an):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.glitterhue.energycollector</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/martin/WebstormProjects/mrx3k1/glitter-hue/server/energy-collector.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/tmp/glitterhue.collector.err</string>
    <key>StandardOutPath</key>
    <string>/tmp/glitterhue.collector.out</string>
</dict>
</plist>
```

3. Lade und starte den Dienst:

```bash
launchctl load ~/Library/LaunchAgents/com.glitterhue.energycollector.plist
launchctl start com.glitterhue.energycollector
```

### Für Linux:

1. Erstelle eine systemd-Service-Datei:

```bash
sudo nano /etc/systemd/system/glitterhue-collector.service
```

2. Füge den Inhalt aus dem bereitgestellten Artifact ein (passe die Pfade an).

3. Aktiviere und starte den Dienst:

```bash
sudo systemctl enable glitterhue-collector
sudo systemctl start glitterhue-collector
```

## 5. Überprüfe die Datenerfassung

Nach einigen Minuten solltest du Daten in der MongoDB finden können:

```bash
cd /Users/martin/WebstormProjects/mrx3k1/glitter-hue/server
node check-db.js
```

## Konfiguration anpassen

Die Konfiguration wird in `server/collector-config.json` gespeichert. Hier kannst du folgende Einstellungen ändern:

- `interval`: Aktualisierungsintervall in Sekunden (Standard: 300)
- `energyCost`: Stromkosten pro kWh (Standard: 0.32 €)
- Leistungswerte der verschiedenen Lampentypen

## Anhalten des Collectors

### macOS:
```bash
launchctl stop com.glitterhue.energycollector
launchctl unload ~/Library/LaunchAgents/com.glitterhue.energycollector.plist
```

### Linux:
```bash
sudo systemctl stop glitterhue-collector
```

## Fehlerbehebung

- Die Logdateien findest du unter `/tmp/glitterhue.collector.*` (macOS) oder über `sudo journalctl -u glitterhue-collector` (Linux)
- Stelle sicher, dass deine Hue Bridge und dein Computer im selben Netzwerk sind
- Überprüfe die Bridge-IP und den Username in der Konfigurationsdatei