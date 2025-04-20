// src/utils/EnhancedJSONImporter.js - Erweiterte Funktionen zum Importieren von JSON-Energiedaten

import { importData } from './EnergyDataStorage';

/**
 * Unterstützte JSON-Format-Typen für den Import
 */
export const JSON_IMPORT_TYPES = {
    GLITTERHUE: 'glitterhue', // Eigenes GlitterHue-Format
    CUSTOM: 'custom',         // Benutzerdefiniertes Format
    HUE_API: 'hue_api',       // Direkt von Hue API exportiertes Format
    HUE_REMOTE: 'hue_remote', // Daten von der Hue Remote API
    GENERIC: 'generic'        // Generisches Energiedaten-Format
};

/**
 * Validiert eine JSON-Datei vor dem Import
 * @param {Object} data - Die zu prüfenden JSON-Daten
 * @returns {Object} - Validierungsergebnis mit Status und Details
 */
export const validateJSONData = (data) => {
    if (!data) {
        return {
            isValid: false,
            reason: 'Keine Daten vorhanden',
            format: null
        };
    }

    // Prüfe auf bekannte Formate

    // Eigenes GlitterHue-Format
    if (data.meta && data.meta.database === 'GlitterHueEnergyDB') {
        return {
            isValid: true,
            format: JSON_IMPORT_TYPES.GLITTERHUE,
            version: data.meta.version || '1.0.0'
        };
    }

    // Format der Hue API
    if (data.lights && data.groups && data.config) {
        return {
            isValid: true,
            format: JSON_IMPORT_TYPES.HUE_API,
            details: 'Hue Bridge API Format erkannt'
        };
    }

    // Generisches Format, das Energiedaten enthalten könnte
    if (data.energyData || data.usageData || data.powerData) {
        return {
            isValid: true,
            format: JSON_IMPORT_TYPES.GENERIC,
            details: 'Generisches Energiedaten-Format erkannt'
        };
    }

    // Kein bekanntes Format, aber Daten vorhanden
    return {
        isValid: true,
        format: JSON_IMPORT_TYPES.CUSTOM,
        details: 'Unbekanntes Format, Import mit Anpassungen möglich'
    };
};

/**
 * Konvertiert ein Hue API-Format in unser Energiedaten-Format
 * @param {Object} data - Daten im Hue API-Format
 * @returns {Object} - Konvertierte Daten im GlitterHue-Format
 */
const convertHueAPIFormat = (data) => {
    const convertedData = {
        meta: {
            exportTime: new Date().toISOString(),
            version: 1,
            database: 'GlitterHueEnergyDB',
            source: 'Hue API',
            converted: true
        },
        lightData: {},
        usageHistory: [],
        settings: {
            key: 'energyCost',
            value: 0.32,
            updatedAt: Date.now()
        },
        dailyTotals: [],
        monthlyTotals: []
    };

    // Konvertiere Lampendaten
    if (data.lights) {
        Object.entries(data.lights).forEach(([lightId, lightData]) => {
            const now = Date.now();
            const currentDate = new Date();
            const currentDateKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
            const currentMonthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;

            // Schätze den Stromverbrauch basierend auf Lampentyp und Status
            const estimatedWattage = getEstimatedWattage(lightData);

            // Erstelle einen Eintrag für jede Lampe
            convertedData.lightData[lightId] = {
                lightId,
                timestamp: now,
                value: estimatedWattage,
                valueWh: 0,
                isStandby: !lightData.state?.on,
                brightness: lightData.state?.bri || 0,
                costPerKwh: 0.32,
                energyType: 'germany',
                dailyTotals: {
                    [currentDateKey]: {
                        wattHours: 0,
                        cost: 0,
                        readings: 1,
                        lastUpdate: now
                    }
                },
                monthlyTotals: {
                    [currentMonthKey]: {
                        wattHours: 0,
                        cost: 0,
                        readings: 1,
                        lastUpdate: now
                    }
                }
            };
        });
    }

    return convertedData;
};

/**
 * Schätzt den Stromverbrauch einer Lampe basierend auf ihren Eigenschaften
 * @param {Object} lightData - Daten einer Lampe aus der Hue API
 * @returns {number} - Geschätzter Verbrauch in Watt
 */
