// src/utils/EnergyReportGenerator.js - Erstellt ausführliche Energieberichte als PDF oder CSV

import {
    calculateLightWattage, calculateCO2, calculateCost,
    formatTimestamp, groupEnergyData, findPeakUsagePeriod,
    LIGHT_TYPES, DEFAULT_ENERGY_COST
} from './EnergyDataUtils';

import {
    getAllLightData, getLightHistory, getDailyTotals,
    getMonthlyTotals, getSetting
} from './EnergyDataStorage';

/**
 * Erzeugt CSV-Daten für den Export
 * @param {Object} data - Die zu exportierenden Daten
 * @param {string} type - Der Typ der Daten ('history', 'daily', 'monthly')
 * @returns {string} - CSV-Daten als String
 */
export const generateCSV = (data, type = 'history') => {
    if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
        return 'Keine Daten verfügbar';
    }

    let csvContent = '';
    let headers = [];
    let rows = [];

    // Je nach Datentyp unterschiedliche CSV-Strukturen erstellen
    switch(type) {
        case 'history':
            // Verlaufsdaten als CSV
            headers = ['Zeitstempel', 'Zeit', 'Datum', 'Lampen-ID', 'Leistung (W)', 'Energie (Wh)', 'Standby', 'Helligkeit', 'Strompreis', 'CO2-Faktor'];

            rows = data.map(entry => [
                entry.timestamp,
                formatTimestamp(entry.timestamp, 'time'),
                formatTimestamp(entry.timestamp, 'date'),
                entry.lightId,
                entry.value.toFixed(2),
                entry.valueWh ? entry.valueWh.toFixed(4) : '0',
                entry.isStandby ? 'Ja' : 'Nein',
                entry.brightness,
                entry.costPerKwh,
                entry.energyType
            ]);
            break;

        case 'daily':
            // Tägliche Zusammenfassung
            headers = ['Datum', 'Jahr', 'Monat', 'Tag', 'Gesamtverbrauch (Wh)', 'Durchschnitt (W)', 'Kosten (€)', 'CO2 (kg)', 'Aktive Lampen', 'Letzte Aktualisierung'];

            rows = data.map(entry => [
                entry.date,
                entry.year,
                entry.month.split('-')[1],
                entry.day,
                entry.totalWattHours.toFixed(2),
                entry.averageWatts.toFixed(2),
                entry.totalCost.toFixed(4),
                (entry.totalWattHours / 1000 * 0.4).toFixed(4), // CO2 grob geschätzt
                entry.activeLights || '?',
                formatTimestamp(entry.lastUpdate)
            ]);
            break;

        case 'monthly':
            // Monatliche Zusammenfassung
            headers = ['Monat', 'Jahr', 'Gesamtverbrauch (kWh)', 'Durchschnitt (W)', 'Kosten (€)', 'CO2 (kg)', 'Aktive Tage', 'Letzte Aktualisierung'];

            rows = data.map(entry => [
                entry.month,
                entry.year,
                (entry.totalWattHours / 1000).toFixed(2),
                entry.averageWatts.toFixed(2),
                entry.totalCost.toFixed(2),
                (entry.totalWattHours / 1000 * 0.4).toFixed(2), // CO2 grob geschätzt
                entry.activeDays || '?',
                formatTimestamp(entry.lastUpdate)
            ]);
            break;

        case 'light-summary':
            // Zusammenfassung pro Lampe
            headers = ['Lampen-ID', 'Name', 'Typ', 'Status', 'Aktuell (W)', 'Heute (kWh)', 'Monat (kWh)', 'Monatliche Kosten (€)', 'CO2 (kg)'];

            rows = Object.entries(data.lights).map(([lightId, light]) => {
                const lightData = data.usageData[lightId] || { value: 0 };
                const lightType = LIGHT_TYPES[light.type] || LIGHT_TYPES['Default'];

                // Aktueller Zeitraum für Daten
                const now = new Date();
                const currentDateKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
                const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

                // Berechne täglichen und monatlichen Verbrauch
                const dailyKwh = lightData.dailyTotals && lightData.dailyTotals[currentDateKey]
                    ? lightData.dailyTotals[currentDateKey].wattHours / 1000
                    : 0;

                const monthlyKwh = lightData.monthlyTotals && lightData.monthlyTotals[currentMonthKey]
                    ? lightData.monthlyTotals[currentMonthKey].wattHours / 1000
                    : 0;

                const monthlyCost = lightData.monthlyTotals && lightData.monthlyTotals[currentMonthKey]
                    ? lightData.monthlyTotals[currentMonthKey].cost
                    : 0;

                const co2 = calculateCO2(monthlyKwh, lightData.energyType || 'germany');

                return [
                    lightId,
                    light.name,
                    lightType.name,
                    light.state.on ? 'Ein' : 'Aus',
                    lightData.value ? lightData.value.toFixed(2) : '0.0',
                    dailyKwh.toFixed(4),
                    monthlyKwh.toFixed(4),
                    monthlyCost.toFixed(4),
                    co2.toFixed(4)
                ];
            });
            break;

        default:
            return 'Ungültiger Datentyp';
    }

    // Erstelle CSV-Inhalt mit Überschriften und Datenzeilen
    csvContent = headers.join(',') + '\n';
    csvContent += rows.map(row => row.join(',')).join('\n');

    return csvContent;
};

