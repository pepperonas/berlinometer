// src/utils/EnergyDataUtils.js - Hilfsfunktionen für Energiedatenverarbeitung und -export

// Modell für die Energie-Datenerfassung
export const ENERGY_DATA_VERSION = "1.0.0";

// Stromkosten-Standardwert in Euro
export const DEFAULT_ENERGY_COST = 0.32;

// Lampentypen mit ihrem durchschnittlichen Energieverbrauch in Watt
export const LIGHT_TYPES = {
    'Extended color light': { name: 'Hue Color', maxWatts: 9.0, standbyWatts: 0.4 },
    'Color light': { name: 'Hue Color', maxWatts: 8.5, standbyWatts: 0.4 },
    'Color temperature light': { name: 'Hue White Ambiance', maxWatts: 6.5, standbyWatts: 0.4 },
    'Dimmable light': { name: 'Hue White', maxWatts: 4.5, standbyWatts: 0.4 },
    'On/off plug': { name: 'Hue Plug', maxWatts: 0.2, standbyWatts: 0.1 },
    'Default': { name: 'Generisches Licht', maxWatts: 7.0, standbyWatts: 0.4 }
};

// CO2-Faktoren in g/kWh für verschiedene Energiequellen
export const CO2_FACTORS = {
    'germany': 400,  // Durchschnitt Deutschland
    'greenEnergy': 50,  // Ökostrom
    'coal': 820,     // Kohlestrom
    'nuclear': 12,   // Atomstrom
    'gas': 490       // Erdgas
};

/**
 * Berechnet den Stromverbrauch einer Lampe basierend auf ihrem Zustand
 * @param {Object} light - Das Lichtobjekt von der Hue-API
 * @returns {number} - Aktueller Stromverbrauch in Watt
 */
export const calculateLightWattage = (light) => {
    if (!light || !light.state) return 0;

    const lightType = LIGHT_TYPES[light.type] || LIGHT_TYPES['Default'];

    if (!light.state.on) return lightType.standbyWatts;

    // Berechne Verbrauch basierend auf Helligkeit für dimmbare Lichter
    if (light.state.bri !== undefined) {
        const brightnessRatio = light.state.bri / 254;
        // Nicht-linear skalieren: Selbst bei niedriger Helligkeit gibt es einen Grundverbrauch
        return lightType.standbyWatts + (lightType.maxWatts - lightType.standbyWatts) *
            (0.2 + 0.8 * brightnessRatio);
    }

    return lightType.maxWatts;
};

/**
 * Berechnet den CO2-Ausstoß für eine bestimmte kWh-Menge
 * @param {number} kwh - Verbrauch in kWh
 * @param {string} energyType - Art der Energie (siehe CO2_FACTORS)
 * @returns {number} - CO2-Ausstoß in kg
 */
export const calculateCO2 = (kwh, energyType = 'germany') => {
    const factor = CO2_FACTORS[energyType] || CO2_FACTORS.germany;
    return kwh * factor / 1000; // g zu kg umrechnen
};

/**
 * Berechnet die Gesamtkosten für einen bestimmten kWh-Verbrauch
 * @param {number} kwh - Verbrauch in kWh
 * @param {number} costPerKwh - Kosten pro kWh in Euro
 * @returns {number} - Gesamtkosten in Euro
 */
export const calculateCost = (kwh, costPerKwh) => {
    return kwh * costPerKwh;
};

/**
 * Konvertiert einen Zeitstempel in eine formatierte Zeitangabe
 * @param {Date|number} timestamp - Zeitstempel oder Date-Objekt
 * @param {string} format - Ausgabeformat ('time', 'date', 'datetime', 'hour')
 * @returns {string} - Formatierte Zeitangabe
 */
export const formatTimestamp = (timestamp, format = 'datetime') => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

    switch(format) {
        case 'time':
            return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        case 'date':
            return date.toLocaleDateString('de-DE');
        case 'hour':
            return date.getHours() + ':00';
        case 'day':
            return date.toLocaleDateString('de-DE', { weekday: 'long' });
        case 'month':
            return date.toLocaleDateString('de-DE', { month: 'long' });
        case 'datetime':
        default:
            return date.toLocaleString('de-DE');
    }
};