const getEstimatedWattage = (lightData) => {
    // Grundverbrauch pro Lampentyp
    const baseConsumption = {
        'Extended color light': 9.0,
        'Color light': 8.5,
        'Color temperature light': 6.5,
        'Dimmable light': 4.5,
        'On/off plug': 0.2
    };

    // Standby-Verbrauch pro Lampentyp
    const standbyConsumption = {
        'Extended color light': 0.4,
        'Color light': 0.4,
        'Color temperature light': 0.4,
        'Dimmable light': 0.4,
        'On/off plug': 0.1
    };

    const type = lightData.type || 'Dimmable light';
    const isOn = lightData.state?.on || false;
    const brightness = lightData.state?.bri || 254; // Maximum 254

    if (!isOn) {
        return standbyConsumption[type] || 0.4;
    }

    const maxWatts = baseConsumption[type] || 7.0;
    const standbyWatts = standbyConsumption[type] || 0.4;
    const brightnessRatio = brightness / 254;

    // Nicht-lineare Berechnung: Auch bei geringer Helligkeit gibt es einen Grundverbrauch
    return standbyWatts + (maxWatts - standbyWatts) * (0.2 + 0.8 * brightnessRatio);
};

/**
 * Importiert JSON-Daten in die Energiedatenbank
 * @param {File|Object} source - Die zu importierende JSON-Datei oder Datenobjekt
 * @param {Object} options - Importoptionen
 * @returns {Promise<Object>} - Ergebnis des Imports
 */
export const importJSONData = async (source, options = {}) => {
    let data;

    try {
        // Wenn source eine Datei ist, lese sie ein
        if (source instanceof File) {
            data = await readJSONFile(source);
        } else {
            // Sonst ist es vermutlich bereits ein Objekt
            data = source;
        }

        // Validiere die Daten
        const validation = validateJSONData(data);

        if (!validation.isValid) {
            throw new Error(`Ungültiges Datenformat: ${validation.reason}`);
        }

        // Konvertiere Daten, falls nötig
        let processedData = data;

        if (validation.format === JSON_IMPORT_TYPES.HUE_API) {
            processedData = convertHueAPIFormat(data);
        } else if (validation.format === JSON_IMPORT_TYPES.GENERIC) {
            // Hier könnte eine zusätzliche Konvertierung stattfinden
            processedData = {
                ...data,
                meta: {
                    exportTime: new Date().toISOString(),
                    version: 1,
                    database: 'GlitterHueEnergyDB',
                    source: 'External',
                    converted: true
                }
            };
        }

        // Importiere die Daten in die Datenbank
        await importData(processedData);

        return {
            success: true,
            format: validation.format,
            message: `Daten erfolgreich importiert (Format: ${validation.format})`,
            details: validation.details || 'Import abgeschlossen'
        };

    } catch (error) {
        console.error('Fehler beim Importieren der JSON-Daten:', error);
        return {
            success: false,
            error: error.message,
            details: 'Überprüfe das Format der Datei und versuche es erneut.'
        };
    }
};

/**
 * Liest eine JSON-Datei ein und gibt deren Inhalt als Objekt zurück
 * @param {File} file - Die einzulesende JSON-Datei
 * @returns {Promise<Object>} - Der geparste JSON-Inhalt
 */
const readJSONFile = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('Keine Datei angegeben'));
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                resolve(data);
            } catch (error) {
                reject(new Error(`Fehler beim Parsen der JSON-Datei: ${error.message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Fehler beim Lesen der Datei'));
        };

        reader.readAsText(file);
    });
};

/**
 * Importiert JSON-Daten aus einer lokalen Datei und zeigt UI-Feedback an
 * @param {File} file - Die zu importierende JSON-Datei
 * @param {Function} onSuccess - Callback bei Erfolg
 * @param {Function} onError - Callback bei Fehler
 * @param {Function} onProgress - Callback für Fortschrittsanzeige
 */
export const importJSONWithFeedback = async (file, onSuccess, onError, onProgress) => {
    if (!file) {
        if (onError) onError('Keine Datei ausgewählt');
        return;
    }

    try {
        // Fortschritt melden: Beginne mit Datei lesen
        if (onProgress) onProgress({ step: 'reading', progress: 10, message: 'Lese Datei...' });

        // Lese und validiere Datei
        const data = await readJSONFile(file);

        if (onProgress) onProgress({ step: 'validating', progress: 40, message: 'Validiere Daten...' });

        const validation = validateJSONData(data);

        if (!validation.isValid) {
            if (onError) onError(`Ungültige Datei: ${validation.reason}`);
            return;
        }

        if (onProgress) onProgress({ step: 'importing', progress: 70, message: 'Importiere Daten...' });

        // Importiere die Daten
        const result = await importJSONData(data);

        if (result.success) {
            if (onProgress) onProgress({ step: 'complete', progress: 100, message: 'Import abgeschlossen' });
            if (onSuccess) onSuccess(result.message, result);
        } else {
            if (onError) onError(result.error);
        }
    } catch (error) {
        console.error('Fehler beim JSON-Import:', error);
        if (onError) onError(`Importfehler: ${error.message}`);
    }
};