/**
 * Erzeugt einen vollständigen Energiebericht mit allen verfügbaren Daten
 * @param {Object} options - Optionen für den Bericht
 * @returns {Promise<Object>} - Die Berichtsdaten
 */
export const generateCompleteReport = async (options = {}) => {
    try {
        const report = {
            generatedAt: new Date().toISOString(),
            settings: {},
            summary: {
                current: {},
                daily: {},
                monthly: {},
                yearly: {}
            },
            lights: {},
            dailyTotals: [],
            monthlyTotals: [],
            peakUsage: {}
        };

        // Lade Einstellungen
        report.settings.energyCost = await getSetting('energyCost', DEFAULT_ENERGY_COST);
        report.settings.co2Factor = await getSetting('co2Factor', 'germany');

        // Lade alle Lampendaten
        const allLightData = await getAllLightData();
        report.lights.data = allLightData;

        // Lade tägliche und monatliche Gesamtwerte
        const now = new Date();
        const currentYear = now.getFullYear().toString();

        // Lade Tageswerte der letzten 30 Tage
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const startDateStr = `${thirtyDaysAgo.getFullYear()}-${(thirtyDaysAgo.getMonth() + 1).toString().padStart(2, '0')}-${thirtyDaysAgo.getDate().toString().padStart(2, '0')}`;
        const endDateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

        const dailyTotals = await getDailyTotals({
            startDate: startDateStr,
            endDate: endDateStr
        });
        report.dailyTotals = dailyTotals;

        // Lade Monatswerte des aktuellen Jahres
        const monthlyTotals = await getMonthlyTotals(currentYear);
        report.monthlyTotals = monthlyTotals;

        // Berechne Zusammenfassungen

        // Aktueller Gesamtverbrauch
        let currentTotalWatts = 0;
        let totalOnLights = 0;

        // Tages-, Monats- und Jahresverbrauch
        let dailyTotalKwh = 0;
        let monthlyTotalKwh = 0;
        let yearlyTotalKwh = 0;
        let totalCosts = 0;

        const currentDateKey = endDateStr;
        const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

        // Summiere die Werte aller Lampen
        allLightData.forEach(lightData => {
            // Aktueller Verbrauch
            currentTotalWatts += lightData.value || 0;
            if (lightData.isStandby === false) {
                totalOnLights++;
            }

            // Tagesverbrauch
            if (lightData.dailyTotals && lightData.dailyTotals[currentDateKey]) {
                dailyTotalKwh += lightData.dailyTotals[currentDateKey].wattHours / 1000;
            }

            // Monatsverbrauch
            if (lightData.monthlyTotals && lightData.monthlyTotals[currentMonthKey]) {
                monthlyTotalKwh += lightData.monthlyTotals[currentMonthKey].wattHours / 1000;
                totalCosts += lightData.monthlyTotals[currentMonthKey].cost;
            }
        });

        // Summiere über alle verfügbaren Monatswerte für das Jahr
        monthlyTotals.forEach(month => {
            yearlyTotalKwh += month.totalWattHours / 1000;
        });

        // Hochrechnung für das Jahr, falls nicht vollständig
        if (monthlyTotals.length < 12) {
            const monthsWithData = monthlyTotals.length || 1;
            yearlyTotalKwh = (yearlyTotalKwh / monthsWithData) * 12;
        }

        // Fülle die Zusammenfassungsdaten
        report.summary.current = {
            totalWatts: currentTotalWatts,
            totalOnLights,
            totalLights: allLightData.length
        };

        report.summary.daily = {
            totalKwh: dailyTotalKwh,
            cost: dailyTotalKwh * report.settings.energyCost,
            co2: calculateCO2(dailyTotalKwh, report.settings.co2Factor)
        };

        report.summary.monthly = {
            totalKwh: monthlyTotalKwh,
            cost: totalCosts,
            co2: calculateCO2(monthlyTotalKwh, report.settings.co2Factor)
        };

        report.summary.yearly = {
            estimatedKwh: yearlyTotalKwh,
            estimatedCost: yearlyTotalKwh * report.settings.energyCost,
            estimatedCO2: calculateCO2(yearlyTotalKwh, report.settings.co2Factor)
        };

        // Bestimme Spitzenverbrauchszeiten
        // Sammle alle Verlaufsdaten der letzten 30 Tage
        let allHistory = [];

        for (const lightData of allLightData) {
            const history = await getLightHistory(lightData.lightId, {
                startTime: thirtyDaysAgo.getTime(),
                endTime: now.getTime()
            });

            allHistory = [...allHistory, ...history];
        }

        // Finde Spitzenverbrauchszeiten
        report.peakUsage = {
            hour: findPeakUsagePeriod(allHistory, 'hour'),
            weekday: findPeakUsagePeriod(allHistory, 'weekday'),
            month: findPeakUsagePeriod(allHistory, 'month')
        };

        return report;

    } catch (error) {
        console.error('Fehler bei der Berichtserstellung:', error);
        throw error;
    }
};

