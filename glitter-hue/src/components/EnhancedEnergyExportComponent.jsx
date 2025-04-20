// src/components/EnhancedEnergyExportComponent.jsx - Verbesserte Export/Import-Komponente mit mehr Optionen

import React, { useState, useRef, useEffect } from 'react';
import {
    downloadCSVReport,
    openHTMLReport,
    generateCompleteReport
} from '../utils/EnergyReportGenerator';
import { exportAllData } from '../utils/EnergyDataStorage';
import { exportEnergyData } from '../utils/EnergyDataUtils';
import {
    importJSONWithFeedback,
    validateJSONData,
    JSON_IMPORT_TYPES
} from '../utils/EnhancedJSONImporter';
import ImportProgressModal from './ImportProgressModal';

// Exportformate
const EXPORT_FORMATS = {
    JSON: 'json',
    CSV: 'csv',
    HTML: 'html'
};

// Berichtstypen
const REPORT_TYPES = {
    COMPLETE: 'complete',
    LIGHT_SUMMARY: 'light-summary',
    DAILY: 'daily',
    MONTHLY: 'monthly',
    HISTORY: 'history'
};

/**
 * Erweiterte Komponente für den Export und Import von Energiedaten
 * mit zusätzlicher Unterstützung für verschiedene JSON-Formate
 */
const EnhancedEnergyExportComponent = ({ lights, onSuccess, onError }) => {
    const [exportFormat, setExportFormat] = useState(EXPORT_FORMATS.CSV);
    const [reportType, setReportType] = useState(REPORT_TYPES.LIGHT_SUMMARY);
    const [selectedLightId, setSelectedLightId] = useState('all');
    const [timeRange, setTimeRange] = useState('month'); // 'day', 'week', 'month', 'year'
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [advancedOptions, setAdvancedOptions] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [jsonOptions, setJsonOptions] = useState({
        prettyPrint: true,
        includeMetadata: true,
        compressHistory: false
    });
    const [showImportProgress, setShowImportProgress] = useState(false);
    const [importProgress, setImportProgress] = useState({
        progress: 0,
        step: 'reading',
        message: 'Import wird gestartet...',
        result: null
    });
    const [dragActive, setDragActive] = useState(false);

    const fileInputRef = useRef(null);
    const dragAreaRef = useRef(null);

    // Setze Standard-Zeitraum basierend auf dem gewählten Bereich
    const getTimeRangeParameters = () => {
        const now = new Date();
        let startTime, endTime;

        // Wenn benutzerdefinierte Daten angegeben wurden und advancedOptions aktiviert ist
        if (advancedOptions && customStartDate) {
            startTime = new Date(customStartDate).getTime();
            endTime = customEndDate ? new Date(customEndDate).getTime() : now.getTime();
            return { startTime, endTime };
        }

        // Standard-Zeiträume
        switch (timeRange) {
            case 'day':
                startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
                endTime = now.getTime();
                break;
            case 'week':
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
                endTime = now.getTime();
                break;
            case 'month':
                startTime = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
                endTime = now.getTime();
                break;
            case 'year':
                startTime = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
                endTime = now.getTime();
                break;
            default:
                startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
                endTime = now.getTime();
        }

        return { startTime, endTime };
    };

    // Formatiere Datum zur Anzeige
    const formatDateForDisplay = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Erstelle Dateinamen für den Export
    const getExportFilename = () => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let typeString = '';

        switch (reportType) {
            case REPORT_TYPES.COMPLETE:
                typeString = 'complete-report';
                break;
            case REPORT_TYPES.LIGHT_SUMMARY:
                typeString = 'light-summary';
                break;
            case REPORT_TYPES.DAILY:
                typeString = 'daily';
                break;
            case REPORT_TYPES.MONTHLY:
                typeString = 'monthly';
                break;
            case REPORT_TYPES.HISTORY:
                typeString = `history-${selectedLightId}`;
                break;
            default:
                typeString = 'energy-data';
        }

        return `glitterhue-${typeString}-${timestamp}.${exportFormat}`;
    };

    // Handle für den Export
    const handleExport = async () => {
        try {
            setIsExporting(true);

            const timeParams = getTimeRangeParameters();

            // Optionen für den Export
            const exportOptions = {
                lights,
                lightId: selectedLightId === 'all' ? null : selectedLightId,
                ...timeParams,
                prettyPrint: jsonOptions.prettyPrint,
                includeMetadata: jsonOptions.includeMetadata,
                compressHistory: jsonOptions.compressHistory
            };

            // Je nach Format und Typ exportieren
            if (exportFormat === EXPORT_FORMATS.JSON) {
                // JSON-Export
                const data = await generateCompleteReport(exportOptions);

                // Filter- und Kompressionsoptionen anwenden
                if (jsonOptions.compressHistory && data.lights && data.lights.data) {
                    data.lights.data.forEach(light => {
                        if (light.history && light.history.length > 100) {
                            // Reduziere Anzahl der Datenpunkte durch Sampling
                            const sampleRate = Math.ceil(light.history.length / 100);
                            light.history = light.history.filter((_, i) => i % sampleRate === 0);
                        }
                    });
                }

                // Exportiere die Daten
                const indent = jsonOptions.prettyPrint ? 2 : 0;
                exportEnergyData(data, getExportFilename(), indent);
            } else if (exportFormat === EXPORT_FORMATS.CSV) {
                // CSV-Export
                await downloadCSVReport(reportType, exportOptions);
            } else if (exportFormat === EXPORT_FORMATS.HTML) {
                // HTML-Bericht
                await openHTMLReport(exportOptions);
            }

            if (onSuccess) {
                onSuccess('Daten wurden erfolgreich exportiert');
            }
        } catch (error) {
            console.error('Fehler beim Exportieren der Daten:', error);
            if (onError) {
                onError('Fehler beim Exportieren: ' + error.message);
            }
        } finally {
            setIsExporting(false);
        }
    };

    // Handle für Drag-Events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    // Handle für Drop-Event
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImportFile(e.dataTransfer.files[0]);
        }
    };

    // Handle für Import-Button
    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Handle für das Dateiauswahl-Event
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleImportFile(file);
        }
    };

    // Handle für den Import einer Datei
    const handleImportFile = (file) => {
        if (!file) return;

        // Prüfe, ob es sich um eine JSON-Datei handelt
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            if (onError) {
                onError('Es werden nur JSON-Dateien unterstützt');
            }
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

                if (onSuccess) {
                    onSuccess(message);
                }
            },
            (errorMessage) => {
                setImportProgress({
                    progress: 0,
                    step: 'error',
                    message: errorMessage,
                    result: null
                });

                if (onError) {
                    onError(errorMessage);
                }
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

    // Rückgabezeitraum als Text
    const getTimeRangeText = () => {
        if (advancedOptions && customStartDate) {
            let text = `vom ${formatDateForDisplay(customStartDate)}`;
            if (customEndDate) {
                text += ` bis ${formatDateForDisplay(customEndDate)}`;
            } else {
                text += ' bis heute';
            }
            return text;
        }

        switch (timeRange) {
            case 'day':
                return 'von heute';
            case 'week':
                return 'der letzten Woche';
            case 'month':
                return 'des letzten Monats';
            case 'year':
                return 'des letzten Jahres';
            default:
                return 'des gewählten Zeitraums';
        }
    };

    // Aktualisiere den gewählten Berichtstyp basierend auf der Auswahl
    const updateReportTypeFromSelection = (lightId, format) => {
        if (lightId !== 'all' && format === EXPORT_FORMATS.CSV) {
            // Wenn eine einzelne Lampe ausgewählt ist, ändere den Berichtstyp auf History
            setReportType(REPORT_TYPES.HISTORY);
        } else if (lightId === 'all' && reportType === REPORT_TYPES.HISTORY) {
            // Wenn "Alle Lampen" ausgewählt wird und der Berichtstyp "History" war, ändere zu "Light Summary"
            setReportType(REPORT_TYPES.LIGHT_SUMMARY);
        }
    };

    // Vorbereite aktuelle Daten für die Datei-Auswahl
    const prepareCurrentDates = () => {
        if (!customStartDate) {
            const now = new Date();
            const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

            setCustomStartDate(oneMonthAgo.toISOString().split('T')[0]);
            setCustomEndDate(now.toISOString().split('T')[0]);
        }
    };

    // Aktiviere erweiterte Optionen
    const toggleAdvancedOptions = () => {
        const newValue = !advancedOptions;
        setAdvancedOptions(newValue);

        if (newValue) {
            prepareCurrentDates();
        }
    };

    // Toggle JSON-Option
    const toggleJsonOption = (option) => {
        setJsonOptions(prev => ({
            ...prev,
            [option]: !prev[option]
        }));
    };

    // Setze Event-Listener für Drag-and-Drop
    useEffect(() => {
        const dragArea = dragAreaRef.current;
        if (dragArea) {
            dragArea.addEventListener('dragenter', handleDrag);
            dragArea.addEventListener('dragleave', handleDrag);
            dragArea.addEventListener('dragover', handleDrag);
            dragArea.addEventListener('drop', handleDrop);

            return () => {
                dragArea.removeEventListener('dragenter', handleDrag);
                dragArea.removeEventListener('dragleave', handleDrag);
                dragArea.removeEventListener('dragover', handleDrag);
                dragArea.removeEventListener('drop', handleDrop);
            };
        }
    }, []);

    return (
        <div className="enhanced-energy-export-component">
            <div className="export-section">
                <h3>Daten exportieren</h3>

                <div className="export-form">
                    <div className="form-group">
                        <label htmlFor="export-format">Format:</label>
                        <select
                            id="export-format"
                            value={exportFormat}
                            onChange={(e) => {
                                const newFormat = e.target.value;
                                setExportFormat(newFormat);
                                updateReportTypeFromSelection(selectedLightId, newFormat);
                            }}
                        >
                            <option value={EXPORT_FORMATS.CSV}>CSV (Excel)</option>
                            <option value={EXPORT_FORMATS.JSON}>JSON (Vollständig)</option>
                            <option value={EXPORT_FORMATS.HTML}>HTML (Bericht)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="light-selection">Lampe:</label>
                        <select
                            id="light-selection"
                            value={selectedLightId}
                            onChange={(e) => {
                                const newLightId = e.target.value;
                                setSelectedLightId(newLightId);
                                updateReportTypeFromSelection(newLightId, exportFormat);
                            }}
                        >
                            <option value="all">Alle Lampen</option>
                            {Object.entries(lights).map(([id, light]) => (
                                <option key={id} value={id}>{light.name}</option>
                            ))}
                        </select>
                    </div>

                    {exportFormat === EXPORT_FORMATS.CSV && (
                        <div className="form-group">
                            <label htmlFor="report-type">Berichtstyp:</label>
                            <select
                                id="report-type"
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                disabled={selectedLightId !== 'all' && reportType === REPORT_TYPES.HISTORY}
                            >
                                {selectedLightId === 'all' ? (
                                    <>
                                        <option value={REPORT_TYPES.LIGHT_SUMMARY}>Lampenübersicht</option>
                                        <option value={REPORT_TYPES.DAILY}>Tageswerte</option>
                                        <option value={REPORT_TYPES.MONTHLY}>Monatswerte</option>
                                        <option value={REPORT_TYPES.COMPLETE}>Vollständig</option>
                                    </>
                                ) : (
                                    <option value={REPORT_TYPES.HISTORY}>Verlaufsdaten</option>
                                )}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="time-range">Zeitraum:</label>
                        <select
                            id="time-range"
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            disabled={advancedOptions}
                        >
                            <option value="day">Heute</option>
                            <option value="week">Letzte Woche</option>
                            <option value="month">Letzter Monat</option>
                            <option value="year">Letztes Jahr</option>
                        </select>
                    </div>

                    <div className="advanced-options-toggle">
                        <button
                            type="button"
                            className="toggle-button"
                            onClick={toggleAdvancedOptions}
                        >
                            {advancedOptions ? 'Einfache Optionen' : 'Erweiterte Optionen'}
                        </button>
                    </div>

                    {advancedOptions && (
                        <div className="advanced-options">
                            <div className="form-group">
                                <label htmlFor="custom-start-date">Von:</label>
                                <input
                                    type="date"
                                    id="custom-start-date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="custom-end-date">Bis:</label>
                                <input
                                    type="date"
                                    id="custom-end-date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {exportFormat === EXPORT_FORMATS.JSON && (
                                <div className="json-options">
                                    <h4>JSON-Optionen</h4>
                                    <div className="option-checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={jsonOptions.prettyPrint}
                                                onChange={() => toggleJsonOption('prettyPrint')}
                                            />
                                            Formatiert (mit Einrückung)
                                        </label>
                                    </div>
                                    <div className="option-checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={jsonOptions.includeMetadata}
                                                onChange={() => toggleJsonOption('includeMetadata')}
                                            />
                                            Metadaten einschließen
                                        </label>
                                    </div>
                                    <div className="option-checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={jsonOptions.compressHistory}
                                                onChange={() => toggleJsonOption('compressHistory')}
                                            />
                                            Verlaufsdaten komprimieren
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="export-summary">
                    {exportFormat === EXPORT_FORMATS.CSV && (
                        <p>
                            Exportiert {reportType === REPORT_TYPES.LIGHT_SUMMARY ? 'Lampenübersicht' :
                            reportType === REPORT_TYPES.DAILY ? 'Tageswerte' :
                                reportType === REPORT_TYPES.MONTHLY ? 'Monatswerte' :
                                    reportType === REPORT_TYPES.HISTORY ? 'Verlaufsdaten' : 'vollständige Daten'}
                            {' '} für {selectedLightId === 'all' ? 'alle Lampen' : `"${lights[selectedLightId]?.name || selectedLightId}"`} {getTimeRangeText()}.
                        </p>
                    )}

                    {exportFormat === EXPORT_FORMATS.JSON && (
                        <p>
                            Exportiert vollständige Daten für alle Lampen im JSON-Format.
                            Diese Datei kann später wieder importiert werden.
                            {jsonOptions.compressHistory && ' Die Verlaufsdaten werden komprimiert, um die Dateigröße zu reduzieren.'}
                        </p>
                    )}

                    {exportFormat === EXPORT_FORMATS.HTML && (
                        <p>
                            Öffnet einen formattierten HTML-Bericht in einem neuen Tab.
                            Dieser kann ausgedruckt oder als PDF gespeichert werden.
                        </p>
                    )}
                </div>

                <div className="export-actions">
                    <button
                        className="export-button"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <>
                                <span className="loading-spinner small"></span>
                                Exportiere...
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Exportieren
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="import-section">
                <h3>Daten importieren</h3>

                <div
                    className={`drag-drop-area ${dragActive ? 'active' : ''}`}
                    ref={dragAreaRef}
                >
                    <div className="drag-drop-content">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <p>
                            {dragActive
                                ? 'Datei hier ablegen'
                                : 'Ziehe eine JSON-Datei hierher oder klicke, um eine Datei auszuwählen'}
                        </p>
                        <button
                            type="button"
                            className="browse-button"
                            onClick={handleImportClick}
                        >
                            Durchsuchen...
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />
                    </div>
                </div>

                <div className="import-info">
                    <h4>Unterstützte Formate:</h4>
                    <ul className="format-list">
                        <li>
                            <strong>GlitterHue Export</strong> - Exportierte Daten aus dieser App
                        </li>
                        <li>
                            <strong>Hue API Daten</strong> - Von der Hue API exportierte Daten
                        </li>
                        <li>
                            <strong>Generische Energiedaten</strong> - JSON-Dateien mit Energieangaben
                        </li>
                    </ul>
                    <p className="warning-note">
                        <strong>Hinweis:</strong> Bestehende Daten werden beim Import ersetzt.
                        Erstelle vorher eine Sicherung mit der Export-Funktion.
                    </p>
                </div>
            </div>

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
        </div>
    );
};

export default EnhancedEnergyExportComponent;