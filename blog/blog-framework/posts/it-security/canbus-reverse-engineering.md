---
title: "CAN-Bus Reverse-Engineering: Automotive-Netzwerke verstehen und analysieren"
date: "2025-06-22"
excerpt: "Ein praxisorientierter Leitfaden zum Reverse-Engineering von CAN-Bus-Systemen in modernen Fahrzeugen mit Tools, Techniken und Sicherheitsaspekten."
tags: ["CAN-Bus", "Automotive-Security", "Reverse-Engineering", "IoT-Security", "Hardware-Hacking"]
---

# CAN-Bus Reverse-Engineering: Automotive-Netzwerke verstehen und analysieren

Moderne Fahrzeuge sind rollende Computer mit Dutzenden von elektronischen Steuergeräten (ECUs), die über verschiedene Bussysteme miteinander kommunizieren. Der Controller Area Network (CAN) Bus ist dabei das Rückgrat der meisten Automotive-Netzwerke. Für Security-Researcher, Penetration-Tester und Automotive-Entwickler ist das Verständnis und die Analyse dieser Systeme essentiell. In diesem Beitrag erfährst du, wie CAN-Bus Reverse-Engineering funktioniert und welche Tools und Techniken dabei zum Einsatz kommen.

## Was ist der CAN-Bus?

Der Controller Area Network (CAN) Bus wurde 1983 von Bosch entwickelt und ist heute der de-facto Standard für die Fahrzeugkommunikation. Im Gegensatz zu herkömmlichen Punkt-zu-Punkt-Verbindungen ermöglicht CAN eine Multi-Master-Architektur, bei der mehrere Steuergeräte gleichzeitig auf das Netzwerk zugreifen können.

### Grundlegende CAN-Bus-Eigenschaften

- **Datenrate**: Typisch 125 kbps bis 1 Mbps (CAN 2.0), bis zu 8 Mbps (CAN-FD)
- **Topologie**: Lineare Bus-Struktur mit 120Ω Terminierung an beiden Enden
- **Arbitrierung**: CSMA/CA (Carrier Sense Multiple Access/Collision Avoidance)
- **Nachrichtenlänge**: Bis zu 8 Bytes Payload (64 Bytes bei CAN-FD)

## Warum CAN-Bus Reverse-Engineering?

Das Reverse-Engineering von CAN-Bus-Systemen dient verschiedenen Zwecken:

### Security-Assessment
Automotive Security-Researcher nutzen Reverse-Engineering, um Schwachstellen in Fahrzeugsystemen zu identifizieren. Da moderne Autos über Bluetooth, WiFi und Mobilfunk mit der Außenwelt verbunden sind, können Angreifer potenziell auf kritische Fahrzeugsysteme zugreifen.

### Aftermarket-Entwicklung
Entwickler von Nachrüstlösungen müssen verstehen, wie bestehende Fahrzeugsysteme kommunizieren, um kompatible Produkte zu entwickeln. Dies reicht von Performance-Tuning bis hin zu diagnostischen Tools.

### Forensische Analyse
Nach Unfällen oder Sicherheitsvorfällen können CAN-Bus-Daten wichtige Erkenntnisse über die Fahrzeugzustände zum Zeitpunkt des Ereignisses liefern.

## Grundlagen der CAN-Frame-Struktur

Bevor wir ins Reverse-Engineering einsteigen, ist es wichtig, die Struktur von CAN-Nachrichten zu verstehen:

```
Standard CAN-Frame (11-bit ID):
┌─────────────┬─────┬─────┬─────┬──────────────┬─────────┬─────────┬─────┐
│ SOF │  ID   │ RTR │ IDE │ r0  │     DLC      │  DATA   │   CRC   │ EOF │
│  1  │  11   │  1  │  1  │  1  │      4       │  0-64   │   16    │  7  │
└─────────────┴─────┴─────┴─────┴──────────────┴─────────┴─────────┴─────┘
```

- **ID (Identifier)**: Eindeutige Nachrichten-ID (11-bit Standard, 29-bit Extended)
- **DLC (Data Length Code)**: Anzahl der Datenbytes (0-8)
- **DATA**: Nutzdaten (0-8 Bytes)

## Tools für CAN-Bus Reverse-Engineering

### Hardware-Tools

**CAN-USB-Adapter**
Die kostengünstigste Lösung sind USB-zu-CAN-Adapter wie der CANtact oder Peak PCAN-USB. Diese ermöglichen es, einen Computer direkt mit dem CAN-Bus zu verbinden.

