// src/components/EnhancedEnergyDashboardView.jsx - Optimierte und fehlertolerante Version
import React, { useState, useEffect, useRef } from 'react';
import '../styles/enhanced-energy.css';
import {
    calculateLightWattage,
    calculateCO2,
    calculateCost,
    groupEnergyData,
    findPeakUsagePeriod,
    formatTimestamp,
    LIGHT_TYPES,
    DEFAULT_ENERGY_COST
} from '../utils/EnergyDataUtils';

import {
    getAllLightData,
    getLightData,
    getLightHistory,
    saveLightData,
    addToHistory,
    getSetting,
    saveSetting,
    getDailyTotals
} from '../utils/EnergyDataStorage';

import { downloadCSVReport } from '../utils/EnergyReportGenerator';
import { exportEnergyData, importEnergyData } from '../utils/EnergyDataUtils';
import { importJSONWithFeedback } from '../utils/EnhancedJSONImporter';
import { renderHourlyChart, renderPeriodChart } from '../utils/EnergyChartRenderer';
import { saveEnergyDataWithFallback } from '../services/energyDataService';

const EnhancedEnergyDashboardView = ({ lights, username, bridgeIP }) => {
    // State für Energiedaten und Einstellungen
    const [energyCost, setEnergyCost] = useState(DEFAULT_ENERGY_COST);
    const [usageData, setUsageData] = useState({});
    const [chartPeriod, setChartPeriod] = useState('hours'); // 'hours', 'day', 'week', 'month'
    const [selectedLight, setSelectedLight] = useState('all'); // 'all' oder eine lightId
    const [selectedMetric, setSelectedMetric] = useState('watt'); // 'watt', 'kwh', 'cost', 'co2'
    const [lightSummary, setLightSummary] = useState([]);
    const [dailyData, setDailyData] = useState([]);
    const [hourlyData, setHourlyData] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState({ message: '', type: '' });
    const [refreshKey, setRefreshKey] = useState(0);
    const [refreshInterval, setRefreshInterval] = useState(300); // Sekunden
    const [collectingData, setCollectingData] = useState(false);
    const [canvasSupported, setCanvasSupported] = useState(true); // Flag für Canvas-Unterstützung

    // Refs
    const chartRef = useRef(null);
    const dataCollectionTimerRef = useRef(null);
    const chartRendererRef = useRef(null);

    // Laden der Daten beim ersten Rendern
    useEffect(() => {
        // Prüfe Canvas-Unterstützung
        checkCanvasSupport();

        // Dashboard initialisieren
        initializeDashboard();

        return () => {
            // Cleanup beim Unmount
            if (dataCollectionTimerRef.current) {
                clearTimeout(dataCollectionTimerRef.current);
            }
        };
    }, []);

    // Neuzeichnen des Charts bei Änderungen
    useEffect(() => {
        if (chartRef.current) {
            drawChart();
        }
    }, [chartPeriod, selectedLight, selectedMetric, refreshKey, usageData, hourlyData, dailyData]);

    // Prüft, ob Canvas im Browser unterstützt wird
    const checkCanvasSupport = () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            setCanvasSupported(!!ctx);
        } catch (error) {
            console.error('Canvas wird nicht unterstützt:', error);
            setCanvasSupported(false);
        }
    };

    // Dashboard initialisieren
    const initializeDashboard = async () => {
        try {
            setLoading(true);

            // Einstellungen laden
            const savedCost = await getSetting('energyCost', DEFAULT_ENERGY_COST);
            setEnergyCost(parseFloat(savedCost) || DEFAULT_ENERGY_COST);

            // Gespeicherte Daten laden
            await loadUsageData();

            // Timer für Datensammlung starten
            startDataCollection();

            // Status setzen
            setStatus({
                message: 'Dashboard erfolgreich initialisiert',
                type: 'success'
            });
        } catch (error) {
            console.error('Fehler bei der Dashboard-Initialisierung:', error);
            setStatus({
                message: `Initialisierungsfehler: ${error.message}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Lade gespeicherte Verbrauchsdaten
    const loadUsageData = async () => {
        try {
            // Alle Lampendaten aus der Datenbank laden
            const allLightData = await getAllLightData();

            if (allLightData && allLightData.length > 0) {
                // Erstelle ein Objekt mit lightId als Schlüssel
                const dataObj = allLightData.reduce((acc, item) => {
                    acc[item.lightId] = item;
                    return acc;
                }, {});

                setUsageData(dataObj);

                // Erstelle eine Zusammenfassung für die Tabelle
                updateLightSummary(dataObj);

                // Lade tägliche und stündliche Daten für Charts
                await loadTimeBasedData();
            } else {
                // Falls keine Daten vorhanden, initialisiere mit den aktuellen Lampen
                initializeNewData();
            }
        } catch (error) {
            console.error('Fehler beim Laden der Energiedaten:', error);
            setStatus({
                message: `Fehler beim Laden der Daten: ${error.message}`,
                type: 'error'
            });

            // Fallback: Neue Daten initialisieren
            initializeNewData();
        }
    };

    // Lade zeitbasierte Daten (täglich und stündlich)
    const loadTimeBasedData = async () => {
        try {
            // Tägliche Daten laden
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);

            const startDateStr = `${thirtyDaysAgo.getFullYear()}-${(thirtyDaysAgo.getMonth() + 1).toString().padStart(2, '0')}-${thirtyDaysAgo.getDate().toString().padStart(2, '0')}`;
            const endDateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

            const daily = await getDailyTotals({
                startDate: startDateStr,
                endDate: endDateStr
            });

            setDailyData(daily || []);

            // Stündliche Daten berechnen
            await loadHourlyData();

        } catch (error) {
            console.error('Fehler beim Laden der zeitbasierten Daten:', error);
            setStatus({
                message: 'Zeitbasierte Daten konnten nicht vollständig geladen werden',
                type: 'warning'
            });
        }
    };

    // Lade stündliche Daten für die aktuelle Ansicht
    const loadHourlyData = async () => {
        try {
            // Für den aktuellen Tag
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const now = new Date();

            // Für jede Lampe die Historie des aktuellen Tages laden
            const hourlyDataAcc = [];

            for (const lightId in lights) {
                if (selectedLight === 'all' || selectedLight === lightId) {
                    const history = await getLightHistory(lightId, {
                        startTime: today.getTime(),
                        endTime: now.getTime()
                    });

                    if (history && history.length > 0) {
                        // Gruppiere nach Stunden
                        const hourlyGroups = groupEnergyData(history, 'hour');

                        // Konvertiere zu Array
                        for (const hourKey in hourlyGroups) {
                            const [year, month, day, hour] = hourKey.split('-');
                            hourlyDataAcc.push({
                                hour: hour,
                                timestamp: new Date(
                                    parseInt(year),
                                    parseInt(month) - 1,
                                    parseInt(day),
                                    parseInt(hour)
                                ).getTime(),
                                value: hourlyGroups[hourKey].average,
                                lightId
                            });
                        }
                    }
                }
            }

            // Nach Zeitstempel sortieren
            hourlyDataAcc.sort((a, b) => a.timestamp - b.timestamp);

            // Wenn keine stündlichen Daten, Beispieldaten erstellen
            if (hourlyDataAcc.length === 0) {
                const sampleData = [];
                for (let h = 0; h < 24; h++) {
                    if (h <= now.getHours()) {
                        const sampleTimestamp = new Date(today);
                        sampleTimestamp.setHours(h);
                        sampleData.push({
                            hour: h.toString(),
                            timestamp: sampleTimestamp.getTime(),
                            value: 0, // Kein Verbrauch als Beispiel
                            lightId: 'sample'
                        });
                    }
                }
                setHourlyData(sampleData);
            } else {
                setHourlyData(hourlyDataAcc);
            }

        } catch (error) {
            console.error('Fehler beim Laden der stündlichen Daten:', error);

            // Fallback zu leeren Beispieldaten
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const now = new Date();

            const sampleData = [];
            for (let h = 0; h < 24; h++) {
                if (h <= now.getHours()) {
                    const sampleTimestamp = new Date(today);
                    sampleTimestamp.setHours(h);
                    sampleData.push({
                        hour: h.toString(),
                        timestamp: sampleTimestamp.getTime(),
                        value: 0,
                        lightId: 'sample'
                    });
                }
            }
            setHourlyData(sampleData);
        }
    };

    // Initialisiere neue Daten für alle Lampen
    const initializeNewData = async () => {
        try {
            const newData = {};
            const now = new Date();
            const currentDateKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
            const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

            // Für jede Lampe eine Grunddatenstruktur erstellen
            for (const lightId in lights) {
                const light = lights[lightId];
                const lightType = LIGHT_TYPES[light.type] || LIGHT_TYPES['Default'];

                // Aktuellen Verbrauch berechnen
                const wattage = calculateLightWattage(light);

                newData[lightId] = {
                    lightId,
                    timestamp: Date.now(),
                    value: wattage,
                    valueWh: 0,
                    isStandby: !light.state.on,
                    brightness: light.state.bri || 0,
                    costPerKwh: energyCost,
                    energyType: 'germany',
                    dailyTotals: {
                        [currentDateKey]: {
                            wattHours: 0,
                            cost: 0,
                            readings: 1,
                            lastUpdate: Date.now()
                        }
                    },
                    monthlyTotals: {
                        [currentMonthKey]: {
                            wattHours: 0,
                            cost: 0,
                            readings: 1,
                            lastUpdate: Date.now()
                        }
                    }
                };

                // Daten speichern
                await saveLightData(lightId, newData[lightId]);

                // Erster Eintrag in der Historie
                await addToHistory({
                    lightId,
                    timestamp: Date.now(),
                    value: wattage,
                    valueWh: 0,
                    isStandby: !light.state.on,
                    brightness: light.state.bri || 0
                });
            }

            setUsageData(newData);
            updateLightSummary(newData);

            // Stündliche Beispieldaten
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const sampleHourlyData = [];
            for (let h = 0; h < 24; h++) {
                if (h <= now.getHours()) {
                    const sampleTimestamp = new Date(today);
                    sampleTimestamp.setHours(h);
                    sampleHourlyData.push({
                        hour: h.toString(),
                        timestamp: sampleTimestamp.getTime(),
                        value: h === now.getHours() ? 5 : 0, // Aktueller Wert als Beispiel
                        lightId: Object.keys(lights)[0] || 'sample'
                    });
                }
            }
            setHourlyData(sampleHourlyData);

        } catch (error) {
            console.error('Fehler bei der Dateninitialisierung:', error);
            setStatus({
                message: 'Fehler bei der Dateninitialisierung',
                type: 'error'
            });
        }
    };

    // Erstelle eine Zusammenfassung für die Tabelle
    const updateLightSummary = (data) => {
        const summary = [];

        for (const lightId in lights) {
            const light = lights[lightId];
            const usage = data[lightId] || {};

            // Aktuelle Zeitpunkte
            const now = new Date();
            const currentDateKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
            const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

            // Tages- und Monatsverbrauch berechnen
            const dailyKwh = usage.dailyTotals && usage.dailyTotals[currentDateKey]
                ? usage.dailyTotals[currentDateKey].wattHours / 1000
                : 0;

            const monthlyKwh = usage.monthlyTotals && usage.monthlyTotals[currentMonthKey]
                ? usage.monthlyTotals[currentMonthKey].wattHours / 1000
                : 0;

            const monthlyCost = usage.monthlyTotals && usage.monthlyTotals[currentMonthKey]
                ? usage.monthlyTotals[currentMonthKey].cost
                : 0;

            summary.push({
                id: lightId,
                name: light.name,
                type: light.type,
                status: light.state.on ? 'on' : 'off',
                currentWatts: usage.value || 0,
                dailyKwh,
                monthlyKwh,
                monthlyCost,
                co2: calculateCO2(monthlyKwh, 'germany'),
                lastUpdate: usage.timestamp || 0
            });
        }

        setLightSummary(summary);
    };

    // Zeichne das Chart mit der korrekten Renderer-Klasse
    const drawChart = () => {
        if (!chartRef.current) return;

        try {
            // Canvas-Größe setzen
            const container = chartRef.current.parentElement;
            if (container) {
                chartRef.current.width = container.clientWidth;
                chartRef.current.height = container.clientHeight;
            }

            // Je nach Zeitraum unterschiedliche Daten verwenden
            if (chartPeriod === 'hours') {
                // Stundendaten filtern, wenn eine bestimmte Lampe ausgewählt ist
                let filteredData = hourlyData;
                if (selectedLight !== 'all') {
                    filteredData = hourlyData.filter(item => item.lightId === selectedLight);
                } else {
                    // Für 'all' die Daten nach Stunden gruppieren und summieren
                    const hourlyGroups = {};
                    hourlyData.forEach(item => {
                        const hour = item.hour;
                        if (!hourlyGroups[hour]) {
                            hourlyGroups[hour] = {
                                hour,
                                timestamp: item.timestamp,
                                value: 0,
                                count: 0
                            };
                        }
                        hourlyGroups[hour].value += item.value || 0;
                        hourlyGroups[hour].count++;
                    });

                    // Durchschnitt pro Stunde berechnen
                    filteredData = Object.values(hourlyGroups).map(h => ({
                        hour: h.hour,
                        timestamp: h.timestamp,
                        value: h.count > 0 ? h.value / h.count : 0
                    })).sort((a, b) => a.timestamp - b.timestamp);
                }

                // Stunden-Chart rendern
                if (canvasSupported) {
                    chartRendererRef.current = renderHourlyChart(
                        chartRef.current,
                        filteredData,
                        selectedMetric,
                        { energyCost }
                    );
                } else {
                    renderFallbackChart();
                }
            } else {
                // Tages-/Wochen-/Monatsdaten
                const filteredData = dailyData;

                if (canvasSupported) {
                    chartRendererRef.current = renderPeriodChart(
                        chartRef.current,
                        filteredData,
                        chartPeriod,
                        selectedMetric,
                        { energyCost }
                    );
                } else {
                    renderFallbackChart();
                }
            }
        } catch (error) {
            console.error('Fehler beim Zeichnen des Charts:', error);
            renderFallbackChart();
        }
    };

    // Fallback-Darstellung wenn Canvas nicht funktioniert
    const renderFallbackChart = () => {
        try {
            const container = chartRef.current.parentElement;
            if (!container) return;

            // Canvas ausblenden
            chartRef.current.style.display = 'none';

            // Vorhandene Fallback-Elemente entfernen
            const existingFallback = container.querySelector('.chart-fallback');
            if (existingFallback) {
                container.removeChild(existingFallback);
            }

            // Fallback-Element erstellen
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'chart-fallback';
            fallbackDiv.style.width = '100%';
            fallbackDiv.style.height = '100%';
            fallbackDiv.style.display = 'flex';
            fallbackDiv.style.alignItems = 'center';
            fallbackDiv.style.justifyContent = 'center';
            fallbackDiv.style.flexDirection = 'column';
            fallbackDiv.style.backgroundColor = 'var(--color-surface)';
            fallbackDiv.style.color = 'var(--color-text)';
            fallbackDiv.style.borderRadius = 'var(--radius-small)';
            fallbackDiv.style.padding = '20px';
            fallbackDiv.style.textAlign = 'center';

            if (chartPeriod === 'hours') {
                if (hourlyData.length === 0) {
                    fallbackDiv.textContent = 'Keine Stundendaten verfügbar';
                } else {
                    // Textbasierte Datenübersicht
                    const infoHeading = document.createElement('h4');
                    infoHeading.textContent = 'Stundenübersicht (Chart nicht verfügbar)';
                    infoHeading.style.marginBottom = '10px';

                    const infoText = document.createElement('p');
                    infoText.style.marginBottom = '15px';
                    infoText.textContent = `${hourlyData.length} Datenpunkte vorhanden für heute`;

                    // Stundenwerte in Tabellenform
                    const tableDiv = document.createElement('div');
                    tableDiv.style.width = '100%';
                    tableDiv.style.maxHeight = '200px';
                    tableDiv.style.overflowY = 'auto';

                    const table = document.createElement('table');
                    table.style.width = '100%';
                    table.style.borderCollapse = 'collapse';

                    // Header
                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                    const headerTime = document.createElement('th');
                    headerTime.textContent = 'Stunde';
                    headerTime.style.padding = '5px';
                    headerTime.style.borderBottom = '1px solid rgba(255,255,255,0.2)';

                    const headerValue = document.createElement('th');
                    headerValue.textContent = 'Wert';
                    headerValue.style.padding = '5px';
                    headerValue.style.borderBottom = '1px solid rgba(255,255,255,0.2)';

                    headerRow.appendChild(headerTime);
                    headerRow.appendChild(headerValue);
                    thead.appendChild(headerRow);
                    table.appendChild(thead);

                    // Body
                    const tbody = document.createElement('tbody');
                    hourlyData.forEach(item => {
                        const row = document.createElement('tr');

                        const timeCell = document.createElement('td');
                        timeCell.textContent = `${item.hour}:00`;
                        timeCell.style.padding = '5px';
                        timeCell.style.borderBottom = '1px solid rgba(255,255,255,0.1)';

                        const valueCell = document.createElement('td');
                        valueCell.textContent = item.value.toFixed(2);
                        valueCell.style.padding = '5px';
                        valueCell.style.borderBottom = '1px solid rgba(255,255,255,0.1)';

                        row.appendChild(timeCell);
                        row.appendChild(valueCell);
                        tbody.appendChild(row);
                    });

                    table.appendChild(tbody);
                    tableDiv.appendChild(table);

                    fallbackDiv.appendChild(infoHeading);
                    fallbackDiv.appendChild(infoText);
                    fallbackDiv.appendChild(tableDiv);
                }
            } else {
                fallbackDiv.textContent = 'Chart kann nicht dargestellt werden';
            }

            container.appendChild(fallbackDiv);
        } catch (error) {
            console.error('Fehler beim Rendering des Fallback-Charts:', error);
        }
    };

    // Datensammlung starten
    const startDataCollection = () => {
        if (collectingData) return;

        setCollectingData(true);
        collectDataPoint();
    };

    // Datensammlung stoppen
    const stopDataCollection = () => {
        setCollectingData(false);

        if (dataCollectionTimerRef.current) {
            clearTimeout(dataCollectionTimerRef.current);
            dataCollectionTimerRef.current = null;
        }
    };

    // Einzelnen Datenpunkt sammeln
    const collectDataPoint = async () => {
        try {
            // Verwende die Nutzer-ID (falls vorhanden, sonst generiere eine temporäre)
            const userId = localStorage.getItem('userId') || 'anonymous-user';

            // Für jede Lampe den aktuellen Verbrauch erfassen
            for (const lightId in lights) {
                const light = lights[lightId];

                // Aktueller Verbrauch in Watt
                const wattage = calculateLightWattage(light);

                // Aktuelles Datum für tägliche/monatliche Totals
                const now = new Date();
                const timestamp = now.getTime();
                const currentDateKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
                const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

                // Bestehende Daten laden
                let lightData = await getLightData(lightId) || {};

                // Energieverbrauch seit letztem Datenpunkt berechnen
                let valueWh = 0;
                if (lightData.timestamp) {
                    // Zeitdifferenz in Stunden
                    const hoursSinceLastPoint = (timestamp - lightData.timestamp) / (1000 * 60 * 60);

                    // Wh = W * h
                    valueWh = wattage * hoursSinceLastPoint;
                }

                // Aktualisiere oder initialisiere tägliche Gesamtwerte
                if (!lightData.dailyTotals) {
                    lightData.dailyTotals = {};
                }

                if (!lightData.dailyTotals[currentDateKey]) {
                    lightData.dailyTotals[currentDateKey] = {
                        wattHours: 0,
                        cost: 0,
                        readings: 0,
                        lastUpdate: timestamp
                    };
                }

                lightData.dailyTotals[currentDateKey].wattHours += valueWh;
                lightData.dailyTotals[currentDateKey].cost += valueWh * energyCost / 1000;
                lightData.dailyTotals[currentDateKey].readings += 1;
                lightData.dailyTotals[currentDateKey].lastUpdate = timestamp;

                // Aktualisiere oder initialisiere monatliche Gesamtwerte
                if (!lightData.monthlyTotals) {
                    lightData.monthlyTotals = {};
                }

                if (!lightData.monthlyTotals[currentMonthKey]) {
                    lightData.monthlyTotals[currentMonthKey] = {
                        wattHours: 0,
                        cost: 0,
                        readings: 0,
                        lastUpdate: timestamp
                    };
                }

                lightData.monthlyTotals[currentMonthKey].wattHours += valueWh;
                lightData.monthlyTotals[currentMonthKey].cost += valueWh * energyCost / 1000;
                lightData.monthlyTotals[currentMonthKey].readings += 1;
                lightData.monthlyTotals[currentMonthKey].lastUpdate = timestamp;

                // Neuen Datenpunkt erstellen
                const newLightData = {
                    ...lightData,
                    lightId,
                    timestamp,
                    value: wattage,
                    valueWh,
                    isStandby: !light.state.on,
                    brightness: light.state.bri || 0,
                    costPerKwh: energyCost,
                    energyType: 'germany'
                };

                // Versuche online zu speichern, mit Fallback zur lokalen Speicherung
                await saveEnergyDataWithFallback(
                    userId,
                    lightId,
                    newLightData,
                    saveLightData // Lokale Speicherfunktion als Fallback
                );

                // Lokale Anzeige aktualisieren
                setUsageData(prev => ({
                    ...prev,
                    [lightId]: newLightData
                }));

                // Daten in der Datenbank aktualisieren
                await saveLightData(lightId, newLightData);

                // Historie aktualisieren
                await addToHistory({
                    lightId,
                    timestamp,
                    value: wattage,
                    valueWh,
                    isStandby: !light.state.on,
                    brightness: light.state.bri || 0,
                    costPerKwh: energyCost
                });

                // Lokalen State aktualisieren
                setUsageData(prev => ({
                    ...prev,
                    [lightId]: newLightData
                }));
            }

            // Zusammenfassung aktualisieren
            updateLightSummary(usageData);

            // Zeitbasierte Daten neu laden
            await loadTimeBasedData();

            // Chart aktualisieren
            setRefreshKey(prev => prev + 1);

        } catch (error) {
            console.error('Fehler bei der Datenerfassung:', error);
            setStatus({
                message: 'Fehler bei der Datenerfassung',
                type: 'error'
            });
        }

        // Timer für nächsten Datenpunkt setzen
        if (collectingData) {
            dataCollectionTimerRef.current = setTimeout(collectDataPoint, refreshInterval * 1000);
        }
    };

    // Manuelles Aktualisieren der Daten
    const refreshData = async () => {
        await loadUsageData();
        setRefreshKey(prev => prev + 1);
        setStatus({
            message: 'Daten aktualisiert',
            type: 'success'
        });
    };

    // Stromkosten-Einstellungen speichern
    const saveSettings = async (settings) => {
        try {
            await saveSetting('energyCost', settings.energyCost);
            setEnergyCost(settings.energyCost);
            setRefreshInterval(settings.refreshInterval || 300);
            setShowSettings(false);

            setStatus({
                message: 'Einstellungen gespeichert',
                type: 'success'
            });

            // Daten neu laden
            await loadUsageData();
            setRefreshKey(prev => prev + 1);

        } catch (error) {
            console.error('Fehler beim Speichern der Einstellungen:', error);
            setStatus({
                message: 'Fehler beim Speichern der Einstellungen',
                type: 'error'
            });
        }
    };

    // CSV-Export starten
    const exportCSV = async (type = 'light-summary') => {
        try {
            setStatus({
                message: 'Exportiere Daten...',
                type: 'info'
            });

            await downloadCSVReport(type, {
                lights: lights,
                energyCost
            });

            setStatus({
                message: 'Export erfolgreich',
                type: 'success'
            });

            setShowExport(false);
        } catch (error) {
            console.error('Fehler beim Exportieren:', error);
            setStatus({
                message: `Exportfehler: ${error.message}`,
                type: 'error'
            });
        }
    };

    // JSON-Import starten
    const handleFileImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setStatus({
            message: 'Importiere Daten...',
            type: 'info'
        });

        importJSONWithFeedback(
            file,
            (message) => {
                setStatus({
                    message: 'Import erfolgreich: ' + message,
                    type: 'success'
                });

                // Daten neu laden
                loadUsageData();
                setShowExport(false);
            },
            (error) => {
                setStatus({
                    message: 'Importfehler: ' + error,
                    type: 'error'
                });
            },
            (progress) => {
                setStatus({
                    message: `Import (${progress.progress}%): ${progress.message}`,
                    type: 'info'
                });
            }
        );
    };

    // Gesamtverbrauch berechnen
    const calculateTotalUsage = () => {
        let totalWatts = 0;
        let totalOnLights = 0;
        let totalDailyKwh = 0;
        let totalMonthlyKwh = 0;
        let totalMonthlyCost = 0;

        // Für jede Lampe summieren
        lightSummary.forEach(light => {
            totalWatts += light.currentWatts || 0;
            if (light.status === 'on') totalOnLights++;
            totalDailyKwh += light.dailyKwh || 0;
            totalMonthlyKwh += light.monthlyKwh || 0;
            totalMonthlyCost += light.monthlyCost || 0;
        });

        return {
            totalWatts,
            totalOnLights,
            totalDailyKwh,
            totalMonthlyKwh,
            totalMonthlyCost,
            totalCO2: calculateCO2(totalMonthlyKwh, 'germany')
        };
    };

    const totals = calculateTotalUsage();

    // Spitzenverbrauchszeiten finden
    const findPeakHours = () => {
        if (!hourlyData || hourlyData.length === 0) return null;

        // Gruppiere nach Stunden
        const hours = {};

        hourlyData.forEach(entry => {
            const hour = entry.hour;
            if (!hours[hour]) {
                hours[hour] = {
                    hour,
                    total: 0,
                    count: 0
                };
            }
            hours[hour].total += entry.value || 0;
            hours[hour].count++;
        });

        // Berechne Durchschnitt pro Stunde
        const hourlyAverages = Object.entries(hours).map(([hour, data]) => ({
            hour,
            average: data.count > 0 ? data.total / data.count : 0,
            formatted: `${hour}:00 - ${hour}:59`
        }));

        // Sortiere absteigend nach Durchschnitt
        hourlyAverages.sort((a, b) => b.average - a.average);

        // Gib die Top 3 zurück
        return hourlyAverages.slice(0, 3);
    };

    const peakHours = findPeakHours();

    return (
        <div className="enhanced-energy-dashboard">
            <div className="energy-dashboard-header">
                <h2 className="section-title">Energie-Dashboard</h2>
                <div className="header-actions">
                    <button onClick={refreshData}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                            <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
                        </svg>
                        Aktualisieren
                    </button>
                    <button onClick={() => setShowSettings(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Einstellungen
                    </button>
                    <button onClick={() => setShowExport(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Daten exportieren
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Lade Energiedaten...</p>
                </div>
            ) : (
                <>
                    <div className="energy-overview-section">
                        <div className="energy-overview-card">
                            <h3>Aktuelle Verbrauchsübersicht</h3>
                            <div className="energy-stats-grid">
                                <div className="energy-stat-item">
                                    <div className="stat-value">
                                        {totals.totalWatts.toFixed(1)}
                                    </div>
                                    <div className="stat-unit">Watt</div>
                                    <div className="stat-label">Aktueller Verbrauch</div>
                                </div>

                                <div className="energy-stat-item">
                                    <div className="stat-value">
                                        {totals.totalDailyKwh.toFixed(2)}
                                    </div>
                                    <div className="stat-unit">kWh</div>
                                    <div className="stat-label">Heutiger Verbrauch</div>
                                </div>

                                <div className="energy-stat-item">
                                    <div className="stat-value">
                                        {totals.totalMonthlyKwh.toFixed(1)}
                                    </div>
                                    <div className="stat-unit">kWh</div>
                                    <div className="stat-label">Monatsverbrauch</div>
                                </div>

                                <div className="energy-stat-item">
                                    <div className="stat-value">
                                        {totals.totalMonthlyCost.toFixed(2)}
                                    </div>
                                    <div className="stat-unit">€</div>
                                    <div className="stat-label">Monatliche Kosten</div>
                                </div>

                                <div className="energy-stat-item">
                                    <div className="stat-value">
                                        {totals.totalCO2.toFixed(2)}
                                    </div>
                                    <div className="stat-unit">kg CO₂</div>
                                    <div className="stat-label">CO₂-Ausstoß (Monat)</div>
                                </div>

                                <div className="energy-stat-item">
                                    <div className="stat-value">
                                        {totals.totalOnLights} / {lightSummary.length}
                                    </div>
                                    <div className="stat-unit">Lampen</div>
                                    <div className="stat-label">Aktive Lampen</div>
                                </div>
                            </div>

                            {peakHours && peakHours.length > 0 && (
                                <div className="peak-usage-info">
                                    <h4>Spitzennutzungszeiten</h4>
                                    <div className="peak-usage-grid">
                                        {peakHours.map((peak, index) => (
                                            <div className="peak-usage-item" key={index}>
                                                <span className="peak-label">{peak.formatted}</span>
                                                <span className="peak-value">{peak.average.toFixed(1)} W</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="energy-chart-section">
                        <div className="chart-controls">
                            <div className="control-group">
                                <label htmlFor="chart-period">Zeitraum:</label>
                                <select
                                    id="chart-period"
                                    value={chartPeriod}
                                    onChange={(e) => setChartPeriod(e.target.value)}
                                >
                                    <option value="hours">Letzte Stunden</option>
                                    <option value="day">Heute</option>
                                    <option value="week">Woche</option>
                                    <option value="month">Monat</option>
                                </select>
                            </div>

                            <div className="control-group">
                                <label htmlFor="chart-light">Lampe:</label>
                                <select
                                    id="chart-light"
                                    value={selectedLight}
                                    onChange={(e) => setSelectedLight(e.target.value)}
                                >
                                    <option value="all">Alle Lampen</option>
                                    {Object.entries(lights).map(([id, light]) => (
                                        <option key={id} value={id}>{light.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="control-group">
                                <label htmlFor="chart-metric">Messgröße:</label>
                                <select
                                    id="chart-metric"
                                    value={selectedMetric}
                                    onChange={(e) => setSelectedMetric(e.target.value)}
                                >
                                    <option value="watt">Leistung (W)</option>
                                    <option value="kwh">Energie (kWh)</option>
                                    <option value="cost">Kosten (€)</option>
                                    <option value="co2">CO₂ (kg)</option>
                                </select>
                            </div>
                        </div>

                        <div className="chart-container">
                            <canvas ref={chartRef} className="energy-chart"></canvas>
                        </div>
                    </div>

                    <div className="energy-table-section">
                        <h3>Geräteübersicht</h3>
                        <div className="energy-table-container">
                            <table className="energy-table">
                                <thead>
                                <tr>
                                    <th>Lampe</th>
                                    <th>Status</th>
                                    <th>Aktuell (W)</th>
                                    <th>Heute (kWh)</th>
                                    <th>Monat (kWh)</th>
                                    <th>Kosten (€)</th>
                                    <th>CO₂ (kg)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {lightSummary.map(light => (
                                    <tr key={light.id}>
                                        <td>{light.name}</td>
                                        <td>
                                            <span className={`status-indicator ${light.status}`}></span>
                                            {light.status === 'on' ? 'Ein' : 'Aus'}
                                        </td>
                                        <td>{light.currentWatts.toFixed(1)}</td>
                                        <td>{light.dailyKwh.toFixed(3)}</td>
                                        <td>{light.monthlyKwh.toFixed(2)}</td>
                                        <td>{light.monthlyCost.toFixed(2)}</td>
                                        <td>{light.co2.toFixed(2)}</td>
                                    </tr>
                                ))}
                                </tbody>
                                <tfoot>
                                <tr>
                                    <th>Gesamt</th>
                                    <th>{totals.totalOnLights} aktiv</th>
                                    <th>{totals.totalWatts.toFixed(1)}</th>
                                    <th>{totals.totalDailyKwh.toFixed(3)}</th>
                                    <th>{totals.totalMonthlyKwh.toFixed(2)}</th>
                                    <th>{totals.totalMonthlyCost.toFixed(2)}</th>
                                    <th>{totals.totalCO2.toFixed(2)}</th>
                                </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {status.message && (
                <div className={`status-message status-${status.type}`}>
                    {status.message}
                </div>
            )}

            {showSettings && (
                <div className="energy-settings-section">
                    <div className="settings-panel">
                        <h3>Einstellungen</h3>
                        <button className="close-panel-button" onClick={() => setShowSettings(false)}>×</button>

                        <div className="settings-group">
                            <h4>Energiekosten</h4>
                            <div className="setting-control">
                                <label htmlFor="energy-cost">Stromkosten pro kWh (€):</label>
                                <input
                                    type="number"
                                    id="energy-cost"
                                    min="0.01"
                                    max="2.00"
                                    step="0.01"
                                    value={energyCost}
                                    onChange={(e) => setEnergyCost(parseFloat(e.target.value) || 0.32)}
                                />
                            </div>
                            <div className="setting-info">
                                Die aktuellen durchschnittlichen Stromkosten in Deutschland liegen bei ca. 0,32 €/kWh.
                            </div>
                        </div>

                        <div className="settings-group">
                            <h4>Datenerfassung</h4>
                            <div className="setting-control">
                                <label htmlFor="refresh-interval">Aktualisierungsintervall (Sekunden):</label>
                                <input
                                    type="number"
                                    id="refresh-interval"
                                    min="60"
                                    max="3600"
                                    step="60"
                                    value={refreshInterval}
                                    onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 300)}
                                />
                            </div>
                            <div className="setting-control">
                                <label>Datenerfassung:</label>
                                <div className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        id="data-collection"
                                        checked={collectingData}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                startDataCollection();
                                            } else {
                                                stopDataCollection();
                                            }
                                        }}
                                    />
                                    <label htmlFor="data-collection"></label>
                                </div>
                                <span className="status-text">{collectingData ? 'Aktiv' : 'Inaktiv'}</span>
                            </div>
                        </div>

                        <div className="button-group">
                            <button onClick={() => saveSettings({ energyCost, refreshInterval })}>
                                Einstellungen speichern
                            </button>
                            <button className="danger-button" onClick={() => setShowSettings(false)}>
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showExport && (
                <div className="energy-export-section">
                    <div className="export-panel">
                        <h3>Daten exportieren / importieren</h3>
                        <button className="close-panel-button" onClick={() => setShowExport(false)}>×</button>

                        <div className="export-info">
                            <h4>Hinweise</h4>
                            <ul>
                                <li>Exportierte Daten enthalten den gesamten Energieverlauf aller Lampen</li>
                                <li>CSV-Exports können in Excel, Google Sheets oder anderen Tabellenkalkulationen geöffnet werden</li>
                                <li>Die JSON-Daten enthalten alle Rohdaten und können später wieder importiert werden</li>
                            </ul>
                        </div>

                        <div className="export-options">
                            <div className="export-option">
                                <h4>CSV exportieren</h4>
                                <p>Exportiere Daten im CSV-Format für die Verwendung in Tabellenkalkulationen.</p>
                                <div className="button-group">
                                    <button onClick={() => exportCSV('light-summary')}>
                                        Lampen-Übersicht
                                    </button>
                                    <button onClick={() => exportCSV('daily')}>
                                        Tageswerte
                                    </button>
                                </div>
                            </div>

                            <div className="export-option">
                                <h4>JSON importieren</h4>
                                <p>Importiere zuvor exportierte GlitterHue-Energiedaten.</p>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileImport}
                                    className="file-input"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedEnergyDashboardView;