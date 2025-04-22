// server/energy-collector.js
const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// EnergyData-Modell importieren
const EnergyData = require('./models/EnergyData');

// Konfiguration
const CONFIG_FILE = path.join(__dirname, 'collector-config.json');
const DEFAULT_CONFIG = {
    bridgeIP: '',
    username: '',
    interval: 300, // Sekunden
    lastRun: 0,
    userId: 'server-collector',
    energyCost: 0.32, // Euro pro kWh
    lightTypes: {
        'Extended color light': { name: 'Hue Color', maxWatts: 9.0, standbyWatts: 0.4 },
        'Color light': { name: 'Hue Color', maxWatts: 8.5, standbyWatts: 0.4 },
        'Color temperature light': { name: 'Hue White Ambiance', maxWatts: 6.5, standbyWatts: 0.4 },
        'Dimmable light': { name: 'Hue White', maxWatts: 4.5, standbyWatts: 0.4 },
        'On/off plug': { name: 'Hue Plug', maxWatts: 0.2, standbyWatts: 0.1 },
        'Default': { name: 'Generisches Licht', maxWatts: 7.0, standbyWatts: 0.4 }
    }
};

// Status
let isRunning = false;
let config = DEFAULT_CONFIG;

// Konfiguration laden
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
            config = JSON.parse(configData);
            console.log('Konfiguration geladen.');
        } else {
            console.log('Keine Konfigurationsdatei gefunden. Verwende Standardwerte.');
            saveConfig(); // Standardkonfiguration speichern
        }
    } catch (error) {
        console.error('Fehler beim Laden der Konfiguration:', error);
    }
}

// Konfiguration speichern
function saveConfig() {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log('Konfiguration gespeichert.');
    } catch (error) {
        console.error('Fehler beim Speichern der Konfiguration:', error);
    }
}

// Verbindung zur MongoDB herstellen
async function connectToDatabase() {
    if (mongoose.connection.readyState === 1) {
        return; // Bereits verbunden
    }

    try {
        mongoose.set('strictQuery', true); // Mongoose-Warnung unterdrücken
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB verbunden.');
    } catch (error) {
        console.error('MongoDB-Verbindungsfehler:', error.message);
        throw error;
    }
}

// Verbindung zur Hue Bridge testen
async function testBridgeConnection() {
    if (!config.bridgeIP || !config.username) {
        console.error('Bridge IP oder Username nicht konfiguriert.');
        return false;
    }

    try {
        const response = await axios.get(`http://${config.bridgeIP}/api/${config.username}/lights`);
        if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
            console.log('Verbindung zur Hue Bridge erfolgreich.');
            return true;
        } else {
            console.error('Unerwartete Antwort von der Hue Bridge:', response.data);
            return false;
        }
    } catch (error) {
        console.error('Fehler bei der Verbindung zur Hue Bridge:', error.message);
        return false;
    }
}

// Alle Lampen von der Bridge abrufen
async function getLights() {
    try {
        const response = await axios.get(`http://${config.bridgeIP}/api/${config.username}/lights`);
        return response.data;
    } catch (error) {
        console.error('Fehler beim Abrufen der Lampen:', error.message);
        return {};
    }
}

// Berechnet den Energieverbrauch einer Lampe in Watt
function calculateLightWattage(light) {
    const lightType = config.lightTypes[light.type] || config.lightTypes['Default'];

    if (!light.state.on) {
        return lightType.standbyWatts;
    }

    // Für dimmbare Lichter: Helligkeit beeinflusst den Verbrauch
    if (light.state.bri !== undefined) {
        const brightnessRatio = light.state.bri / 254;
        // Nicht-linear skalieren: Selbst bei niedriger Helligkeit gibt es einen Grundverbrauch
        return lightType.standbyWatts + (lightType.maxWatts - lightType.standbyWatts) *
            (0.2 + 0.8 * brightnessRatio);
    }

    return lightType.maxWatts;
}

