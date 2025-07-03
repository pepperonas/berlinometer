# Auto Vacanze - Browser-Fahrzeugsimulator

Ein fortschrittlicher Fahrzeugsimulator im Browser mit realistischer Soft-Body-Physik, inspiriert von BeamNG.drive.

## Features

- **Realistische Soft-Body-Physik**: Node-Beam-System mit 250+ Nodes pro Fahrzeug
- **Dynamische Schadensmodellierung**: Echtzeit-Verformung und sichtbare Schäden
- **Mehrere Kameramodi**: Chase, Cockpit und freie Kamera
- **Gamepad-Unterstützung**: Volle Controller-Kompatibilität
- **Optimierte Performance**: 60 FPS im Browser durch adaptive LOD

## Steuerung

### Tastatur
- **W/↑**: Gas
- **S/↓**: Bremse
- **A/←**: Links lenken
- **D/→**: Rechts lenken
- **Space**: Handbremse
- **R**: Fahrzeug zurücksetzen
- **C**: Kamera wechseln
- **ESC**: Pause

### Gamepad
- **R2**: Gas
- **L2**: Bremse
- **Linker Stick**: Lenken
- **X/□**: Fahrzeug zurücksetzen

## Technologie

- **Three.js**: 3D-Rendering und Visualisierung
- **Cannon.js**: Physik-Engine für Rigid-Body-Simulation
- **Custom Soft-Body**: Eigene Implementierung für Fahrzeugverformung
- **Web Audio API**: 3D-Sound (in Entwicklung)

## Entwicklung

```bash
# Projekt starten
npm start
# oder
python3 -m http.server 8080

# Mit Live-Reload
npm run dev
```

## Fahrzeugphysik

Das Herzstück ist das Node-Beam-System:
- Jedes Fahrzeug besteht aus 200-400 miteinander verbundenen Nodes
- Beams (Verbindungen) simulieren die Fahrzeugstruktur
- Deformation wird in Echtzeit berechnet
- Schäden beeinflussen das Fahrverhalten

## Geplante Features

- [ ] Weitere Fahrzeuge (Sportwagen, Geländewagen, LKW)
- [ ] Mehr Strecken (Bergpass, Stadt, Rennstrecke)
- [ ] Sound-System mit Motor- und Kollisionsgeräuschen
- [ ] Replay-System für spektakuläre Crashes
- [ ] Fahrzeug-Editor
- [ ] Multiplayer-Unterstützung
- [ ] VR-Modus

## Performance-Tipps

- Chrome/Edge bieten beste Performance
- Dedizierte GPU empfohlen
- Bei Leistungsproblemen: Anzahl der Nodes reduzieren

## Lizenz

MIT License - Siehe LICENSE-Datei für Details.