// src/components/EnhancedEnergyDashboardView.jsx - Erweitertes Energiedashboard mit Datenexport und Charts

import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/energy.css'; // Basis-Styling von EnergyDashboardView
import '../styles/enhanced-energy.css'; // Neues Styling für erweiterte Features
import '../styles/export-import.css'; // Styling für Export/Import

// Importiere unsere neuen Utility-Funktionen
import {
    LIGHT_TYPES, DEFAULT_ENERGY_COST, CO2_FACTORS,
    calculateLightWattage, calculateCO2, calculateCost,
    formatTimestamp, prepareChartData, groupEnergyData,
    findPeakUsagePeriod, exportEnergyData
} from '../utils/EnergyDataUtils';

// Importiere die Datenbank-Funktionen
import {
    saveLightData, getLightData, getAllLightData,
    addToHistory, getLightHistory, saveSetting, getSetting,
    saveDailyTotal, getDailyTotals, saveMonthlyTotal, getMonthlyTotals,
    exportAllData, importData, cleanupOldData
} from '../utils/EnergyDataStorage';

// Importiere die JSON-Import-Funktionen
import {
    importJSONWithFeedback,
    validateJSONData,
    JSON_IMPORT_TYPES
} from '../utils/EnhancedJSONImporter';

// Importiere Komponenten
import EnhancedEnergyExportComponent from './EnhancedEnergyExportComponent';
import ImportProgressModal from './ImportProgressModal';