// Datenpunkt für alle Lampen erfassen
async function collectDataPoints() {
    if (!await testBridgeConnection()) {
        console.error('Keine Verbindung zur Hue Bridge möglich. Datenerfassung abgebrochen.');
        return;
    }

    try {
        await connectToDatabase();

        const lights = await getLights();
        const timestamp = Date.now();

        // Für jede Lampe Daten erfassen
        for (const [lightId, light] of Object.entries(lights)) {
            // Aktueller Verbrauch in Watt
            const wattage = calculateLightWattage(light);

            // Letzte Daten für diese Lampe abrufen
            const lastData = await EnergyData.findOne({
                userId: config.userId,
                lightId
            }).sort({ timestamp: -1 });

            // Energieverbrauch seit letztem Datenpunkt berechnen
            let valueWh = 0;
            if (lastData && lastData.timestamp) {
                // Zeitdifferenz in Stunden
                const hoursSinceLastPoint = (timestamp - lastData.timestamp) / (1000 * 60 * 60);

                // Wh = W * h
                valueWh = wattage * hoursSinceLastPoint;
            }

            // Neuen Datenpunkt erstellen
            const newData = new EnergyData({
                userId: config.userId,
                lightId,
                timestamp,
                value: wattage,
                valueWh,
                isStandby: !light.state.on,
                brightness: light.state.bri || 0,
                costPerKwh: config.energyCost,
                energyType: 'germany'
            });

            // In der Datenbank speichern
            await newData.save();

            console.log(`Datenpunkt für Lampe ${lightId} (${light.name}) erfasst: ${wattage.toFixed(2)}W`);
        }

        // Letzte Ausführungszeit aktualisieren
        config.lastRun = timestamp;
        saveConfig();

        console.log(`Datenerfassung abgeschlossen: ${Object.keys(lights).length} Lampen aktualisiert.`);
    } catch (error) {
        console.error('Fehler bei der Datenerfassung:', error);
    }
}

// Bridge-Konfiguration interaktiv einrichten
async function setupBridge() {
    // Diese Funktion würde normalerweise Nutzereingaben abfragen
    // Hier vereinfacht mit festen Werten implementiert
    console.log('Bridge IP eingeben:');
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question('Bridge IP: ', (bridgeIP) => {
        config.bridgeIP = bridgeIP;

        readline.question('API Username: ', (username) => {
            config.username = username;

            saveConfig();
            console.log('Bridge-Konfiguration gespeichert.');

            readline.close();

            // Teste die Verbindung
            testBridgeConnection().then(success => {
                if (success) {
                    console.log('Verbindung erfolgreich hergestellt.');
                    startCollection();
                } else {
                    console.log('Verbindung konnte nicht hergestellt werden. Bitte überprüfe die Einstellungen.');
                }
            });
        });
    });
}

// Datenerfassung starten
function startCollection() {
    if (isRunning) {
        console.log('Datenerfassung läuft bereits.');
        return;
    }

    isRunning = true;
    console.log('Datenerfassung gestartet.');

    // Sofort erste Datenpunkte erfassen
    collectDataPoints();

    // Regelmäßige Erfassung einrichten
    const intervalMs = config.interval * 1000;
    const timer = setInterval(() => {
        collectDataPoints();
    }, intervalMs);

    console.log(`Nächste Datenerfassung in ${config.interval} Sekunden.`);

    // Clean-up bei Prozessbeendigung
    process.on('SIGINT', () => {
        console.log('Beende Datenerfassung...');
        clearInterval(timer);
        isRunning = false;
        mongoose.connection.close().then(() => {
            console.log('MongoDB-Verbindung geschlossen.');
            process.exit(0);
        });
    });
}

// Hauptfunktion
async function main() {
    console.log('GlitterHue Energy Collector startet...');

    // Konfiguration laden
    loadConfig();

    // Prüfen, ob Bridge konfiguriert ist
    if (!config.bridgeIP || !config.username) {
        console.log('Keine Bridge-Konfiguration gefunden. Starte Setup...');
        setupBridge();
    } else {
        // Bridge-Verbindung testen
        const connected = await testBridgeConnection();
        if (connected) {
            startCollection();
        } else {
            console.log('Verbindung zur Bridge fehlgeschlagen. Starte Setup neu...');
            setupBridge();
        }
    }
}

// Programm starten
main();