/**
 * Erstellt eine CSV-Datei mit einem bestimmten Berichtstyp und löst den Download aus
 * @param {string} reportType - Der Typ des Berichts ('history', 'daily', 'monthly', 'light-summary', 'complete')
 * @param {Object} options - Zusätzliche Optionen
 */
export const downloadCSVReport = async (reportType = 'light-summary', options = {}) => {
    try {
        let data;
        let csvData;
        let filename;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        switch (reportType) {
            case 'complete':
                // Vollständiger Bericht
                const report = await generateCompleteReport(options);

                // Erstelle mehrere CSV-Dateien in einem ZIP-Archiv
                // Dies erfordert die JSZip-Bibliothek, daher geben wir hier nur die Lampenzusammenfassung zurück
                const lightSummaryData = {
                    lights: options.lights || {},
                    usageData: report.lights.data.reduce((acc, item) => {
                        acc[item.lightId] = item;
                        return acc;
                    }, {})
                };

                csvData = generateCSV(lightSummaryData, 'light-summary');
                filename = `glitterhue-energy-summary-${timestamp}.csv`;
                break;

            case 'history':
                // Verlaufsdaten für eine bestimmte Lampe
                if (!options.lightId) {
                    throw new Error('Keine Lampen-ID angegeben');
                }

                const startTime = options.startTime || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime();
                const endTime = options.endTime || Date.now();

                data = await getLightHistory(options.lightId, { startTime, endTime });
                csvData = generateCSV(data, 'history');
                filename = `glitterhue-energy-history-${options.lightId}-${timestamp}.csv`;
                break;

            case 'daily':
                // Tägliche Zusammenfassung
                const startDate = options.startDate || (() => {
                    const date = new Date();
                    date.setDate(date.getDate() - 30);
                    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                })();

                const endDate = options.endDate || (() => {
                    const date = new Date();
                    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                })();

                data = await getDailyTotals({ startDate, endDate });
                csvData = generateCSV(data, 'daily');
                filename = `glitterhue-energy-daily-${timestamp}.csv`;
                break;

            case 'monthly':
                // Monatliche Zusammenfassung
                const year = options.year || new Date().getFullYear().toString();

                data = await getMonthlyTotals(year);
                csvData = generateCSV(data, 'monthly');
                filename = `glitterhue-energy-monthly-${year}-${timestamp}.csv`;
                break;

            case 'light-summary':
            default:
                // Zusammenfassung pro Lampe
                const lightData = await getAllLightData();
                const lightSummary = {
                    lights: options.lights || {},
                    usageData: lightData.reduce((acc, item) => {
                        acc[item.lightId] = item;
                        return acc;
                    }, {})
                };

                csvData = generateCSV(lightSummary, 'light-summary');
                filename = `glitterhue-energy-light-summary-${timestamp}.csv`;
                break;
        }

        // Erstelle Blob und starte Download
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });

        // Erstelle einen temporären Link zum Herunterladen
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);

        // Füge den Link zum DOM hinzu, klicke ihn an und entferne ihn wieder
        document.body.appendChild(link);
        link.click();

        // Räume auf
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        return { success: true, filename };

    } catch (error) {
        console.error('Fehler beim Erstellen des CSV-Berichts:', error);
        throw error;
    }
};