/**
 * Gruppiert die Energiedaten nach Stunde, Tag oder Monat
 * @param {Array} data - Array mit Energiedaten (enthält timestamp und value)
 * @param {string} groupBy - Gruppierungskriterium ('hour', 'day', 'month')
 * @returns {Object} - Gruppierte Daten
 */
export const groupEnergyData = (data, groupBy = 'day') => {
    if (!data || !Array.isArray(data)) return {};

    const grouped = {};

    data.forEach(entry => {
        if (!entry.timestamp || entry.value === undefined) return;

        const date = new Date(entry.timestamp);
        let key;

        switch(groupBy) {
            case 'hour':
                key = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}-${date.getHours()}`;
                break;
            case 'day':
                key = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
                break;
            case 'month':
                key = `${date.getFullYear()}-${date.getMonth()+1}`;
                break;
            case 'weekday':
                key = date.getDay(); // 0 (Sonntag) bis 6 (Samstag)
                break;
            default:
                key = formatTimestamp(date);
        }

        if (!grouped[key]) {
            grouped[key] = {
                total: 0,
                count: 0,
                min: Infinity,
                max: -Infinity,
                values: []
            };
        }

        grouped[key].total += entry.value;
        grouped[key].count++;
        grouped[key].min = Math.min(grouped[key].min, entry.value);
        grouped[key].max = Math.max(grouped[key].max, entry.value);
        grouped[key].values.push(entry.value);
    });

    // Berechne Durchschnitt für jede Gruppe
    Object.keys(grouped).forEach(key => {
        grouped[key].average = grouped[key].total / grouped[key].count;
    });

    return grouped;
};

/**
 * Bereitet Daten für Diagramme auf (z.B. für EnergyUsageChart)
 * @param {Object} data - Energiedaten
 * @param {string} period - Zeitraum ('day', 'week', 'month', 'year')
 * @param {string} metric - Messgröße ('watt', 'kwh', 'cost', 'co2')
 * @returns {Array} - Aufbereitete Daten für Diagramme
 */
export const prepareChartData = (data, period = 'day', metric = 'watt') => {
    if (!data || !data.history || !Array.isArray(data.history)) return [];

    let filteredData = [...data.history];
    const now = new Date();

    // Filtere Daten basierend auf dem gewählten Zeitraum
    switch(period) {
        case 'day':
            filteredData = filteredData.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return (
                    entryDate.getDate() === now.getDate() &&
                    entryDate.getMonth() === now.getMonth() &&
                    entryDate.getFullYear() === now.getFullYear()
                );
            });
            break;
        case 'week':
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredData = filteredData.filter(entry => new Date(entry.timestamp) >= oneWeekAgo);
            break;
        case 'month':
            filteredData = filteredData.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return (
                    entryDate.getMonth() === now.getMonth() &&
                    entryDate.getFullYear() === now.getFullYear()
                );
            });
            break;
        case 'year':
            filteredData = filteredData.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate.getFullYear() === now.getFullYear();
            });
            break;
    }

    // Transformiere die Daten basierend auf der gewählten Metrik
    return filteredData.map(entry => {
        let value = entry.value; // Standardmäßig Leistung in Watt

        switch(metric) {
            case 'kwh':
                // Konvertiere Watt-Stunden in kWh
                value = entry.valueWh ? entry.valueWh / 1000 : value / 1000;
                break;
            case 'cost':
                // Berechne Kosten (falls costPerKwh im Dateneintrag vorhanden)
                value = entry.costPerKwh ? (entry.valueWh / 1000) * entry.costPerKwh : value;
                break;
            case 'co2':
                // Berechne CO2 Ausstoß
                value = calculateCO2(entry.valueWh / 1000, entry.energyType || 'germany');
                break;
        }

        return {
            timestamp: entry.timestamp,
            value: value,
            formatted: {
                time: formatTimestamp(entry.timestamp, 'time'),
                date: formatTimestamp(entry.timestamp, 'date'),
                hour: formatTimestamp(entry.timestamp, 'hour'),
                day: formatTimestamp(entry.timestamp, 'day'),
                month: formatTimestamp(entry.timestamp, 'month')
            }
        };
    });
};

/**
 * Berechnet Energiestatistiken für einen Datensatz
 * @param {Array} data - Energiedaten
 * @param {Object} options - Optionen für die Berechnung
 * @returns {Object} - Berechnete Statistiken
 */
export const calculateEnergyStats = (data, options = {}) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return {
            total: 0,
            average: 0,
            min: 0,
            max: 0,
            count: 0
        };
    }

    // Optionen mit Standardwerten
    const opts = {
        costPerKwh: options.costPerKwh || DEFAULT_ENERGY_COST,
        energyType: options.energyType || 'germany',
        includeStandby: options.includeStandby !== undefined ? options.includeStandby : true
    };

    let total = 0;
    let min = Infinity;
    let max = -Infinity;
    let count = 0;

    data.forEach(entry => {
        if (entry.value === undefined) return;

        // Überspringe Standby-Verbrauch, wenn nicht gewünscht
        if (!opts.includeStandby && entry.isStandby) return;

        total += entry.value;
        min = Math.min(min, entry.value);
        max = Math.max(max, entry.value);
        count++;
    });

    const average = count > 0 ? total / count : 0;

    // Berechne abgeleitete Werte
    const totalKwh = total / 1000; // Watt zu kWh
    const totalCost = calculateCost(totalKwh, opts.costPerKwh);
    const totalCO2 = calculateCO2(totalKwh, opts.energyType);

    return {
        total,
        average,
        min: min === Infinity ? 0 : min,
        max: max === -Infinity ? 0 : max,
        count,
        kwh: totalKwh,
        cost: totalCost,
        co2: totalCO2
    };
};

/**
 * Exportiert die Energiedaten als JSON-Datei
 * @param {Object} data - Zu exportierende Daten
 * @param {string} filename - Name der Exportdatei
 */
export const exportEnergyData = (data, filename = 'glitterhue-energy-data.json') => {
    // Erstelle ein Metadaten-Objekt mit Informationen zum Export
    const exportData = {
        version: ENERGY_DATA_VERSION,
        timestamp: new Date().toISOString(),
        data: data
    };

    // Konvertiere in JSON mit schöner Formatierung (2 Leerzeichen Einrückung)
    const jsonString = JSON.stringify(exportData, null, 2);

    // Erstelle einen Blob mit dem JSON-String
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Erstelle eine URL für den Blob
    const url = URL.createObjectURL(blob);

    // Erstelle einen temporären Link zum Herunterladen
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // Füge den Link zum DOM hinzu, klicke ihn an und entferne ihn wieder
    document.body.appendChild(a);
    a.click();

    // Räume auf
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
};

/**
 * Importiert Energiedaten aus einer JSON-Datei
 * @param {File} file - Die zu importierende JSON-Datei
 * @returns {Promise<Object>} - Die importierten Daten
 */
export const importEnergyData = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('Keine Datei angegeben'));
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                // Überprüfe Datenversion für Kompatibilität
                if (!data.version) {
                    reject(new Error('Ungültiges Datenformat: Version fehlt'));
                    return;
                }

                // Hier könnte eine Versionsprüfung stattfinden, um Datenformat-Updates zu handhaben

                resolve(data.data);
            } catch (error) {
                reject(new Error(`Fehler beim Parsen der Datei: ${error.message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Fehler beim Lesen der Datei'));
        };

        reader.readAsText(file);
    });
};

/**
 * Sammelt Verbrauchsdaten für eine Lampe
 * @param {string} lightId - ID der Lampe
 * @param {Object} light - Lampenobjekt von der Hue-API
 * @param {Object} options - Optionen für die Datenerfassung
 * @returns {Object} - Gesammelte Verbrauchsdaten
 */
export const collectEnergyDataPoint = (lightId, light, options = {}) => {
    if (!light || !light.state) return null;

    const now = new Date();
    const timestamp = now.getTime();

    // Berechne Leistungsaufnahme
    const wattage = calculateLightWattage(light);

    // Berechne Energieverbrauch seit letztem Datenpunkt
    const lastDataPoint = options.lastDataPoint || null;
    let valueWh = 0;

    if (lastDataPoint && lastDataPoint.timestamp) {
        // Zeitdifferenz in Stunden
        const hoursSinceLastPoint = (timestamp - lastDataPoint.timestamp) / (1000 * 60 * 60);

        // Wh = W * h
        valueWh = wattage * hoursSinceLastPoint;
    }

    return {
        lightId,
        timestamp,
        value: wattage, // Aktuelle Leistung in Watt
        valueWh,      // Energieverbrauch in Wh seit letztem Datenpunkt
        isStandby: !light.state.on,
        brightness: light.state.bri || 0,
        costPerKwh: options.costPerKwh || DEFAULT_ENERGY_COST,
        energyType: options.energyType || 'germany'
    };
};

/**
 * Bereinigt alte Daten aus dem Verlauf nach bestimmten Kriterien
 * @param {Array} history - Verlaufsdaten
 * @param {Object} options - Optionen für die Bereinigung
 * @returns {Array} - Bereinigte Verlaufsdaten
 */
export const cleanupHistoryData = (history, options = {}) => {
    if (!history || !Array.isArray(history)) return [];

    const opts = {
        maxAgeInDays: options.maxAgeInDays || 365, // Standard: 1 Jahr
        maxEntries: options.maxEntries || 10000,   // Standard: 10.000 Einträge
        aggregateOldData: options.aggregateOldData !== undefined ? options.aggregateOldData : true
    };

    const now = new Date();
    const maxAgeTimestamp = now.getTime() - (opts.maxAgeInDays * 24 * 60 * 60 * 1000);

    // Filtere nach Alter
    let filteredHistory = history.filter(entry =>
        entry.timestamp && entry.timestamp > maxAgeTimestamp
    );

    // Wenn zu viele Einträge vorhanden sind, reduziere sie
    if (filteredHistory.length > opts.maxEntries) {
        if (opts.aggregateOldData) {
            // Aggregiere ältere Daten statt sie zu verwerfen
            const toKeep = filteredHistory.slice(-opts.maxEntries);
            const toAggregate = filteredHistory.slice(0, -opts.maxEntries);

            // Gruppiere nach Tag
            const aggregated = groupEnergyData(toAggregate, 'day');

            // Konvertiere zurück zu Array mit aggregierten Werten
            const aggregatedEntries = Object.keys(aggregated).map(key => {
                const group = aggregated[key];
                const [year, month, day] = key.split('-').map(Number);

                return {
                    timestamp: new Date(year, month-1, day).getTime(),
                    value: group.average,
                    valueWh: group.total,
                    isAggregated: true,
                    originalCount: group.count
                };
            });

            // Sortiere nach Zeitstempel und kombiniere
            filteredHistory = [...aggregatedEntries, ...toKeep].sort((a, b) => a.timestamp - b.timestamp);
        } else {
            // Behalte nur die neuesten Einträge
            filteredHistory = filteredHistory.slice(-opts.maxEntries);
        }
    }

    return filteredHistory;
};

/**
 * Identifiziert den Zeitraum mit dem höchsten Verbrauch
 * @param {Array} history - Verlaufsdaten
 * @param {string} groupBy - Gruppierung ('hour', 'day', 'month', 'weekday')
 * @returns {Object} - Zeitraum mit höchstem Verbrauch
 */
export const findPeakUsagePeriod = (history, groupBy = 'hour') => {
    if (!history || !Array.isArray(history) || history.length === 0) {
        return { period: null, value: 0 };
    }

    const grouped = groupEnergyData(history, groupBy);

    let maxKey = null;
    let maxValue = -Infinity;

    Object.keys(grouped).forEach(key => {
        if (grouped[key].average > maxValue) {
            maxValue = grouped[key].average;
            maxKey = key;
        }
    });

    // Formatiere die Ausgabe je nach Gruppierung
    let periodLabel = maxKey;

    if (groupBy === 'hour' && maxKey) {
        const [_, __, ___, hour] = maxKey.split('-');
        periodLabel = `${hour}:00 - ${hour}:59`;
    } else if (groupBy === 'weekday' && maxKey !== null) {
        const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        periodLabel = weekdays[maxKey];
    } else if (groupBy === 'month' && maxKey) {
        const [year, month] = maxKey.split('-');
        const date = new Date(parseInt(year), parseInt(month)-1, 1);
        periodLabel = formatTimestamp(date, 'month');
    }

    return {
        period: periodLabel,
        value: maxValue,
        groupKey: maxKey
    };
};