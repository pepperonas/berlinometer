// src/components/forms/TimerForm.jsx
import React, { useState } from 'react';
import { TIME_CONTROL_TYPES } from '../../services/UnifiedTimeControlService';

const TimerForm = ({ timer, lights, onSave, onCancel }) => {
    // Lokaler State für Formularwerte
    const [name, setName] = useState(timer.name || '');
    const [duration, setDuration] = useState(timer.duration || 30);
    const [selectedLights, setSelectedLights] = useState(timer.lightIds || []);
    const [interval, setInterval] = useState(timer.interval || 30); // Nur für zyklische Timer

    // Voreingestellte Werte für Dauer
    const durationPresets = [5, 15, 30, 60, 120];

    // Handler für Lichtauswahl
    const handleLightToggle = (lightId) => {
        if (selectedLights.includes(lightId)) {
            setSelectedLights(selectedLights.filter(id => id !== lightId));
        } else {
            setSelectedLights([...selectedLights, lightId]);
        }
    };

    // Alle Lichter auswählen
    const selectAllLights = () => {
        setSelectedLights(Object.keys(lights));
    };

    // Keine Lichter auswählen
    const selectNoLights = () => {
        setSelectedLights([]);
    };

    // Daten speichern
    const handleSubmit = (e) => {
        e.preventDefault();

        // Aktualisierter Timer mit neuen Werten
        const updatedTimer = {
            ...timer,
            name,
            duration: parseInt(duration),
            lightIds: selectedLights,
            restart: true // Timer neu starten
        };

        // Für zyklische Timer das Intervall setzen
        if (timer.type === TIME_CONTROL_TYPES.CYCLE) {
            updatedTimer.interval = parseInt(interval);
        }

        onSave(updatedTimer);
    };

    // Formattiere Lichtname und Status
    const formatLightLabel = (lightId) => {
        const light = lights[lightId];
        if (!light) return lightId;
        return `${light.name} ${light.state?.on ? '(Ein)' : '(Aus)'}`;
    };

    return (
        <form onSubmit={handleSubmit} className="timer-form">
            <div className="form-group">
                <label htmlFor="timer-name">Name</label>
                <input
                    type="text"
                    id="timer-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Timer-Name"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="timer-duration">
                    {timer.type === TIME_CONTROL_TYPES.CYCLE ? 'Intervalldauer' : 'Dauer'} (Minuten)
                </label>
                <div className="presets-container">
                    <input
                        type="number"
                        id="timer-duration"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                        min="1"
                        max="1440"
                        className="duration-input"
                    />

                    <div className="presets-buttons">
                        {durationPresets.map(preset => (
                            <button
                                key={preset}
                                type="button"
                                className={`preset-button ${duration === preset ? 'preset-active' : ''}`}
                                onClick={() => setDuration(preset)}
                            >
                                {preset} Min
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {timer.type === TIME_CONTROL_TYPES.CYCLE && (
                <div className="form-group">
                    <label htmlFor="timer-interval">Intervall (Minuten)</label>
                    <div className="presets-container">
                        <input
                            type="number"
                            id="timer-interval"
                            value={interval}
                            onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                            min="1"
                            max="1440"
                            className="duration-input"
                        />

                        <div className="presets-buttons">
                            {[5, 10, 30, 60].map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    className={`preset-button ${interval === preset ? 'preset-active' : ''}`}
                                    onClick={() => setInterval(preset)}
                                >
                                    {preset} Min
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="hint-text">Zeit zwischen Ein- und Ausschalten</p>
                </div>
            )}

            <div className="form-group">
                <label>Lampen auswählen</label>
                <div className="light-selection-buttons">
                    <button type="button" onClick={selectAllLights}>
                        Alle auswählen
                    </button>
                    <button type="button" onClick={selectNoLights}>
                        Keine auswählen
                    </button>
                </div>

                <div className="light-selection-grid">
                    {Object.keys(lights).map(lightId => (
                        <div key={lightId} className="light-checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedLights.includes(lightId)}
                                    onChange={() => handleLightToggle(lightId)}
                                />
                                {formatLightLabel(lightId)}
                            </label>
                        </div>
                    ))}
                </div>

                {selectedLights.length === 0 && (
                    <p className="hint-text warning">
                        Bitte wähle mindestens eine Lampe aus.
                    </p>
                )}
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    className="secondary-button"
                    onClick={onCancel}
                >
                    Abbrechen
                </button>
                <button
                    type="submit"
                    disabled={selectedLights.length === 0}
                >
                    Speichern
                </button>
            </div>
        </form>
    );
};

export default TimerForm;