/**
 * Diese Funktion kann verwendet werden, um einen formatieren HTML-Bericht zu erzeugen
 * Der kann für PDFs verwendet werden (erfordert zusätzliche Bibliotheken)
 * @param {Object} reportData - Die Berichtsdaten
 * @returns {string} - HTML-Inhalt für den Bericht
 */
export const generateReportHTML = (reportData) => {
    if (!reportData) return '<div>Keine Daten verfügbar</div>';

    const formatNumber = (num, decimals = 2) => {
        return num.toFixed(decimals).replace('.', ',');
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Energiebericht - GlitterHue</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                }
                h1, h2, h3 {
                    color: #7d83ff;
                }
                .report-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #eee;
                }
                .report-section {
                    margin-bottom: 30px;
                    padding: 20px;
                    background-color: #f9f9f9;
                    border-radius: 5px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .stat-card {
                    background-color: white;
                    padding: 15px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    text-align: center;
                }
                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #7d83ff;
                    margin: 5px 0;
                }
                .stat-label {
                    font-size: 14px;
                    color: #666;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th, td {
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                th {
                    background-color: #f2f2f2;
                }
                tr:hover {
                    background-color: #f5f5f5;
                }
                .peak-info {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    margin-top: 20px;
                }
                .peak-item {
                    flex: 1;
                    min-width: 200px;
                    background-color: white;
                    padding: 15px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .footer {
                    margin-top: 50px;
                    text-align: center;
                    font-size: 12px;
                    color: #999;
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <h1>GlitterHue Energie-Bericht</h1>
                <p>Erstellt am ${formatDate(reportData.generatedAt)}</p>
            </div>
            
            <div class="report-section">
                <h2>Übersicht</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Aktueller Verbrauch</div>
                        <div class="stat-value">${formatNumber(reportData.summary.current.totalWatts)} W</div>
                        <div class="stat-detail">${reportData.summary.current.totalOnLights} von ${reportData.summary.current.totalLights} Lampen aktiv</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-label">Heutiger Verbrauch</div>
                        <div class="stat-value">${formatNumber(reportData.summary.daily.totalKwh)} kWh</div>
                        <div class="stat-detail">${formatNumber(reportData.summary.daily.cost)} € / ${formatNumber(reportData.summary.daily.co2)} kg CO₂</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-label">Monatlicher Verbrauch</div>
                        <div class="stat-value">${formatNumber(reportData.summary.monthly.totalKwh)} kWh</div>
                        <div class="stat-detail">${formatNumber(reportData.summary.monthly.cost)} € / ${formatNumber(reportData.summary.monthly.co2)} kg CO₂</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-label">Jährliche Prognose</div>
                        <div class="stat-value">${formatNumber(reportData.summary.yearly.estimatedKwh)} kWh</div>
                        <div class="stat-detail">${formatNumber(reportData.summary.yearly.estimatedCost)} € / ${formatNumber(reportData.summary.yearly.estimatedCO2)} kg CO₂</div>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h2>Spitzenverbrauchszeiten</h2>
                <div class="peak-info">
                    ${reportData.peakUsage.hour ? `
                    <div class="peak-item">
                        <h3>Tageszeit</h3>
                        <p>${reportData.peakUsage.hour.period}</p>
                    </div>
                    ` : ''}
                    
                    ${reportData.peakUsage.weekday ? `
                    <div class="peak-item">
                        <h3>Wochentag</h3>
                        <p>${reportData.peakUsage.weekday.period}</p>
                    </div>
                    ` : ''}
                    
                    ${reportData.peakUsage.month ? `
                    <div class="peak-item">
                        <h3>Monat</h3>
                        <p>${reportData.peakUsage.month.period}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="report-section">
                <h2>Monatliche Entwicklung</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Monat</th>
                            <th>Verbrauch (kWh)</th>
                            <th>Kosten (€)</th>
                            <th>CO₂ (kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.monthlyTotals.map(month => `
                        <tr>
                            <td>${month.month}</td>
                            <td>${formatNumber(month.totalWattHours / 1000)}</td>
                            <td>${formatNumber(month.totalCost)}</td>
                            <td>${formatNumber(calculateCO2(month.totalWattHours / 1000, reportData.settings.co2Factor))}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="report-section">
                <h2>Verbrauch pro Lampe</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Letzter Wert (W)</th>
                            <th>Tagesverbrauch (kWh)</th>
                            <th>Monatsverbrauch (kWh)</th>
                            <th>Kosten / Monat (€)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.lights.data.map(light => {
        const now = new Date();
        const currentDateKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

        const dailyKwh = light.dailyTotals && light.dailyTotals[currentDateKey]
            ? light.dailyTotals[currentDateKey].wattHours / 1000
            : 0;

        const monthlyKwh = light.monthlyTotals && light.monthlyTotals[currentMonthKey]
            ? light.monthlyTotals[currentMonthKey].wattHours / 1000
            : 0;

        const monthlyCost = light.monthlyTotals && light.monthlyTotals[currentMonthKey]
            ? light.monthlyTotals[currentMonthKey].cost
            : 0;

        return `
                            <tr>
                                <td>${light.lightId}</td>
                                <td>${formatNumber(light.value || 0)}</td>
                                <td>${formatNumber(dailyKwh, 4)}</td>
                                <td>${formatNumber(monthlyKwh, 4)}</td>
                                <td>${formatNumber(monthlyCost, 4)}</td>
                            </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="footer">
                <p>Dieser Bericht wurde automatisch erstellt durch GlitterHue. 
                Strompreis: ${formatNumber(reportData.settings.energyCost)} €/kWh | 
                CO₂-Faktor: ${reportData.settings.co2Factor} (${CO2_FACTORS[reportData.settings.co2Factor] || 400} g/kWh)</p>
            </div>
        </body>
        </html>
    `;
};

/**
 * Erzeugt einen HTML-Bericht und öffnet ihn in einem neuen Tab
 * @param {Object} options - Optionen für den Bericht
 */
export const openHTMLReport = async (options = {}) => {
    try {
        // Erzeuge Berichtsdaten
        const reportData = await generateCompleteReport(options);

        // Erzeuge HTML
        const htmlContent = generateReportHTML(reportData);

        // Öffne in neuem Tab
        const newTab = window.open();
        newTab.document.write(htmlContent);
        newTab.document.close();

    } catch (error) {
        console.error('Fehler beim Erstellen des HTML-Berichts:', error);
        throw error;
    }
};

// Konstante für CO2-Faktoren (wird im HTML-Bericht verwendet)
const CO2_FACTORS = {
    'germany': 400,  // Deutschland (400 g/kWh)
    'greenEnergy': 50,  // Ökostrom (50 g/kWh)
    'coal': 820,     // Kohlestrom (820 g/kWh)
    'gas': 490,      // Erdgas (490 g/kWh)
    'nuclear': 12    // Atomstrom (12 g/kWh)
};