**OBD-II-Dongles**
Für moderne Fahrzeuge (ab 1996 in den USA, ab 2001 in Europa) bietet der OBD-II-Port direkten Zugang zum CAN-Bus. Viele günstige ELM327-basierte Adapter sind verfügbar.

**Professionelle Hardware**
Für ernsthafte Analyse sind Tools wie der CANoe von Vector oder der CANanalyzer empfehlenswert, die erweiterte Funktionen für Protokollanalyse und Simulation bieten.

### Software-Tools

**can-utils (Linux)**
Das can-utils-Paket bietet eine umfassende Sammlung von Kommandozeilen-Tools:

```bash
# CAN-Interface aktivieren
sudo ip link set can0 type can bitrate 500000
sudo ip link set up can0

# Traffic mitschneiden
candump can0

# Nachrichten senden
cansend can0 123#DEADBEEF

# Traffic-Statistiken
canbusload can0@500000
```

**Wireshark**
Wireshark unterstützt CAN-Bus-Protokolle und bietet mächtige Filterfunktionen für die Analyse großer Datenmengen.

**SavvyCAN**
Eine benutzerfreundliche GUI-Anwendung speziell für CAN-Bus-Reverse-Engineering mit Features wie automatischer Nachrichtenklassifizierung und Datenvisualisierung.

## Praktisches Reverse-Engineering

### Schritt 1: Traffic-Erfassung

Der erste Schritt ist immer die systematische Erfassung des CAN-Bus-Traffics:

```python
#!/usr/bin/env python3
import can
import time
from collections import defaultdict

# CAN-Bus-Interface initialisieren
bus = can.interface.Bus(channel='can0', bustype='socketcan')

# Nachrichtenzähler
message_counts = defaultdict(int)
unique_ids = set()

print("CAN-Bus Traffic-Analyse gestartet...")
print("Drücke Ctrl+C zum Beenden")

try:
    while True:
        # Nachricht empfangen (1s Timeout)
        message = bus.recv(timeout=1.0)
        
        if message is not None:
            # Statistiken aktualisieren
            message_counts[message.arbitration_id] += 1
            unique_ids.add(message.arbitration_id)
            
            # Nachricht ausgeben
            print(f"ID: 0x{message.arbitration_id:03X} "
                  f"DLC: {message.dlc} "
                  f"Data: {' '.join(f'{b:02X}' for b in message.data)}")

except KeyboardInterrupt:
    print("\n\n=== Analyse-Zusammenfassung ===")
    print(f"Unique IDs gefunden: {len(unique_ids)}")
    print("Top 10 häufigste Nachrichten:")
    
    for msg_id, count in sorted(message_counts.items(), 
                               key=lambda x: x[1], reverse=True)[:10]:
        print(f"  0x{msg_id:03X}: {count} Nachrichten")
```

### Schritt 2: Nachrichtenklassifizierung

Nach der Erfassung müssen die Nachrichten klassifiziert werden:

**Periodische vs. Event-basierte Nachrichten**
- Periodische Nachrichten (z.B. Sensordaten) werden in regelmäßigen Abständen gesendet
- Event-basierte Nachrichten werden nur bei bestimmten Ereignissen ausgelöst

**Datenanalyse-Techniken**
```python
def analyze_message_patterns(captured_data):
    """Analysiert Muster in CAN-Bus-Nachrichten"""
    
    for msg_id, messages in captured_data.items():
        # Zeitintervalle zwischen Nachrichten berechnen
        intervals = []
        for i in range(1, len(messages)):
            interval = messages[i]['timestamp'] - messages[i-1]['timestamp']
            intervals.append(interval)
        
        # Periodizität prüfen
        if intervals:
            avg_interval = sum(intervals) / len(intervals)
            variance = sum((x - avg_interval)**2 for x in intervals) / len(intervals)
            
            if variance < 0.01:  # Niedriger Variance = periodisch
                print(f"ID 0x{msg_id:03X}: Periodisch ({avg_interval:.3f}s)")
            else:
                print(f"ID 0x{msg_id:03X}: Event-basiert")
```

### Schritt 3: Funktionszuordnung

Der schwierigste Teil ist die Zuordnung von CAN-IDs zu Fahrzeugfunktionen:

**Differential-Analyse**
```bash
# Baseline ohne Aktivität aufzeichnen
candump can0 > baseline.log

# Mit spezifischer Aktion (z.B. Blinker links)
candump can0 > left_turn.log

# Unterschiede analysieren
diff baseline.log left_turn.log
```

