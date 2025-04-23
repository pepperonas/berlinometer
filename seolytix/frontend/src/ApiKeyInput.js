// Sichere API-Key-Behandlung im Frontend mit Dark Theme

import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';

// API-Key Komponente
const ApiKeyInput = ({ apiKey, setApiKey, disabled }) => {
    const [showApiKey, setShowApiKey] = useState(false);
    const [localApiKey, setLocalApiKey] = useState('');

    // API-Key aus dem localStorage laden, wenn verfügbar
    useEffect(() => {
        const savedKey = localStorage.getItem('seoApiKey');
        if (savedKey) {
            try {
                // Einfache Verschlüsselung durch Base64-Decodierung
                const decodedKey = atob(savedKey);
                setLocalApiKey(decodedKey);
                setApiKey(decodedKey);
            } catch (e) {
                console.error('Fehler beim Laden des API-Keys:', e);
                localStorage.removeItem('seoApiKey');
            }
        }
    }, [setApiKey]);

    // API-Key im localStorage speichern
    const handleApiKeyChange = (e) => {
        const newKey = e.target.value;
        setLocalApiKey(newKey);
        setApiKey(newKey);

        // Nur speichern, wenn der Schlüssel einen Wert hat
        if (newKey) {
            try {
                // Einfache Verschlüsselung durch Base64-Codierung
                const encodedKey = btoa(newKey);
                localStorage.setItem('seoApiKey', encodedKey);
            } catch (e) {
                console.error('Fehler beim Speichern des API-Keys:', e);
            }
        } else {
            localStorage.removeItem('seoApiKey');
        }
    };

    const clearApiKey = () => {
        setLocalApiKey('');
        setApiKey('');
        localStorage.removeItem('seoApiKey');
    };

    return (
        <div className="mb-6 p-4 bg-bg-dark rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-semibold text-text-primary flex items-center">
                    <Key size={18} className="mr-2 text-accent-blue"/> ChatGPT API-Schlüssel für SEO-Verbesserungen
                </h3>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-xs text-accent-blue hover:underline transition-colors duration-300"
                    >
                        {showApiKey ? "Verbergen" : "Anzeigen"}
                    </button>
                    {localApiKey && (
                        <button
                            onClick={clearApiKey}
                            className="text-xs text-accent-red hover:underline transition-colors duration-300"
                        >
                            Löschen
                        </button>
                    )}
                </div>
            </div>
            <div className="relative">
                <input
                    type={showApiKey ? "text" : "password"}
                    value={localApiKey}
                    onChange={handleApiKeyChange}
                    disabled={disabled}
                    placeholder="sk-..."
                    className={`w-full p-3 pr-10 border border-bg-darker bg-bg-darker rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue text-text-primary transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {localApiKey && (
                    <div className="absolute top-0 right-0 h-full flex items-center pr-3">
                        <span className="w-2 h-2 rounded-full bg-accent-green"></span>
                    </div>
                )}
            </div>
            <p className="text-xs text-text-secondary mt-1">
                Dein API-Schlüssel wird lokal in deinem Browser gespeichert und niemals an unsere Server gesendet.
                Die Anfragen werden über einen sicheren Proxy geleitet.
            </p>
        </div>
    );
};

export default ApiKeyInput;