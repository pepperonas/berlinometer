// src/utils/EnergyCSVExporter.js - Exportiert Energiedaten im CSV-Format für Excel und andere Tabellenkalkulationen

/**
 * Konvertiert JavaScript-Arrays in CSV-Daten
 * @param {Array} headers - Array mit CSV-Überschriften
 * @param {Array} rows - Array von Arrays mit Datenzeilen
 * @param {Object} options - Zusätzliche Optionen
 * @returns {string} - CSV-Daten als String
 */
const arrayToCSV = (headers, rows, options = {}) => {
    // Standardoptionen
    const opts = {
        delimiter: options.delimiter || ',',
        lineBreak: options.lineBreak || '\n',
        quoteStrings: options.quoteStrings !== undefined ? options.quoteStrings : true,
        includeHeaders: options.includeHeaders !== undefined ? options.includeHeaders : true,
    };

    // Funktion zum Formatieren einzelner Werte
    const formatValue = (value) => {
        if (value === null || value === undefined) {
            return '';
        }

        // Konvertiere Zahlen zu Strings mit Dezimalkomma für Excel (DE)
        if (typeof value === 'number') {
            return value.toString().replace('.', ',');
        }

        // Arrays und Objekte zu JSON-Strings
        if (typeof value === 'object') {
            try {
                value = JSON.stringify(value);
            } catch (e) {
                value = String(value);
            }
        }

        // Konvertiere Booleans zu 'Ja'/'Nein'
        if (typeof value === 'boolean') {
            return value ? 'Ja' : 'Nein';
        }

        value = String(value);

        // Stelle sicher, dass Werte mit Anführungszeichen umschlossen werden, wenn nötig
        if (opts.quoteStrings &&
            (value.includes(opts.delimiter) ||
                value.includes('\n') ||
                value.includes('"'))) {
            // Ersetze Anführungszeichen durch doppelte Anführungszeichen
            value = '"' + value.replace(/"/g, '""') + '"';
        }

        return value;
    };

    let csv = '';

    // Füge Überschriften hinzu
    if (opts.includeHeaders && headers && headers.length > 0) {
        csv += headers.map(formatValue).join(opts.delimiter) + opts.lineBreak;
    }

    // Füge Datenzeilen hinzu
    if (rows && rows.length > 0) {
        csv += rows.map(row =>
            row.map(formatValue).join(opts.delimiter)
        ).join(opts.lineBreak);
    }

    return csv;
};

/**
 * Fügt eine UTF-8 BOM (Byte Order Mark) hinzu, damit Excel deutsche Umlaute korrekt erkennt
 * @param {string} csvString - CSV-Daten als String
 * @returns {string} - CSV-Daten mit BOM
 */
const addBOM = (csvString) => {
    return '\uFEFF' + csvString;
};

/**
 * Konvertiert einen JS-Objektarray in CSV-Daten
 * @param {Array} data - Array von Objekten
 * @param {Array} columnHeaders - Array mit Spaltenüberschriften (optional)
 * @param {Object} options - Zusätzliche Optionen
 * @returns {string} - CSV-Daten als String
 */
export const objectArrayToCSV = (data, columnHeaders = null, options = {}) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return '';
    }

    // Generiere Header aus dem ersten Objekt, falls nicht angegeben
    const headers = columnHeaders || Object.keys(data[0]);

    // Konvertiere Objektdaten in ein Array von Arrays
    const rows = data.map(obj =>
        headers.map(header => obj[header])
    );

    // Erstelle CSV-String
    const csvString = arrayToCSV(headers, rows, options);

    // Füge BOM hinzu
    return addBOM(csvString);
};

/**
 * Exportiert Energiedaten im CSV-Format für eine bestimmte Lampe
 * @param {Object} lightData - Daten für eine Lampe
 * @param {Object} options - Zusätzliche Optionen
 * @returns {string} - CSV-Daten als String
 */
export const exportLightDataToCSV = (lightData, options = {}) => {
    if (!lightData || !lightData.history || !Array.isArray(lightData.history)) {
        return addBOM('Keine Daten verfügbar');
    }

    // Formatiere die Daten für den Export
    const formattedData = lightData.history.map(entry => {
        const timestamp = new Date(entry.timestamp);

        return {
            'Datum': timestamp.toLocaleDateString('de-DE'),
            'Zeit': timestamp.toLocaleTimeString('de-DE'),
            'Zeitstempel': entry.timestamp,
            'Leistung (W)': entry.value,
            'Energie (Wh)': entry.valueWh || 0,
            'Status': entry.isStandby ? 'Standby' : 'Ein',
            'Helligkeit (%)': entry.brightness ? Math.round((entry.brightness / 254) * 100) : 0,
            'Strompreis (€/kWh)': entry.costPerKwh || options.costPerKwh || 0.32,
            'CO2 (g/kWh)': options.co2Factor || 400
        };
    });

    // Definiere die gewünschte Reihenfolge der Spalten
    const columnOrder = [
        'Datum', 'Zeit', 'Zeitstempel', 'Leistung (W)', 'Energie (Wh)',
        'Status', 'Helligkeit (%)', 'Strompreis (€/kWh)', 'CO2 (g/kWh)'
    ];

    // Erstelle CSV
    return objectArrayToCSV(formattedData, columnOrder);
};

/**
 * Exportiert tägliche Energiedaten im CSV-Format
 * @param {Array} dailyData - Array mit täglichen Energiedaten
 * @param {Object} options - Zusätzliche Optionen
 * @returns {string} - CSV-Daten als String
 */
export const exportDailyDataToCSV = (dailyData, options = {}) => {
    if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0) {
        return addBOM('Keine Daten verfügbar');
    }

    // Formatiere die Daten für den Export
    const formattedData = dailyData.map(entry => {
        return {
            'Datum': entry.date,
            'Wochentag': new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'long' }),
            'Gesamtverbrauch (Wh)': entry.totalWattHours || 0,
            'Gesamtverbrauch (kWh)': (entry.totalWattHours / 1000) || 0,
            'Durchschnitt (W)': entry.averageWatts || 0,
            'Kosten (€)': entry.totalCost || 0,
            'CO2 (kg)': (entry.totalWattHours / 1000 * (options.co2Factor || 400) / 1000) || 0,
            'Aktive Lampen': entry.activeLights || 0,
            'Max. Leistung (W)': entry.peakWatts || 0,
            'Letzte Aktualisierung': new Date(entry.lastUpdate).toLocaleString('de-DE')
        };
    });

    // Definiere die gewünschte Reihenfolge der Spalten
    const columnOrder = [
        'Datum', 'Wochentag', 'Gesamtverbrauch (Wh)', 'Gesamtverbrauch (kWh)',
        'Durchschnitt (W)', 'Kosten (€)', 'CO2 (kg)', 'Aktive Lampen',
        'Max. Leistung (W)', 'Letzte Aktualisierung'
    ];

    // Erstelle CSV
    return objectArrayToCSV(formattedData, columnOrder);
};

/**
 * Exportiert monatliche Energiedaten im CSV-Format
 * @param {Array} monthlyData - Array mit monatlichen Energiedaten
 * @param {Object} options - Zusätzliche Optionen
 * @returns {string} - CSV-Daten als String
 */
export const exportMonthlyDataToCSV = (monthlyData, options = {}) => {
    if (!monthlyData || !Array.isArray(monthlyData) || monthlyData.length === 0) {
        return addBOM('Keine Daten verfügbar');
    }

    // Formatiere die Daten für den Export
    const formattedData = monthlyData.map(entry => {
        const [year, month] = entry.month.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1, 1)
            .toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

        return {
            'Monat': entry.month,
            'Monatsname': monthName,
            'Jahr': entry.year,
            'Gesamtverbrauch (Wh)': entry.totalWattHours || 0,
            'Gesamtverbrauch (kWh)': (entry.totalWattHours / 1000) || 0,
            'Durchschnitt (W)': entry.averageWatts || 0,
            'Kosten (€)': entry.totalCost || 0,
            'CO2 (kg)': (entry.totalWattHours / 1000 * (options.co2Factor || 400) / 1000) || 0,
            'Aktive Tage': entry.activeDays || 0,
            'Letzte Aktualisierung': new Date(entry.lastUpdate).toLocaleString('de-DE')
        };
    });

    // Definiere die gewünschte Reihenfolge der Spalten
    const columnOrder = [
        'Monat', 'Monatsname', 'Jahr', 'Gesamtverbrauch (Wh)', 'Gesamtverbrauch (kWh)',
        'Durchschnitt (W)', 'Kosten (€)', 'CO2 (kg)', 'Aktive Tage', 'Letzte Aktualisierung'
    ];

    // Erstelle CSV
    return objectArrayToCSV(formattedData, columnOrder);
};

/**
 * Exportiert eine Zusammenfassung aller Lampen im CSV-Format
 * @param {Object} lightsData - Objekt mit Lampen und Verbrauchsdaten
 * @param {Object} options - Zusätzliche Optionen
 * @returns {string} - CSV-Daten als String
 */
export const exportLightsSummaryToCSV = (lightsData, options = {}) => {
    if (!lightsData || !lightsData.lights || !lightsData.usageData) {
        return addBOM('Keine Daten verfügbar');
    }

    const { lights, usageData } = lightsData;

    // Erstelle einen Array mit Lampendaten
    const formattedData = Object.entries(lights).map(([lightId, light]) => {
        const lightData = usageData[lightId] || {};

        // Aktueller Zeitraum für Daten
        const now = new Date();
        const currentDateKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

        // Berechne täglichen und monatlichen Verbrauch
        const dailyTotals = lightData.dailyTotals || {};
        const monthlyTotals = lightData.monthlyTotals || {};

        const dailyWh = dailyTotals[currentDateKey]?.wattHours || 0;
        const monthlyWh = monthlyTotals[currentMonthKey]?.wattHours || 0;
        const monthlyCost = monthlyTotals[currentMonthKey]?.cost || 0;

        // Berechne CO2-Ausstoß
        const co2Factor = options.co2Factor || 400; // g/kWh
        const monthlyCO2 = (monthlyWh / 1000) * co2Factor / 1000; // kg CO2

        return {
            'Lampen-ID': lightId,
            'Name': light.name || 'Unbekannt',
            'Typ': light.type || 'Unbekannt',
            'Status': light.state?.on ? 'Ein' : 'Aus',
            'Helligkeit (%)': light.state?.bri ? Math.round((light.state.bri / 254) * 100) : 0,
            'Aktuell (W)': lightData.value || 0,
            'Heute (Wh)': dailyWh,
            'Heute (kWh)': dailyWh / 1000,
            'Monat (Wh)': monthlyWh,
            'Monat (kWh)': monthlyWh / 1000,
            'Monatliche Kosten (€)': monthlyCost,
            'CO2/Monat (kg)': monthlyCO2,
            'Letzte Aktualisierung': lightData.timestamp ? new Date(lightData.timestamp).toLocaleString('de-DE') : 'Nie'
        };
    });

    // Definiere die gewünschte Reihenfolge der Spalten
    const columnOrder = [
        'Lampen-ID', 'Name', 'Typ', 'Status', 'Helligkeit (%)', 'Aktuell (W)',
        'Heute (Wh)', 'Heute (kWh)', 'Monat (Wh)', 'Monat (kWh)',
        'Monatliche Kosten (€)', 'CO2/Monat (kg)', 'Letzte Aktualisierung'
    ];

    // Erstelle CSV
    return objectArrayToCSV(formattedData, columnOrder);
};

/**
 * Erstellt einen CSV-Download mit den angegebenen Daten
 * @param {string} csvData - CSV-Daten als String
 * @param {string} filename - Name der Datei (ohne Erweiterung)
 */
export const downloadCSV = (csvData, filename) => {
    // Erstelle einen Blob mit den CSV-Daten
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Erstelle einen Link-Element und simuliere einen Klick
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();

    // Räume auf
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};