**Fuzzing-Techniken**
```python
def can_fuzzer(bus, target_id):
    """Einfacher CAN-Bus Fuzzer"""
    
    print(f"Fuzzing CAN-ID 0x{target_id:03X}")
    
    for i in range(256):
        # Verschiedene Datenmuster testen
        data = [i, 0x00, 0xFF, i^0xFF, 0xAA, 0x55, i, ~i & 0xFF]
        
        message = can.Message(
            arbitration_id=target_id,
            data=data[:8],  # Maximal 8 Bytes
            is_extended_id=False
        )
        
        try:
            bus.send(message)
            time.sleep(0.1)
            print(f"Sent: {data}")
        except can.CanError as e:
            print(f"Error: {e}")
```

## Sicherheitsaspekte und Angriffsvektoren

### Häufige Schwachstellen

**Fehlende Authentifizierung**
Standard-CAN-Bus besitzt keine eingebaute Authentifizierung. Jedes Gerät kann beliebige Nachrichten senden.

**Broadcast-Natur**
Alle Nachrichten sind für alle Teilnehmer sichtbar, was Abhören ermöglicht.

**Denial-of-Service**
Durch Senden von High-Priority-Nachrichten kann der Bus blockiert werden.

### Praktische Angriffe

```python
def replay_attack(bus, captured_messages):
    """Replay-Angriff mit aufgezeichneten Nachrichten"""
    
    print("Starte Replay-Angriff...")
    
    for message in captured_messages:
        # Originalzeit nachahmen
        time.sleep(message['interval'])
        
        # Nachricht erneut senden
        can_msg = can.Message(
            arbitration_id=message['id'],
            data=message['data']
        )
        
        bus.send(can_msg)
        print(f"Replayed: 0x{message['id']:03X}")
```

## Schutzmaßnahmen und Gegenstrategien

### Network Segmentation
Kritische Systeme (Bremse, Lenkung) sollten von weniger kritischen (Infotainment) getrennt werden.

### CAN-Bus-Security-Gateways
Moderne Fahrzeuge setzen zunehmend auf Security-Gateways, die den Datenverkehr zwischen verschiedenen Bus-Segmenten kontrollieren.

### Verschlüsselung und Authentifizierung
Neuere Protokolle wie SecOC (Secure Onboard Communication) fügen Authentifizierung zu CAN-Nachrichten hinzu.

## Rechtliche und ethische Überlegungen

Beim CAN-Bus Reverse-Engineering sind rechtliche Aspekte zu beachten:

- **Eigentumsrecht**: Nur an eigenen Fahrzeugen oder mit expliziter Erlaubnis
- **Verkehrssicherheit**: Keine Tests während der Fahrt oder auf öffentlichen Straßen
- **Responsible Disclosure**: Sicherheitslücken verantwortungsvoll melden

## Tools und Ressourcen

### Open-Source-Tools
- **can-utils**: Grundlegende CAN-Bus-Utilities
- **SavvyCAN**: GUI-basierte Analyse-Software
- **CANtact**: Open-Source-Hardware für CAN-Bus-Zugang

### Kommerzielle Lösungen
- **Vector CANoe**: Professionelle Entwicklungsumgebung
- **Kvaser CANking**: Analyse- und Simulations-Tool
- **PEAK PCAN-Explorer**: Benutzerfreundliche Analyse-Software

## Fazit und Ausblick

CAN-Bus Reverse-Engineering ist ein komplexes aber faszinierendes Feld, das sowohl technisches Verständnis als auch praktische Erfahrung erfordert. Mit der zunehmenden Vernetzung von Fahrzeugen wird diese Disziplin immer wichtiger für die Automotive-Security.

Die Zukunft bringt neue Herausforderungen mit sich: Ethernet-basierte Automotive-Netzwerke, Over-the-Air-Updates und autonome Fahrzeuge erfordern erweiterte Sicherheitskonzepte. Gleichzeitig werden neue Standards wie ISO 21434 (Automotive Cybersecurity) die Entwicklung sichererer Fahrzeugsysteme vorantreiben.

Für Security-Researcher und Automotive-Entwickler bleibt CAN-Bus Reverse-Engineering ein essentielles Werkzeug, um die Sicherheit und Funktionalität moderner Fahrzeuge zu verstehen und zu verbessern. Der Schlüssel liegt dabei in der Kombination aus technischem Know-how, den richtigen Tools und einem verantwortungsvollen Umgang mit den gewonnenen Erkenntnissen.