// === Hauptkomponente für das verbesserte Energiedashboard ===
const EnhancedEnergyDashboardView = ({ lights, username, bridgeIP }) => {
    // Zustandsvariablen
    const [energyCost, setEnergyCost] = useState(DEFAULT_ENERGY_COST);
    const [co2Factor, setCO2Factor] = useState('germany');
    const [usageData, setUsageData] = useState({});
    const [isCollecting, setIsCollecting] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('day');
    const [selectedMetric, setSelectedMetric] = useState('watt');
    const [selectedChart, setSelectedChart] = useState('line');
    const [selectedLightId, setSelectedLightId] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [peakUsage, setPeakUsage] = useState({});
    const [statusMessage, setStatusMessage] = useState({ message: '', type: '' });
    const [exportFormat, setExportFormat] = useState('json');
    const [loadingData, setLoadingData] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [showImportProgress, setShowImportProgress] = useState(false);
    const [importProgress, setImportProgress] = useState({
        progress: 0,
        step: 'reading',
        message: 'Import wird gestartet...',
        result: null
    });
    const [totalStats, setTotalStats] = useState({
        currentWatts: 0,
        dailyKwh: 0,
        monthlyKwh: 0,
        monthlyCost: 0,
        yearlyCost: 0,
        totalCO2: 0
    });

    // Funktionale Refs
    const collectionIntervalRef = useRef(null);
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);

    // Lade gespeicherte Einstellungen beim ersten Rendern
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoadingData(true);

                // Lade gespeicherte Einstellungen
                const savedCost = await getSetting('energyCost', DEFAULT_ENERGY_COST);
                const savedCO2Factor = await getSetting('co2Factor', 'germany');

                setEnergyCost(savedCost);
                setCO2Factor(savedCO2Factor);

                // Lade gespeicherte Verbrauchsdaten für alle Lampen
                const lightDataItems = await getAllLightData();
                const lightDataMap = {};

                lightDataItems.forEach(item => {
                    lightDataMap[item.lightId] = item;
                });

                setUsageData(lightDataMap);

                // Wähle die erste Lampe als Standard aus, wenn keine ausgewählt ist
                if (!selectedLightId && Object.keys(lights).length > 0) {
                    setSelectedLightId(Object.keys(lights)[0]);
                }

                // Starte die Datenerfassung
                startDataCollection();

                // Lade Chart-Daten für die aktuelle Auswahl
                loadChartData();

                // Berechne Statistiken
                calculateTotalStats(lightDataMap);

                // Bestimme Spitzenverbrauchszeiten
                determinePeakUsageTimes();

            } catch (error) {
                console.error('Fehler beim Laden der Daten:', error);
                setStatusMessage({
                    message: 'Fehler beim Laden der Daten: ' + error.message,
                    type: 'error'
                });
            } finally {
                setLoadingData(false);
            }
        };

        loadInitialData();

        // Cleanup bei Komponentenentfernung
        return () => {
            if (collectionIntervalRef.current) {
                clearInterval(collectionIntervalRef.current);
            }
        };
    }, []);

    // Aktualisiere die Chart-Daten, wenn sich Periode oder Metrik ändern
    useEffect(() => {
        loadChartData();
    }, [selectedPeriod, selectedMetric, selectedLightId]);

    // Sammle Daten in regelmäßigen Abständen
    const startDataCollection = useCallback(() => {
        if (isCollecting) return;

        // Setze das Sammelintervall (alle 5 Minuten)
        const COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 Minuten in Millisekunden

        // Führe die Sammlung sofort aus
        collectData();

        // Und dann in regelmäßigen Abständen
        collectionIntervalRef.current = setInterval(collectData, COLLECTION_INTERVAL);

        setIsCollecting(true);
    }, [isCollecting, lights, usageData]);

    // Stoppe die Datensammlung
    const stopDataCollection = useCallback(() => {
        if (collectionIntervalRef.current) {
            clearInterval(collectionIntervalRef.current);
            collectionIntervalRef.current = null;
        }

        setIsCollecting(false);
    }, []);

    // Sammle Daten für alle Lampen
    const collectData = async () => {
        if (!lights || Object.keys(lights).length === 0) return;

        const now = new Date();
        const currentDateKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

        let totalCurrentWatts = 0;
        let updatedUsageData = { ...usageData };

        // Sammle Daten für jede Lampe
        const historyPromises = [];

        for (const [lightId, light] of Object.entries(lights)) {
            try {
                // Berechne aktuelle Leistungsaufnahme
                const currentWattage = calculateLightWattage(light);
                totalCurrentWatts += currentWattage;

                // Lade vorherige Daten für diese Lampe
                const lastData = await getLightData(lightId);

                // Erstelle neuen Datenpunkt
                const newDataPoint = {
                    lightId,
                    timestamp: now.getTime(),
                    value: currentWattage, // Aktuelle Leistung in Watt
                    valueWh: 0,      // Wird unten berechnet
                    isStandby: !light.state.on,
                    brightness: light.state.bri || 0,
                    costPerKwh: energyCost,
                    energyType: co2Factor
                };

                // Berechne Energieverbrauch seit letztem Datenpunkt
                if (lastData && lastData.timestamp) {
                    // Zeitdifferenz in Stunden
                    const hoursSinceLastPoint = (now.getTime() - lastData.timestamp) / (1000 * 60 * 60);

                    // Wh = W * h (vereinfachte Berechnung)
                    newDataPoint.valueWh = currentWattage * hoursSinceLastPoint;

                    // Füge zu den Tageswerten hinzu
                    if (lastData.dailyTotals && lastData.dailyTotals[currentDateKey]) {
                        newDataPoint.dailyTotals = {
                            ...lastData.dailyTotals,
                            [currentDateKey]: {
                                wattHours: (lastData.dailyTotals[currentDateKey].wattHours || 0) + newDataPoint.valueWh,
                                cost: (lastData.dailyTotals[currentDateKey].cost || 0) + (newDataPoint.valueWh / 1000 * energyCost),
                                readings: (lastData.dailyTotals[currentDateKey].readings || 0) + 1,
                                lastUpdate: now.getTime()
                            }
                        };
                    } else {
                        newDataPoint.dailyTotals = {
                            ...(lastData.dailyTotals || {}),
                            [currentDateKey]: {
                                wattHours: newDataPoint.valueWh,
                                cost: newDataPoint.valueWh / 1000 * energyCost,
                                readings: 1,
                                lastUpdate: now.getTime()
                            }
                        };
                    }

                    // Berechne monatliche Werte
                    if (!newDataPoint.monthlyTotals) {
                        newDataPoint.monthlyTotals = lastData.monthlyTotals || {};
                    }

                    if (newDataPoint.monthlyTotals[currentMonthKey]) {
                        newDataPoint.monthlyTotals[currentMonthKey].wattHours += newDataPoint.valueWh;
                        newDataPoint.monthlyTotals[currentMonthKey].cost += newDataPoint.valueWh / 1000 * energyCost;
                        newDataPoint.monthlyTotals[currentMonthKey].readings += 1;
                        newDataPoint.monthlyTotals[currentMonthKey].lastUpdate = now.getTime();
                    } else {
                        newDataPoint.monthlyTotals[currentMonthKey] = {
                            wattHours: newDataPoint.valueWh,
                            cost: newDataPoint.valueWh / 1000 * energyCost,
                            readings: 1,
                            lastUpdate: now.getTime()
                        };
                    }
                } else {
                    // Initialisiere Tages- und Monatssummen für neue Lampen
                    newDataPoint.dailyTotals = {
                        [currentDateKey]: {
                            wattHours: 0,
                            cost: 0,
                            readings: 1,
                            lastUpdate: now.getTime()
                        }
                    };

                    newDataPoint.monthlyTotals = {
                        [currentMonthKey]: {
                            wattHours: 0,
                            cost: 0,
                            readings: 1,
                            lastUpdate: now.getTime()
                        }
                    };
                }

                // Speichere den aktuellen Zustand
                await saveLightData(lightId, newDataPoint);

                // Füge zur Verlaufshistorie hinzu (nur speichern, wenn tatsächlich Verbrauch stattfand)
                if (newDataPoint.valueWh > 0) {
                    historyPromises.push(addToHistory(newDataPoint));
                }

                // Aktualisiere lokalen Zustand
                updatedUsageData[lightId] = newDataPoint;

            } catch (error) {
                console.error(`Fehler bei der Datenerfassung für Lampe ${lightId}:`, error);
            }
        }

        // Warte bis alle History-Einträge gespeichert sind
        await Promise.all(historyPromises);

        // Aktualisiere den globalen Zustand
        setUsageData(updatedUsageData);

        // Berechne Gesamtstatistiken neu
        calculateTotalStats(updatedUsageData);

        // Aktualisiere die Chart-Daten
        loadChartData();

        // Alle 24 Stunden: Bestimme Spitzenverbrauchszeiten neu und bereinige alte Daten
        const hourOfDay = now.getHours();
        const minuteOfHour = now.getMinutes();

        if (hourOfDay === 0 && minuteOfHour < 10) {
            determinePeakUsageTimes();
            cleanupOldData(); // Bereinige alte Daten einmal täglich
        }
    };

    // Lade die Chart-Daten für die aktuelle Auswahl
    const loadChartData = async () => {
        try {
            if (!selectedLightId && !selectedPeriod) return;

            // Für "Alle Lampen" laden wir Daten aus dem Tages-/Monatsspeicher
            if (selectedLightId === 'all') {
                if (selectedPeriod === 'day' || selectedPeriod === 'week') {
                    // Laden der Tageswerte
                    const now = new Date();
                    let startDate;

                    if (selectedPeriod === 'day') {
                        startDate = new Date(now);
                        startDate.setHours(0, 0, 0, 0);
                    } else {
                        startDate = new Date(now);
                        startDate.setDate(now.getDate() - 7);
                        startDate.setHours(0, 0, 0, 0);
                    }

                    const startDateStr = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`;
                    const endDateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

                    const dailyData = await getDailyTotals({
                        startDate: startDateStr,
                        endDate: endDateStr
                    });

                    // Transformiere die Daten für das Chart
                    const formattedData = dailyData.map(day => {
                        let value;

                        switch (selectedMetric) {
                            case 'kwh':
                                value = day.totalWattHours / 1000;
                                break;
                            case 'cost':
                                value = day.totalCost;
                                break;
                            case 'co2':
                                value = calculateCO2(day.totalWattHours / 1000, co2Factor);
                                break;
                            default:
                                value = day.averageWatts;
                        }

                        return {
                            timestamp: new Date(day.date).getTime(),
                            value,
                            label: formatTimestamp(new Date(day.date), 'date')
                        };
                    });

                    setChartData(formattedData);
                } else if (selectedPeriod === 'month' || selectedPeriod === 'year') {
                    // Laden der Monatswerte
                    const year = selectedPeriod === 'year' ? new Date().getFullYear().toString() : null;
                    const monthlyData = await getMonthlyTotals(year);

                    // Transformiere die Daten für das Chart
                    const formattedData = monthlyData.map(month => {
                        let value;

                        switch (selectedMetric) {
                            case 'kwh':
                                value = month.totalWattHours / 1000;
                                break;
                            case 'cost':
                                value = month.totalCost;
                                break;
                            case 'co2':
                                value = calculateCO2(month.totalWattHours / 1000, co2Factor);
                                break;
                            default:
                                value = month.averageWatts;
                        }

                        return {
                            timestamp: new Date(parseInt(month.year), month.monthNum - 1, 1).getTime(),
                            value,
                            label: formatTimestamp(new Date(parseInt(month.year), month.monthNum - 1, 1), 'month')
                        };
                    });

                    setChartData(formattedData);
                }
            } else {
                // Für eine einzelne Lampe laden wir aus der Historie
                const now = new Date();
                let startTime;

                switch (selectedPeriod) {
                    case 'day':
                        startTime = new Date(now);
                        startTime.setHours(0, 0, 0, 0);
                        break;
                    case 'week':
                        startTime = new Date(now);
                        startTime.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        startTime = new Date(now);
                        startTime.setMonth(now.getMonth() - 1);
                        break;
                    case 'year':
                        startTime = new Date(now);
                        startTime.setFullYear(now.getFullYear() - 1);
                        break;
                    default:
                        startTime = new Date(now);
                        startTime.setHours(0, 0, 0, 0);
                }

                // Lade die Verlaufsdaten für die ausgewählte Lampe
                const history = await getLightHistory(selectedLightId, {
                    startTime: startTime.getTime(),
                    endTime: now.getTime()
                });

                // Bereite die Daten für das Chart vor
                const preparedData = prepareChartData(
                    { history },
                    selectedPeriod,
                    selectedMetric
                );

                // Gruppiere die Daten nach der ausgewählten Periode
                let groupBy;
                switch (selectedPeriod) {
                    case 'day':
                        groupBy = 'hour';
                        break;
                    case 'week':
                    case 'month':
                        groupBy = 'day';
                        break;
                    case 'year':
                        groupBy = 'month';
                        break;
                    default:
                        groupBy = 'hour';
                }

                const groupedData = groupEnergyData(preparedData, groupBy);

                // Konvertiere gruppierte Daten in ein Array für das Chart
                const formattedData = Object.keys(groupedData).map(key => {
                    const group = groupedData[key];

                    return {
                        timestamp: parseInt(key.split('-')[0]),  // Verwende den ersten Teil des Schlüssels als Zeitstempel
                        value: group.average,
                        label: key,
                        min: group.min,
                        max: group.max
                    };
                });

                // Sortiere nach Zeitstempel
                formattedData.sort((a, b) => a.timestamp - b.timestamp);

                setChartData(formattedData);
            }
        } catch (error) {
            console.error('Fehler beim Laden der Chart-Daten:', error);
            setStatusMessage({
                message: 'Fehler beim Laden der Chart-Daten: ' + error.message,
                type: 'error'
            });
        }
    };

    // Berechne die Gesamtstatistiken
    const calculateTotalStats = (data) => {
        let currentWatts = 0;
        let dailyKwh = 0;
        let monthlyKwh = 0;
        let monthlyCost = 0;

        const now = new Date();
        const currentDateKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

        // Summiere die Werte aller Lampen
        Object.values(data).forEach(lightData => {
            // Aktueller Verbrauch
            currentWatts += lightData.value || 0;

            // Tagesverbrauch
            if (lightData.dailyTotals && lightData.dailyTotals[currentDateKey]) {
                dailyKwh += lightData.dailyTotals[currentDateKey].wattHours / 1000;
            }

            // Monatsverbrauch
            if (lightData.monthlyTotals && lightData.monthlyTotals[currentMonthKey]) {
                monthlyKwh += lightData.monthlyTotals[currentMonthKey].wattHours / 1000;
                monthlyCost += lightData.monthlyTotals[currentMonthKey].cost;
            }
        });

        // Hochrechnung für das Jahr
        const yearlyCost = monthlyCost * 12;

        // CO2-Berechnung
        const totalCO2 = calculateCO2(monthlyKwh, co2Factor);

        setTotalStats({
            currentWatts,
            dailyKwh,
            monthlyKwh,
            monthlyCost,
            yearlyCost,
            totalCO2
        });
    };

    // Bestimme Spitzenverbrauchszeiten
    const determinePeakUsageTimes = async () => {
        try {
            // Lade Historie für alle Lampen
            const allLightIds = Object.keys(lights);
            let allHistory = [];

            for (const lightId of allLightIds) {
                const history = await getLightHistory(lightId);
                allHistory = [...allHistory, ...history];
            }

            // Finde Spitzenverbrauchszeiten
            const peakHour = findPeakUsagePeriod(allHistory, 'hour');
            const peakDay = findPeakUsagePeriod(allHistory, 'weekday');
            const peakMonth = findPeakUsagePeriod(allHistory, 'month');

            setPeakUsage({
                hour: peakHour,
                day: peakDay,
                month: peakMonth
            });

        } catch (error) {
            console.error('Fehler bei der Bestimmung der Spitzenverbrauchszeiten:', error);
        }
    };

    // Bereinige alte Daten
    const cleanupOldData = async () => {
        try {
            // Standardmäßig behalten wir Daten für ein Jahr
            const maxAgeInDays = 365;

            const deletedCount = await cleanupOldData({
                maxAgeInDays,
                aggregateOldData: true
            });

            console.log(`${deletedCount} alte Datenpunkte wurden bereinigt oder aggregiert.`);
        } catch (error) {
            console.error('Fehler bei der Bereinigung alter Daten:', error);
        }
    };

    // Handle für das Ändern der Stromkosten
    const handleEnergyCostChange = async (newCost) => {
        try {
            const parsedCost = parseFloat(newCost);
            if (isNaN(parsedCost) || parsedCost <= 0) {
                throw new Error('Ungültiger Strompreis');
            }

            // Speichere in den Einstellungen
            await saveSetting('energyCost', parsedCost);

            // Aktualisiere den Zustand
            setEnergyCost(parsedCost);

            setStatusMessage({
                message: 'Strompreis wurde aktualisiert',
                type: 'success'
            });

            // Neuberechnung der Kosten
            collectData();
        } catch (error) {
            setStatusMessage({
                message: 'Fehler beim Aktualisieren des Strompreises: ' + error.message,
                type: 'error'
            });
        }
    };

    // Handle für das Ändern des CO2-Faktors
    const handleCO2FactorChange = async (newFactor) => {
        try {
            if (!CO2_FACTORS[newFactor]) {
                throw new Error('Ungültiger CO2-Faktor');
            }

            // Speichere in den Einstellungen
            await saveSetting('co2Factor', newFactor);

            // Aktualisiere den Zustand
            setCO2Factor(newFactor);

            setStatusMessage({
                message: 'CO2-Faktor wurde aktualisiert',
                type: 'success'
            });

            // Neuberechnung der CO2-Werte
            calculateTotalStats(usageData);
        } catch (error) {
            setStatusMessage({
                message: 'Fehler beim Aktualisieren des CO2-Faktors: ' + error.message,
                type: 'error'
            });
        }
    };

    // Handle für den Import einer Datei
    const handleImportFile = (file) => {
        if (!file) return;

        // Prüfe, ob es sich um eine JSON-Datei handelt
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            setStatusMessage({
                message: 'Es werden nur JSON-Dateien unterstützt',
                type: 'error'
            });
            return;
        }

        setShowImportProgress(true);
        setImportProgress({
            progress: 0,
            step: 'reading',
            message: 'Lese JSON-Datei...',
            result: null
        });

        // Starte den Import mit Feedback
        importJSONWithFeedback(
            file,
            (message, result) => {
                setImportProgress({
                    progress: 100,
                    step: 'complete',
                    message,
                    result
                });

                setStatusMessage({
                    message,
                    type: 'success'
                });

                // Lade Daten neu
                if (result && result.success) {
                    setTimeout(() => {
                        loadInitialData();
                    }, 1000);
                }
            },
            (errorMessage) => {
                setImportProgress({
                    progress: 0,
                    step: 'error',
                    message: errorMessage,
                    result: null
                });

                setStatusMessage({
                    message: errorMessage,
                    type: 'error'
                });
            },
            (progressInfo) => {
                setImportProgress(progressInfo);
            }
        );
    };

    // Schließe den Import-Dialog
    const closeImportProgress = () => {
        setShowImportProgress(false);
        // Setze das File-Input-Feld zurück
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Wiederhole den Import
    const retryImport = () => {
        if (fileInputRef.current && fileInputRef.current.files[0]) {
            const file = fileInputRef.current.files[0];
            handleImportFile(file);
        } else {
            closeImportProgress();
        }
    };

    // Handle für das Ändern der ausgewählten Lampe im Chart
    const handleLightChange = (lightId) => {
        setSelectedLightId(lightId);
    };

    // Status-Meldung löschen nach bestimmter Zeit
    useEffect(() => {
        if (statusMessage.message) {
            const timer = setTimeout(() => {
                setStatusMessage({ message: '', type: '' });
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [statusMessage]);

    // Nochmalige Definition von loadInitialData für Reimport
    const loadInitialData = async () => {
        try {
            setLoadingData(true);

            // Lade gespeicherte Einstellungen
            const savedCost = await getSetting('energyCost', DEFAULT_ENERGY_COST);
            const savedCO2Factor = await getSetting('co2Factor', 'germany');

            setEnergyCost(savedCost);
            setCO2Factor(savedCO2Factor);

            // Lade gespeicherte Verbrauchsdaten für alle Lampen
            const lightDataItems = await getAllLightData();
            const lightDataMap = {};

            lightDataItems.forEach(item => {
                lightDataMap[item.lightId] = item;
            });

            setUsageData(lightDataMap);

            // Wähle die erste Lampe als Standard aus, wenn keine ausgewählt ist
            if (!selectedLightId && Object.keys(lights).length > 0) {
                setSelectedLightId(Object.keys(lights)[0]);
            }

            // Starte die Datenerfassung
            startDataCollection();

            // Lade Chart-Daten für die aktuelle Auswahl
            loadChartData();

            // Berechne Statistiken
            calculateTotalStats(lightDataMap);

            // Bestimme Spitzenverbrauchszeiten
            determinePeakUsageTimes();

        } catch (error) {
            console.error('Fehler beim Laden der Daten:', error);
            setStatusMessage({
                message: 'Fehler beim Laden der Daten: ' + error.message,
                type: 'error'
            });
        } finally {
            setLoadingData(false);
        }
    };

    return (
        <div className="enhanced-energy-dashboard">
            <div className="energy-dashboard-header">
                <h2 className="section-title">Energie-Dashboard</h2>
                <div className="header-actions">
                    <button
                        className="settings-button"
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Einstellungen
                    </button>
                    <button
                        className="export-button"
                        onClick={() => setShowExport(!showExport)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Daten exportieren
                    </button>
                </div>
            </div>

            {statusMessage.message && (
                <div className={`status-message status-${statusMessage.type}`}>
                    {statusMessage.message}
                </div>
            )}

            <div className="energy-dashboard-content">
                {loadingData ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Lade Energiedaten...</p>
                    </div>
                ) : (
                    <>
                        {/* Übersichtsbereich */}
                        <div className="energy-overview-section">
                            <div className="energy-overview-card">
                                <h3>Aktuelle Verbrauchsübersicht</h3>
                                <div className="energy-stats-grid">
                                    <div className="energy-stat-item">
                                        <div className="stat-value">{totalStats.currentWatts.toFixed(1)}</div>
                                        <div className="stat-unit">Watt</div>
                                        <div className="stat-label">Aktueller Verbrauch</div>
                                    </div>
                                    <div className="energy-stat-item">
                                        <div className="stat-value">{totalStats.dailyKwh.toFixed(2)}</div>
                                        <div className="stat-unit">kWh</div>
                                        <div className="stat-label">Heutiger Verbrauch</div>
                                    </div>
                                    <div className="energy-stat-item">
                                        <div className="stat-value">{totalStats.monthlyKwh.toFixed(1)}</div>
                                        <div className="stat-unit">kWh</div>
                                        <div className="stat-label">Monatsverbrauch</div>
                                    </div>
                                    <div className="energy-stat-item">
                                        <div className="stat-value">{totalStats.monthlyCost.toFixed(2)}</div>
                                        <div className="stat-unit">€</div>
                                        <div className="stat-label">Monatskosten</div>
                                    </div>
                                    <div className="energy-stat-item">
                                        <div className="stat-value">{totalStats.yearlyCost.toFixed(2)}</div>
                                        <div className="stat-unit">€</div>
                                        <div className="stat-label">Jahreskosten (Prognose)</div>
                                    </div>
                                    <div className="energy-stat-item">
                                        <div className="stat-value">{totalStats.totalCO2.toFixed(1)}</div>
                                        <div className="stat-unit">kg CO₂</div>
                                        <div className="stat-label">CO₂-Ausstoß (Monat)</div>
                                    </div>
                                </div>

                                {Object.keys(peakUsage).length > 0 && (
                                    <div className="peak-usage-info">
                                        <h4>Spitzenverbrauchszeiten</h4>
                                        <div className="peak-usage-grid">
                                            {peakUsage.hour && (
                                                <div className="peak-usage-item">
                                                    <span className="peak-label">Tageszeit:</span>
                                                    <span className="peak-value">{peakUsage.hour.period}</span>
                                                </div>
                                            )}
                                            {peakUsage.day && (
                                                <div className="peak-usage-item">
                                                    <span className="peak-label">Wochentag:</span>
                                                    <span className="peak-value">{peakUsage.day.period}</span>
                                                </div>
                                            )}
                                            {peakUsage.month && (
                                                <div className="peak-usage-item">
                                                    <span className="peak-label">Monat:</span>
                                                    <span className="peak-value">{peakUsage.month.period}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chart-Bereich */}
                        <div className="energy-chart-section">
                            <div className="chart-controls">
                                <div className="control-group">
                                    <label htmlFor="light-selector">Lampe:</label>
                                    <select
                                        id="light-selector"
                                        value={selectedLightId || 'all'}
                                        onChange={(e) => handleLightChange(e.target.value)}
                                    >
                                        <option value="all">Alle Lampen</option>
                                        {Object.entries(lights).map(([id, light]) => (
                                            <option key={id} value={id}>{light.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="control-group">
                                    <label htmlFor="period-selector">Zeitraum:</label>
                                    <select
                                        id="period-selector"
                                        value={selectedPeriod}
                                        onChange={(e) => setSelectedPeriod(e.target.value)}
                                    >
                                        <option value="day">Tag</option>
                                        <option value="week">Woche</option>
                                        <option value="month">Monat</option>
                                        <option value="year">Jahr</option>
                                    </select>
                                </div>

                                <div className="control-group">
                                    <label htmlFor="metric-selector">Messwert:</label>
                                    <select
                                        id="metric-selector"
                                        value={selectedMetric}
                                        onChange={(e) => setSelectedMetric(e.target.value)}
                                    >
                                        <option value="watt">Leistung (W)</option>
                                        <option value="kwh">Energie (kWh)</option>
                                        <option value="cost">Kosten (€)</option>
                                        <option value="co2">CO₂ (kg)</option>
                                    </select>
                                </div>

                                <div className="control-group">
                                    <label htmlFor="chart-type-selector">Diagrammtyp:</label>
                                    <select
                                        id="chart-type-selector"
                                        value={selectedChart}
                                        onChange={(e) => setSelectedChart(e.target.value)}
                                    >
                                        <option value="line">Linie</option>
                                        <option value="bar">Balken</option>
                                        <option value="area">Fläche</option>
                                    </select>
                                </div>
                            </div>

                            <div className="chart-container">
                                {/* Hier wird das Chart eingefügt */}
                                <EnergyChart
                                    data={chartData}
                                    type={selectedChart}
                                    metric={selectedMetric}
                                    period={selectedPeriod}
                                />
                            </div>
                        </div>

                        {/* Tabellenbereich */}
                        <div className="energy-table-section">
                            <h3>Verbrauchsdetails pro Lampe</h3>
                            <div className="energy-table-container">
                                <table className="energy-table">
                                    <thead>
                                    <tr>
                                        <th>Lampe</th>
                                        <th>Typ</th>
                                        <th>Status</th>
                                        <th>Aktuell (W)</th>
                                        <th>Heute (kWh)</th>
                                        <th>Monat (kWh)</th>
                                        <th>Kosten/Monat (€)</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {Object.entries(lights).map(([lightId, light]) => {
                                        const lightData = usageData[lightId] || { value: 0 };
                                        const lightType = LIGHT_TYPES[light.type] || LIGHT_TYPES['Default'];

                                        // Berechne täglichen und monatlichen Verbrauch
                                        const now = new Date();
                                        const currentDateKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
                                        const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

                                        const dailyKwh = lightData.dailyTotals && lightData.dailyTotals[currentDateKey]
                                            ? lightData.dailyTotals[currentDateKey].wattHours / 1000
                                            : 0;

                                        const monthlyKwh = lightData.monthlyTotals && lightData.monthlyTotals[currentMonthKey]
                                            ? lightData.monthlyTotals[currentMonthKey].wattHours / 1000
                                            : 0;

                                        const monthlyCost = lightData.monthlyTotals && lightData.monthlyTotals[currentMonthKey]
                                            ? lightData.monthlyTotals[currentMonthKey].cost
                                            : 0;

                                        return (
                                            <tr key={lightId}
                                                className={selectedLightId === lightId ? 'selected' : ''}
                                                onClick={() => setSelectedLightId(lightId)}
                                            >
                                                <td>{light.name}</td>
                                                <td>{lightType.name}</td>
                                                <td>
                                                    <span className={`status-indicator ${light.state.on ? 'on' : 'off'}`}></span>
                                                    {light.state.on ? 'Ein' : 'Aus'}
                                                </td>
                                                <td>{lightData.value ? lightData.value.toFixed(1) : '0.0'}</td>
                                                <td>{dailyKwh.toFixed(3)}</td>
                                                <td>{monthlyKwh.toFixed(2)}</td>
                                                <td>{monthlyCost.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Exportbereich (einblendbar) */}
                        {showExport && (
                            <div className="energy-export-section">
                                <EnhancedEnergyExportComponent
                                    lights={lights}
                                    onSuccess={(message) => {
                                        setStatusMessage({
                                            message,
                                            type: 'success'
                                        });
                                        setTimeout(() => setShowExport(false), 3000);
                                    }}
                                    onError={(message) => {
                                        setStatusMessage({
                                            message,
                                            type: 'error'
                                        });
                                    }}
                                />
                            </div>
                        )}

                        {/* Einstellungsbereich (einblendbar) */}
                        {showSettings && (
                            <div className="energy-settings-section">
                                <div className="settings-panel">
                                    <h3>Energieeinstellungen</h3>

                                    <div className="settings-group">
                                        <h4>Stromkosten</h4>
                                        <div className="setting-control">
                                            <label htmlFor="energy-cost-input">Strompreis pro kWh (€):</label>
                                            <input
                                                type="number"
                                                id="energy-cost-input"
                                                value={energyCost}
                                                min="0.01"
                                                step="0.01"
                                                onChange={(e) => handleEnergyCostChange(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="settings-group">
                                        <h4>CO₂-Faktor</h4>
                                        <div className="setting-control">
                                            <label htmlFor="co2-factor-select">Stromquelle:</label>
                                            <select
                                                id="co2-factor-select"
                                                value={co2Factor}
                                                onChange={(e) => handleCO2FactorChange(e.target.value)}
                                            >
                                                <option value="germany">Deutschland (400 g/kWh)</option>
                                                <option value="greenEnergy">Ökostrom (50 g/kWh)</option>
                                                <option value="coal">Kohlestrom (820 g/kWh)</option>
                                                <option value="gas">Erdgas (490 g/kWh)</option>
                                                <option value="nuclear">Atomstrom (12 g/kWh)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="settings-group">
                                        <h4>Datenerfassung</h4>
                                        <div className="setting-control">
                                            <label>Status:</label>
                                            <div className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    id="collection-toggle"
                                                    checked={isCollecting}
                                                    onChange={() => isCollecting ? stopDataCollection() : startDataCollection()}
                                                />
                                                <label htmlFor="collection-toggle"></label>
                                            </div>
                                            <span className="status-text">{isCollecting ? 'Aktiv' : 'Pausiert'}</span>
                                        </div>

                                        <p className="setting-info">
                                            Die Datenerfassung findet alle 5 Minuten statt und speichert den Energieverbrauch deiner Lampen.
                                        </p>
                                    </div>

                                    <div className="settings-group">
                                        <h4>Datenverwaltung</h4>
                                        <button
                                            className="danger-button"
                                            onClick={cleanupOldData}
                                        >
                                            Alte Daten bereinigen
                                        </button>
                                        <p className="setting-info">
                                            Diese Funktion fasst ältere Datenpunkte zusammen, um Speicherplatz zu sparen.
                                            Daten älter als ein Jahr werden automatisch aggregiert.
                                        </p>
                                    </div>

                                    <button
                                        className="close-panel-button"
                                        onClick={() => setShowSettings(false)}
                                    >
                                        Schließen
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Import-Fortschrittsanzeige */}
                        {showImportProgress && (
                            <ImportProgressModal
                                progress={importProgress.progress}
                                step={importProgress.step}
                                message={importProgress.message}
                                result={importProgress.result}
                                onClose={closeImportProgress}
                                onRetry={retryImport}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Energie-Chart-Komponente
const EnergyChart = ({ data, type, metric, period }) => {
    const canvasRef = useRef(null);

    // Zeichne das Chart neu, wenn sich Daten oder Typ ändern
    useEffect(() => {
        if (!canvasRef.current || !data || data.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Setze Canvas-Größe
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;

        // Lösche vorheriges Chart
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Zeichne das Chart basierend auf dem Typ
        switch(type) {
            case 'bar':
                drawBarChart(ctx, data, metric, period);
                break;
            case 'area':
                drawAreaChart(ctx, data, metric, period);
                break;
            case 'line':
            default:
                drawLineChart(ctx, data, metric, period);
        }
    }, [data, type, metric, period]);

    // Funktion zum Zeichnen eines Liniendiagramms
    const drawLineChart = (ctx, data, metric, period) => {
        if (!data || data.length === 0) {
            drawNoDataMessage(ctx);
            return;
        }

        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const padding = { top: 40, right: 20, bottom: 60, left: 60 };

        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Finde Minimum und Maximum der Werte
        const values = data.map(d => d.value);
        const minValue = Math.min(0, ...values);
        const maxValue = Math.max(...values) * 1.1; // 10% Puffer nach oben

        // Achsenbeschriftungen generieren
        const xLabels = generateXLabels(data, period);
        const yLabels = generateYLabels(minValue, maxValue, metric);

        // Zeichne Hintergrundraster
        drawGrid(ctx, padding, chartWidth, chartHeight, xLabels.length);

        // Zeichne Achsen
        drawAxes(ctx, padding, chartWidth, chartHeight);

        // Zeichne Achsenbeschriftungen
        drawAxisLabels(ctx, padding, chartWidth, chartHeight, xLabels, yLabels, metric);

        // Zeichne Datenpunkte und Linien
        ctx.strokeStyle = 'var(--color-primary)';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((d, i) => {
            const x = padding.left + (i / (data.length - 1)) * chartWidth;
            const y = padding.top + chartHeight - ((d.value - minValue) / (maxValue - minValue)) * chartHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // Zeichne einen Datenpunkt
            ctx.fillStyle = 'var(--color-primary-light)';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.stroke();
    };

    // Funktion zum Zeichnen eines Balkendiagramms
    const drawBarChart = (ctx, data, metric, period) => {
        if (!data || data.length === 0) {
            drawNoDataMessage(ctx);
            return;
        }

        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const padding = { top: 40, right: 20, bottom: 60, left: 60 };

        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Finde Minimum und Maximum der Werte
        const values = data.map(d => d.value);
        const minValue = Math.min(0, ...values);
        const maxValue = Math.max(...values) * 1.1; // 10% Puffer nach oben

        // Achsenbeschriftungen generieren
        const xLabels = generateXLabels(data, period);
        const yLabels = generateYLabels(minValue, maxValue, metric);

        // Zeichne Hintergrundraster
        drawGrid(ctx, padding, chartWidth, chartHeight, xLabels.length);

        // Zeichne Achsen
        drawAxes(ctx, padding, chartWidth, chartHeight);

        // Zeichne Achsenbeschriftungen
        drawAxisLabels(ctx, padding, chartWidth, chartHeight, xLabels, yLabels, metric);

        // Zeichne Balken
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;

        ctx.fillStyle = 'var(--color-primary)';

        data.forEach((d, i) => {
            const barHeight = ((d.value - minValue) / (maxValue - minValue)) * chartHeight;

            const x = padding.left + i * (barWidth + barSpacing) + barSpacing / 2;
            const y = padding.top + chartHeight - barHeight;

            ctx.fillRect(x, y, barWidth, barHeight);
        });
    };

    // Funktion zum Zeichnen eines Flächendiagramms
    const drawAreaChart = (ctx, data, metric, period) => {
        if (!data || data.length === 0) {
            drawNoDataMessage(ctx);
            return;
        }

        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const padding = { top: 40, right: 20, bottom: 60, left: 60 };

        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Finde Minimum und Maximum der Werte
        const values = data.map(d => d.value);
        const minValue = Math.min(0, ...values);
        const maxValue = Math.max(...values) * 1.1; // 10% Puffer nach oben

        // Achsenbeschriftungen generieren
        const xLabels = generateXLabels(data, period);
        const yLabels = generateYLabels(minValue, maxValue, metric);

        // Zeichne Hintergrundraster
        drawGrid(ctx, padding, chartWidth, chartHeight, xLabels.length);

        // Zeichne Achsen
        drawAxes(ctx, padding, chartWidth, chartHeight);

        // Zeichne Achsenbeschriftungen
        drawAxisLabels(ctx, padding, chartWidth, chartHeight, xLabels, yLabels, metric);

        // Erstelle Gradient für die Füllung
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, 'rgba(125, 131, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(125, 131, 255, 0.1)');

        // Zeichne Fläche
        ctx.fillStyle = gradient;
        ctx.beginPath();

        // Beginne am unteren linken Punkt des Charts
        ctx.moveTo(padding.left, padding.top + chartHeight);

        // Zeichne die obere Linie des Bereichs
        data.forEach((d, i) => {
            const x = padding.left + (i / (data.length - 1)) * chartWidth;
            const y = padding.top + chartHeight - ((d.value - minValue) / (maxValue - minValue)) * chartHeight;

            ctx.lineTo(x, y);
        });

        // Schließe den Pfad zum unteren rechten Punkt und dann zurück zum Start
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.lineTo(padding.left, padding.top + chartHeight);

        ctx.closePath();
        ctx.fill();

        // Zeichne die obere Linie nochmal separat, damit sie klar sichtbar ist
        ctx.strokeStyle = 'var(--color-primary)';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((d, i) => {
            const x = padding.left + (i / (data.length - 1)) * chartWidth;
            const y = padding.top + chartHeight - ((d.value - minValue) / (maxValue - minValue)) * chartHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    };

    // Hilfsfunktionen für die Charts

    // Zeichne eine Meldung, wenn keine Daten vorhanden sind
    const drawNoDataMessage = (ctx) => {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        ctx.fillStyle = 'var(--color-text-secondary)';
        ctx.font = '16px var(--font-family)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText('Keine Daten verfügbar', width / 2, height / 2);
    };

    // Zeichne ein Hintergrundraster
    const drawGrid = (ctx, padding, width, height, segments) => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Horizontale Linien
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + height * (i / 5);

            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + width, y);
            ctx.stroke();
        }

        // Vertikale Linien
        for (let i = 0; i <= segments; i++) {
            const x = padding.left + width * (i / segments);

            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + height);
            ctx.stroke();
        }
    };

    // Zeichne die Achsen
    const drawAxes = (ctx, padding, width, height) => {
        ctx.strokeStyle = 'var(--color-text-secondary)';
        ctx.lineWidth = 2;

        // X-Achse
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + height);
        ctx.lineTo(padding.left + width, padding.top + height);
        ctx.stroke();

        // Y-Achse
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + height);
        ctx.lineTo(padding.left, padding.top);
        ctx.stroke();
    };

    // Zeichne Achsenbeschriftungen
    const drawAxisLabels = (ctx, padding, width, height, xLabels, yLabels, metric) => {
        ctx.fillStyle = 'var(--color-text-secondary)';
        ctx.font = '12px var(--font-family)';
        ctx.textAlign = 'center';

        // X-Achsenbeschriftungen
        xLabels.forEach((label, i) => {
            const x = padding.left + (i / (xLabels.length - 1)) * width;

            ctx.save();
            ctx.translate(x, padding.top + height + 10);
            ctx.rotate(Math.PI / 4); // Schräge Beschriftung für bessere Lesbarkeit
            ctx.textAlign = 'left';
            ctx.fillText(label, 0, 0);
            ctx.restore();
        });

        // Y-Achsenbeschriftungen
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        yLabels.forEach((label, i) => {
            const y = padding.top + height - (i / (yLabels.length - 1)) * height;

            ctx.fillText(label, padding.left - 10, y);
        });

        // Einheitsbeschriftung auf der Y-Achse
        ctx.save();
        ctx.translate(padding.left - 40, padding.top + height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(getMetricLabel(metric), 0, 0);
        ctx.restore();
    };

    // Generiere X-Achsenbeschriftungen basierend auf der Periode
    const generateXLabels = (data, period) => {
        if (!data || data.length === 0) return [];

        // Anzahl der Beschriftungen je nach Datenmenge und Periodenlänge
        let labelCount;
        switch (period) {
            case 'day':
                labelCount = Math.min(24, data.length);
                break;
            case 'week':
                labelCount = Math.min(7, data.length);
                break;
            case 'month':
                labelCount = Math.min(31, data.length);
                break;
            case 'year':
                labelCount = Math.min(12, data.length);
                break;
            default:
                labelCount = Math.min(12, data.length);
        }

        // Wähle gleichmäßig verteilte Datenpunkte aus
        const step = Math.max(1, Math.floor(data.length / labelCount));
        const labels = [];

        for (let i = 0; i < data.length; i += step) {
            if (labels.length >= labelCount) break;

            const dataPoint = data[i];
            let label;

            switch (period) {
                case 'day':
                    label = formatTimestamp(dataPoint.timestamp, 'hour');
                    break;
                case 'week':
                case 'month':
                    label = formatTimestamp(dataPoint.timestamp, 'date');
                    break;
                case 'year':
                    label = formatTimestamp(dataPoint.timestamp, 'month');
                    break;
                default:
                    label = dataPoint.label || formatTimestamp(dataPoint.timestamp);
            }

            labels.push(label);
        }

        return labels;
    };

    // Generiere Y-Achsenbeschriftungen basierend auf den Werten
    const generateYLabels = (minValue, maxValue, metric) => {
        const count = 6; // Anzahl der Beschriftungen
        const labels = [];

        for (let i = 0; i < count; i++) {
            const value = minValue + (maxValue - minValue) * (i / (count - 1));

            let formattedValue;
            switch (metric) {
                case 'watt':
                    formattedValue = value.toFixed(1);
                    break;
                case 'kwh':
                    formattedValue = value.toFixed(2);
                    break;
                case 'cost':
                    formattedValue = value.toFixed(2);
                    break;
                case 'co2':
                    formattedValue = value.toFixed(1);
                    break;
                default:
                    formattedValue = value.toFixed(1);
            }

            labels.push(formattedValue);
        }

        return labels;
    };

    // Liefere die Beschriftung für die gewählte Metrik
    const getMetricLabel = (metric) => {
        switch (metric) {
            case 'watt':
                return 'Leistung (W)';
            case 'kwh':
                return 'Energie (kWh)';
            case 'cost':
                return 'Kosten (€)';
            case 'co2':
                return 'CO₂ (kg)';
            default:
                return 'Wert';
        }
    };

    return (
        <div className="energy-chart">
            <canvas ref={canvasRef}></canvas>
        </div>
    );
};

export default EnhancedEnergyDashboardView;