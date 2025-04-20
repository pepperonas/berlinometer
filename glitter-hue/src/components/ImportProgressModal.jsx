// src/components/ImportProgressModal.jsx - Komponente zur Anzeige des Import-Fortschritts

import React from 'react';

/**
 * Fortschrittsanzeige für den Import-Prozess
 * @param {Object} props - Komponenteneigenschaften
 * @param {number} props.progress - Fortschritt in Prozent (0-100)
 * @param {string} props.step - Aktueller Importschritt (reading, validating, importing, complete)
 * @param {string} props.message - Meldung zum aktuellen Schritt
 * @param {Object} props.result - Ergebnis des Imports (optional)
 * @param {Function} props.onClose - Callback zum Schließen der Anzeige
 * @param {Function} props.onRetry - Callback zum erneuten Versuch (optional)
 */
const ImportProgressModal = ({
                                 progress = 0,
                                 step = 'reading',
                                 message = 'Import wird gestartet...',
                                 result = null,
                                 onClose,
                                 onRetry
                             }) => {
    // Ermittle Status-Klasse basierend auf dem Schritt
    const getStatusClass = () => {
        switch (step) {
            case 'error':
                return 'status-error';
            case 'complete':
                return 'status-success';
            case 'validating':
            case 'importing':
                return 'status-info';
            default:
                return '';
        }
    };

    // Ermittle Icon basierend auf dem Schritt
    const getStepIcon = () => {
        switch (step) {
            case 'reading':
                return (
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                );
            case 'validating':
                return (
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                );
            case 'importing':
                return (
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                );
            case 'complete':
                return (
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                );
            case 'error':
                return (
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="import-progress-modal">
            <div className="import-progress-content">
                <div className={`import-progress-header ${getStatusClass()}`}>
                    <div className="import-step-icon">
                        {getStepIcon()}
                    </div>
                    <h3>
                        {step === 'complete' ? 'Import abgeschlossen' :
                            step === 'error' ? 'Import fehlgeschlagen' :
                                'JSON-Datei importieren'}
                    </h3>
                    {onClose && (
                        <button
                            className="close-button"
                            onClick={onClose}
                            aria-label="Schließen"
                        >
                            ×
                        </button>
                    )}
                </div>

                <div className="import-progress-body">
                    {step !== 'complete' && step !== 'error' && (
                        <div className="progress-container">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <div className="progress-percentage">{progress}%</div>
                        </div>
                    )}

                    <div className="import-message">
                        <p>{message}</p>
                    </div>

                    {result && (
                        <div className="import-result">
                            {result.format && (
                                <div className="result-detail">
                                    <span className="detail-label">Format:</span>
                                    <span className="detail-value">{result.format}</span>
                                </div>
                            )}

                            {result.details && (
                                <div className="result-detail">
                                    <span className="detail-label">Details:</span>
                                    <span className="detail-value">{result.details}</span>
                                </div>
                            )}

                            {result.stats && (
                                <div className="result-stats">
                                    <div className="stats-title">Importierte Daten:</div>
                                    <ul className="stats-list">
                                        {Object.entries(result.stats).map(([key, value]) => (
                                            <li key={key}>
                                                <span className="stat-label">{key}:</span>
                                                <span className="stat-value">{value}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="import-progress-footer">
                    {step === 'complete' && (
                        <button
                            className="primary-button"
                            onClick={onClose}
                        >
                            Schließen
                        </button>
                    )}

                    {step === 'error' && (
                        <div className="button-group">
                            {onRetry && (
                                <button
                                    className="retry-button"
                                    onClick={onRetry}
                                >
                                    Erneut versuchen
                                </button>
                            )}
                            <button
                                className="cancel-button"
                                onClick={onClose}
                            >
                                Abbrechen
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportProgressModal;