import React, {useEffect, useState, useRef} from 'react';
import {Copy, Eye, EyeOff, RefreshCw, Save, Upload} from 'lucide-react';

// Konstanten für Kompatibilität
const AES_GCM_IV_LENGTH = 12; // Gemeinsame IV-Länge für Web und Android

// Hilfsfunktion zur Erkennung der AES-Schlüsselgröße
function detectKeySize(key) {
    // Entferne alle Whitespace und Zeilenumbrüche
    const cleanKey = key.replace(/[\r\n\t\f\v \s]/g, '');

    // Für Hex-Format: Jedes Zeichen stellt 4 Bits dar, daher Anzahl der Zeichen × 4 = Bits
    if (/^[0-9A-Fa-f]+$/.test(cleanKey)) {
        const bits = cleanKey.length * 4;

        // Standardgrößen für AES sind 128, 192 und 256 Bit
        if (bits === 128 || bits === 192 || bits === 256) {
            return bits;
        }

        // Wenn kein standardmäßiger Schlüssel, zum nächsthöheren Standard abrunden
        if (bits < 128) return 128;
        if (bits < 192) return 128;
        if (bits < 256) return 192;
        return 256;
    }

    // Für Base64-Format: Dekodieren und Länge in Bytes × 8 = Bits
    try {
        const binary = atob(cleanKey);
        const bits = binary.length * 8;

        // Standardgrößen für AES ermitteln
        if (bits === 128 || bits === 192 || bits === 256) {
            return bits;
        }

        // Android verwendet typischerweise 256-Bit-Schlüssel
        if (bits >= 256) return 256;
        if (bits >= 192) return 192;
        return 128;
    } catch (e) {
        // Wenn Base64-Dekodierung fehlschlägt, standardmäßig 256 Bit verwenden
        console.warn("Schlüsselformat nicht erkannt, standardmäßig 256 Bit verwenden:", e);
        return 256;
    }
}

// Hilfsfunktion zum Bereinigen von Base64-Strings aus Android
function cleanAndroidBase64(base64String) {
    if (!base64String) return '';
    // Entferne alle Whitespace-Zeichen (Leerzeichen, Tabs, Zeilenumbrüche)
    return base64String.replace(/[\r\n\t\f\v \s]/g, '');
}

// AES-Komponente für CryptoVault
export function AESEncryption() {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState('encrypt');
    const [keySize, setKeySize] = useState(256);
    const [savedKeys, setSavedKeys] = useState([]);
    const [keyName, setKeyName] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [useExternalKey, setUseExternalKey] = useState(false);
    const [externalKeyText, setExternalKeyText] = useState('');
    const [detectedKeySize, setDetectedKeySize] = useState(null);
    const importFileRef = useRef(null);

    // Lade gespeicherte Schlüssel beim Start mit verbesserter Fehlerbehandlung
    useEffect(() => {
        try {
            const storedKeys = localStorage.getItem('aesKeys');
            if (storedKeys) {
                const keys = JSON.parse(storedKeys);
                // Filtere Schlüssel, die nicht vom Typ 'file-encryption' sind (die sind für FileEncryption)
                const filteredKeys = keys.filter(key => !key.type || key.type !== 'file-encryption');
                setSavedKeys(filteredKeys);
                console.log('AES-Schlüssel aus localStorage geladen:', filteredKeys.length);
            } else {
                setSavedKeys([]);
                console.log('Keine AES-Schlüssel im localStorage gefunden');
            }
        } catch (err) {
            console.error('Fehler beim Laden der Schlüssel:', err);
            setSavedKeys([]);
        }
    }, []);

    // Speichere Schlüssel in localStorage mit robuster Fehlerbehandlung
    const saveKey = () => {
        try {
            if (!keyName.trim()) {
                setError('Bitte einen Namen für den Schlüssel eingeben');
                return;
            }

            if (!password) {
                setError('Bitte einen Schlüssel eingeben oder generieren');
                return;
            }

            const newKey = {
                id: Date.now().toString(),
                name: keyName,
                value: password,
                keySize: keySize,
                type: 'text-encryption', // Typ-Markierung zur Unterscheidung
                createdAt: new Date().toISOString()
            };

            // Bestehende Schlüssel laden
            let existingKeys = [];
            try {
                const storedKeys = localStorage.getItem('aesKeys');
                if (storedKeys) {
                    existingKeys = JSON.parse(storedKeys);
                }
            } catch (e) {
                console.error('Fehler beim Laden bestehender Schlüssel:', e);
                existingKeys = [];
            }

            // Filtere Dateiverschlüsselungsschlüssel heraus, um sie nicht zu überschreiben
            const filteredKeys = existingKeys.filter(key => !key.type || key.type !== 'file-encryption');

            // Neuen Schlüssel hinzufügen
            const updatedKeys = [...filteredKeys, newKey];

            // In localStorage speichern
            localStorage.setItem('aesKeys', JSON.stringify(updatedKeys));
            console.log('Schlüssel in localStorage gespeichert, neue Anzahl:', updatedKeys.length);

            // State aktualisieren
            setSavedKeys(prevKeys => [...prevKeys.filter(key => key.id !== newKey.id), newKey]);
            setKeyName('');
            setInfo('Schlüssel erfolgreich gespeichert');
            setTimeout(() => setInfo(''), 3000);
        } catch (err) {
            console.error('Fehler beim Speichern des Schlüssels:', err);
            setError(`Fehler beim Speichern: ${err.message}`);
            setTimeout(() => setError(''), 3000);
        }
    };

    // Lösche einen gespeicherten Schlüssel mit robuster Fehlerbehandlung
    const deleteKey = (id) => {
        try {
            // Bestehende Schlüssel laden
            let allKeys = [];
            try {
                const storedKeys = localStorage.getItem('aesKeys');
                if (storedKeys) {
                    allKeys = JSON.parse(storedKeys);
                }
            } catch (e) {
                console.error('Fehler beim Laden bestehender Schlüssel:', e);
                allKeys = [];
            }

            // Filtere den zu löschenden Schlüssel aus allen Schlüsseln
            const updatedAllKeys = allKeys.filter(key => key.id !== id);

            // In localStorage speichern
            localStorage.setItem('aesKeys', JSON.stringify(updatedAllKeys));
            console.log('Schlüssel aus localStorage entfernt, neue Anzahl:', updatedAllKeys.length);

            // State aktualisieren, aber nur für die relevanten Schlüssel
            const updatedKeys = savedKeys.filter(key => key.id !== id);
            setSavedKeys(updatedKeys);

            setInfo('Schlüssel erfolgreich gelöscht');
            setTimeout(() => setInfo(''), 3000);
        } catch (err) {
            console.error('Fehler beim Löschen des Schlüssels:', err);
            setError(`Fehler beim Löschen: ${err.message}`);
            setTimeout(() => setError(''), 3000);
        }
    };

    // Lade einen gespeicherten Schlüssel
    const loadKey = (key) => {
        setPassword(key.value);
        setKeySize(key.keySize);
        setInfo('Schlüssel geladen');
        setTimeout(() => setInfo(''), 2000);
    };

    // Exportiere einen AES-Schlüssel im PEM-ähnlichen Format
    const exportKey = (key) => {
        try {
            // Warnung anzeigen, da AES-Schlüssel sensibel sind
            if (!window.confirm(
                'WARNUNG: Der AES-Schlüssel wird unverschlüsselt exportiert. ' +
                'Dies kann ein Sicherheitsrisiko darstellen, wenn die Datei in falsche Hände gerät. ' +
                'Bist du sicher, dass du fortfahren möchtest?'
            )) {
                return;
            }

            // AES-Schlüssel im PEM-ähnlichen Format
            const pemHeader = '-----BEGIN AES KEY-----\n';
            const pemFooter = '\n-----END AES KEY-----';

            // Key-Informationen in JSON umwandeln
            const keyData = {
                alg: 'AES',
                key: key.value,
                size: key.keySize,
                created: key.createdAt,
                type: 'text-encryption' // Typ zur Unterscheidung hinzufügen
            };

            // Base64-Kodierung
            const jsonStr = JSON.stringify(keyData);
            const base64Data = btoa(jsonStr);

            // Base64 in 64-Zeichen-Zeilen aufteilen
            let formattedKey = '';
            for (let i = 0; i < base64Data.length; i += 64) {
                formattedKey += base64Data.slice(i, i + 64) + '\n';
            }

            const pemContent = pemHeader + formattedKey + pemFooter;

            // Download-Link erstellen
            const blob = new Blob([pemContent], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `aes_key_${key.name.replace(/\s+/g, '_')}.pem`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setInfo('AES-Schlüssel erfolgreich exportiert');
            setTimeout(() => setInfo(''), 3000);
        } catch (err) {
            setError(`Fehler beim Exportieren des Schlüssels: ${err.message}`);
            setTimeout(() => setError(''), 3000);
        }
    };

    // Exportiere alle AES-Schlüssel als JSON
    const exportAllKeys = () => {
        if (savedKeys.length === 0) {
            setError('Keine Schlüssel zum Exportieren vorhanden');
            return;
        }

        // Warnung anzeigen, da AES-Schlüssel sensibel sind
        if (!window.confirm(
            'WARNUNG: Die AES-Schlüssel werden unverschlüsselt exportiert. ' +
            'Dies kann ein Sicherheitsrisiko darstellen, wenn die Datei in falsche Hände gerät. ' +
            'Bist du sicher, dass du fortfahren möchtest?'
        )) {
            return;
        }

        try {
            // Schlüssel in JSON umwandeln
            const keysData = JSON.stringify(savedKeys, null, 2);

            // Download-Link erstellen
            const blob = new Blob([keysData], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cryptovault_aes_keys.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setInfo('Alle AES-Schlüssel wurden erfolgreich exportiert');
            setTimeout(() => setInfo(''), 3000);
        } catch (err) {
            setError(`Fehler beim Exportieren: ${err.message}`);
            setTimeout(() => setError(''), 3000);
        }
    };

    // Datei-Upload-Handler für JSON-Import von AES-Schlüsseln
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;

                // Zuerst prüfen, ob es ein direkter Base64-Schlüssel sein könnte (von Android)
                if (content.match(/^[A-Za-z0-9+/=\s]+$/) && !content.includes('{') && !content.includes('[')) {
                    // Wahrscheinlich ein direkter Base64-String oder Hex-String als AES-Schlüssel von Android
                    const cleanContent = content.replace(/[\r\n\t\f\v ]/g, '');

                    // Automatische Erkennung der Schlüsselgröße
                    const detectedSize = detectKeySize(cleanContent);
                    console.log(`Erkannte Schlüsselgröße für importierten Schlüssel: ${detectedSize} Bit`);

                    // Erstelle einen neuen Schlüssel mit dem importierten Wert
                    const newKey = {
                        id: Date.now().toString(),
                        name: file.name.replace(/\.[^/.]+$/, "") || "Importierter Schlüssel",
                        value: cleanContent,
                        keySize: detectedSize, // Automatisch erkannte Größe
                        type: 'text-encryption',
                        createdAt: new Date().toISOString()
                    };

                    // Bestehende Schlüssel laden
                    let allKeys = [];
                    try {
                        const storedKeys = localStorage.getItem('aesKeys');
                        if (storedKeys) {
                            allKeys = JSON.parse(storedKeys);
                        }
                    } catch (e) {
                        console.error('Fehler beim Laden bestehender Schlüssel:', e);
                        allKeys = [];
                    }

                    // Neuen Schlüssel hinzufügen
                    allKeys.push(newKey);

                    // In localStorage speichern
                    localStorage.setItem('aesKeys', JSON.stringify(allKeys));

                    // State aktualisieren
                    setSavedKeys(prevKeys => [...prevKeys, newKey]);
                    setInfo('Android AES-Schlüssel erfolgreich importiert');
                    setTimeout(() => setInfo(''), 3000);
                    return;
                }

                // Normale JSON-Verarbeitung für Web-App-Schlüssel
                const importedKeys = JSON.parse(content);

                // Validierung der importierten Daten
                if (!Array.isArray(importedKeys)) {
                    throw new Error('Ungültiges Dateiformat. Erwartet ein Array von Schlüsseln.');
                }

                // Prüfe, ob jeder Schlüssel die erforderlichen Eigenschaften hat
                importedKeys.forEach(key => {
                    if (!key.id || !key.name || !key.value || !key.createdAt) {
                        throw new Error('Ungültiges Schlüssel-Format in der Datei.');
                    }
                });

                // Nur Textencryption-Schlüssel importieren (Dateiverschlüsselungsschlüssel ausfiltern)
                const textEncryptionKeys = importedKeys.filter(key => !key.type || key.type === 'text-encryption');

                // Importierte Schlüssel zu vorhandenen hinzufügen, Duplikate vermeiden
                const existingIds = new Set(savedKeys.map(key => key.id));
                const newKeys = textEncryptionKeys.filter(key => !existingIds.has(key.id));

                if (newKeys.length === 0) {
                    setInfo('Keine neuen AES-Schlüssel zum Importieren gefunden');
                } else {
                    // Bestehende Schlüssel laden
                    let allKeys = [];
                    try {
                        const storedKeys = localStorage.getItem('aesKeys');
                        if (storedKeys) {
                            allKeys = JSON.parse(storedKeys);
                        }
                    } catch (e) {
                        console.error('Fehler beim Laden bestehender Schlüssel:', e);
                        allKeys = [];
                    }

                    // Filtere File-Encryption-Schlüssel heraus
                    const fileEncryptionKeys = allKeys.filter(key => key.type === 'file-encryption');
                    const textEncryptionKeys = allKeys.filter(key => !key.type || key.type === 'text-encryption');

                    // Neue Schlüssel hinzufügen und mit Dateiverschlüsselungsschlüsseln zusammenführen
                    const updatedTextKeys = [...textEncryptionKeys, ...newKeys];
                    const updatedAllKeys = [...fileEncryptionKeys, ...updatedTextKeys];

                    // In localStorage speichern
                    localStorage.setItem('aesKeys', JSON.stringify(updatedAllKeys));

                    // State aktualisieren (nur mit relevanten Schlüsseln für diese Komponente)
                    setSavedKeys([...savedKeys, ...newKeys]);
                    setInfo(`${newKeys.length} AES-Schlüssel erfolgreich importiert`);
                }

                setTimeout(() => setInfo(''), 3000);
            } catch (err) {
                setError(`Fehler beim Importieren der Schlüssel: ${err.message}`);
                console.error(err);
            }

            // Zurücksetzen des Datei-Inputs
            event.target.value = null;
        };

        reader.onerror = () => {
            setError('Fehler beim Lesen der Datei');
            // Zurücksetzen des Datei-Inputs
            event.target.value = null;
        };

        reader.readAsText(file);
    };

    // Generiere zufälligen AES Schlüssel
    const generateKey = () => {
        try {
            const array = new Uint8Array(keySize / 8);
            window.crypto.getRandomValues(array);
            const key = Array.from(array)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            setPassword(key);
            setInfo('Zufälliger Schlüssel generiert');
            setTimeout(() => setInfo(''), 2000);
        } catch (err) {
            setError(`Fehler bei der Schlüsselgenerierung: ${err.message}`);
            setTimeout(() => setError(''), 3000);
        }
    };

    // Kopiere Text in die Zwischenablage
    const copyToClipboard = (text) => {
        try {
            navigator.clipboard.writeText(text);
            setInfo('In Zwischenablage kopiert');
            setTimeout(() => setInfo(''), 2000);
        } catch (err) {
            setError(`Fehler beim Kopieren: ${err.message}`);
            setTimeout(() => setError(''), 3000);
        }
    };

    // Ver- oder Entschlüsseln mit AES
    const processText = async () => {
        try {
            setError('');
            if (!inputText) {
                setError('Bitte Text eingeben');
                return;
            }
            if (!password) {
                setError('Bitte Passwort eingeben oder generieren');
                return;
            }
            
            // Option für Android-kompatible Verschlüsselung (mit Salt)
            const useAndroidCompatibility = document.getElementById('useAndroidFormat')?.checked || false;
            console.log('Android-Kompatibilitätsmodus:', useAndroidCompatibility);
            
            // Bereinigen des Passworts/Schlüssels von Whitespace
            const cleanPassword = cleanAndroidBase64(password);

            // Prüfen ob es ein direkter Base64/Hex-Key ist oder ein Passwort
            let passwordBuffer;
            
            if (/^[A-Za-z0-9+/=]+$/.test(cleanPassword.trim()) && cleanPassword.trim().length >= 24) {
                try {
                    // Als direkten Base64-Schlüssel versuchen
                    console.log('Versuche Schlüssel als Base64 zu interpretieren');
                    const rawKey = atob(cleanPassword.trim());
                    const keyBytes = new Uint8Array(rawKey.length);
                    for (let i = 0; i < rawKey.length; i++) {
                        keyBytes[i] = rawKey.charCodeAt(i);
                    }
                    passwordBuffer = keyBytes.buffer;
                    console.log('Base64-Schlüssel erkannt mit Länge:', rawKey.length, 'Bytes');
                } catch (e) {
                    console.log('Base64-Interpretation fehlgeschlagen, verwende SHA-256');
                    // Fallback auf SHA-256
                    passwordBuffer = await crypto.subtle.digest(
                        'SHA-256',
                        new TextEncoder().encode(cleanPassword)
                    );
                }
            } else if (/^[0-9A-Fa-f]+$/.test(cleanPassword.trim())) {
                // Als Hex-String interpretieren
                try {
                    console.log('Versuche Schlüssel als Hex-String zu interpretieren');
                    const keyBytes = new Uint8Array(cleanPassword.trim().length / 2);
                    for (let i = 0; i < cleanPassword.trim().length; i += 2) {
                        keyBytes[i/2] = parseInt(cleanPassword.trim().substring(i, i+2), 16);
                    }
                    passwordBuffer = keyBytes.buffer;
                    console.log('Hex-Schlüssel erkannt mit Länge:', keyBytes.length, 'Bytes');
                } catch (e) {
                    console.log('Hex-Interpretation fehlgeschlagen, verwende SHA-256');
                    // Fallback auf SHA-256
                    passwordBuffer = await crypto.subtle.digest(
                        'SHA-256',
                        new TextEncoder().encode(cleanPassword)
                    );
                }
            } else {
                // Standard-Passwort-Hashing mit SHA-256 wie in der Android-App
                console.log('Verwende SHA-256 Passwort-Hashing');
                passwordBuffer = await crypto.subtle.digest(
                    'SHA-256',
                    new TextEncoder().encode(cleanPassword)
                );
            }
            
            // Passwort-Hash für Debug-Zwecke (keine sensiblen Daten)
            const debugHashHex = Array.from(new Uint8Array(passwordBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('').substring(0, 8) + '...';
            console.log('Schlüssel/Hash (ersten 4 Bytes):', debugHashHex);

            // IV für AES-GCM (zufällig) - 12 Bytes wie in Android
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            if (mode === 'encrypt') {
                // Erkenne Schlüsselgröße automatisch, wenn es ein externer Schlüssel ist
                let effectiveKeySize = keySize;
                if (useExternalKey && externalKeyText) {
                    // Automatische Erkennung der Schlüsselgröße für den manuell eingegebenen Schlüssel
                    effectiveKeySize = detectKeySize(password);
                    console.log(`Erkannte Schlüsselgröße für externen Schlüssel: ${effectiveKeySize} Bit`);
                }

                // Schlüssel aus Passwort ableiten
                // WebCrypto API unterstützt nur 128 und 256 Bit
                // Wir verwenden immer 256 Bit für maximale Kompatibilität und Sicherheit
                console.log(`Ursprüngliche Schlüsselgröße: ${effectiveKeySize} Bit`);
                const keyImportSize = 256; // Nur 256 Bit verwenden
                
                // Verwende IMMER SHA-256 für den Schlüssel um exakt 32 Bytes (256 Bits) zu haben
                let effectiveBuffer;
                try {
                    // SHA-256 erzeugt immer genau 32 Bytes (256 Bits)
                    effectiveBuffer = await crypto.subtle.digest(
                        'SHA-256',
                        new TextEncoder().encode(cleanPassword)
                    );
                    
                    console.log(`Schlüssel mit SHA-256 erzeugt: ${effectiveBuffer.byteLength * 8} Bits`);
                } catch (e) {
                    console.error('Fehler bei Schlüsselerzeugung:', e);
                    throw new Error('Fehler bei der Schlüsselerzeugung: ' + e.message);
                }
                
                let key;
                try {
                    key = await crypto.subtle.importKey(
                        'raw',
                        effectiveBuffer,
                        {name: 'AES-GCM', length: keyImportSize},
                        false,
                        ['encrypt']
                    );
                    console.log('Schlüssel erfolgreich importiert');
                } catch (e) {
                    console.error('Fehler beim Schlüsselimport:', e);
                    console.error('Buffer-Länge:', effectiveBuffer.byteLength, 'Bytes');
                    throw new Error('Fehler beim Schlüsselimport: ' + e.message);
                }

                // Text verschlüsseln
                const encodedText = new TextEncoder().encode(inputText);
                
                if (useAndroidCompatibility) {
                    // Android-kompatibles Format mit Salt
                    // Erzeuge Salt wie in der Android-App (16 Bytes)
                    const salt = window.crypto.getRandomValues(new Uint8Array(16));
                    
                    // Verschlüssele mit Salt als AAD (Additional Authenticated Data) wie in Android
                    const encryptedBuffer = await crypto.subtle.encrypt(
                        {
                            name: 'AES-GCM', 
                            iv, 
                            additionalData: salt  // Salt als AAD für Android-Kompatibilität
                        },
                        key,
                        encodedText
                    );
                    
                    // Format: [Salt(16 Bytes) + IV(12 Bytes) + EncryptedData]
                    const encryptedArray = new Uint8Array(encryptedBuffer);
                    const result = new Uint8Array(salt.length + iv.length + encryptedArray.length);
                    result.set(salt, 0);                      // Salt zuerst
                    result.set(iv, salt.length);               // Dann IV
                    result.set(encryptedArray, salt.length + iv.length);  // Dann verschlüsselte Daten
                    
                    // Als Base64 ausgeben
                    const base64Result = btoa(String.fromCharCode(...result));
                    setOutputText(base64Result);
                    setInfo('Im Android-kompatiblen Format mit Salt verschlüsselt');
                } else {
                    // Web-App-Standard-Format: [IV(12 Bytes) + EncryptedData]
                    const encryptedBuffer = await crypto.subtle.encrypt(
                        {name: 'AES-GCM', iv},
                        key,
                        encodedText
                    );
                    
                    // Verschlüsselten Text und IV zusammen codieren
                    const encryptedArray = new Uint8Array(encryptedBuffer);
                    const result = new Uint8Array(iv.length + encryptedArray.length);
                    result.set(iv);
                    result.set(encryptedArray, iv.length);
                    
                    // Als Base64 ausgeben
                    const base64Result = btoa(String.fromCharCode(...result));
                    setOutputText(base64Result);
                    setInfo('Im Web-App-Standard-Format verschlüsselt');
                }
            } else {
                try {
                    // Base64 decodieren - mit Bereinigung von Zeilenumbrüchen und Whitespace
                    const cleanedInput = cleanAndroidBase64(inputText);
                    // Bereinigen des Passworts/Schlüssels von Whitespace
                    const cleanPassword = cleanAndroidBase64(password);
                    
                    // Verbesserte Base64-Dekodierung mit Fehlerbehandlung
                    let bytes;
                    try {
                        const binaryString = atob(cleanedInput);
                        bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        
                        console.log('Base64-Dekodierung erfolgreich. Ergebnis-Länge:', bytes.length);
                    } catch (e) {
                        console.error('Base64-Dekodierungsfehler:', e);
                        throw new Error('Der Text ist kein gültiger Base64-String. Bitte überprüfe, ob der verschlüsselte Text vollständig kopiert wurde.');
                    }
                    
                    // Minimales Validieren des dekodierten Inhalts, aber nicht zu streng für Android-Kompatibilität
                    if (!bytes) {
                        console.error('Ungültiger Inhalt nach Base64-Dekodierung: undefined');
                        throw new Error('Der dekodierte Inhalt ist ungültig nach Base64-Dekodierung.');
                    }
                    
                    console.log('Dekodierte Daten-Länge:', bytes.length, 'Bytes');
                    
                    // Warnung aber kein Fehler für kleine Datenpakete, da wir dennoch versuchen zu entschlüsseln
                    if (bytes.length < 16) { // Mindestens IV sollte vorhanden sein
                        console.warn('Warnung: Dekodierte Daten sind sehr kurz:', bytes.length, 'Bytes');
                        console.warn('Dies könnte zu Entschlüsselungsfehlern führen, aber wir versuchen es trotzdem.');
                    }

                    // Prüfen, ob es sich um das Android-Format mit Salt handelt
                    // Android: [Salt(16) + IV(12) + Data], Web: [IV(12) + Data]
                    let iv, encryptedData, hasAndroidFormat = false;
                    
                    // Format-Erkennung für Android/Web-Format
                    
                    // Immer beide Formate als möglich betrachten - keine Prüfung der Länge mehr
                    let androidFormatPossible = true;
                    let webFormatPossible = true;
                    
                    console.log('Entschlüsselung gestartet. Daten-Länge:', bytes.length, 'Byte');
                    
                    // Bei Android-Verschlüsselung müsste die Länge mindestens 16 (Salt) + 12 (IV) + 16 (GCM-Tag) sein
                    if (bytes.length < (16 + 12 + 16)) {
                        console.log('Daten könnten zu kurz für Android-Format sein (' + bytes.length + ' Bytes), aber wir versuchen trotzdem beide Formate');
                    }
                    
                    // IVs und Daten für beide Formate vorbereiten
                    // Web-Format: [IV(12) + Data]
                    // Für Debugging-Zwecke die Byte-Längen ausgeben
                    console.log('Byte-Längen:', {
                        total: bytes.length,
                        ivLength: AES_GCM_IV_LENGTH,
                        dataLength: bytes.length - AES_GCM_IV_LENGTH
                    });
                    
                    if (bytes.length <= AES_GCM_IV_LENGTH) {
                        throw new Error('Ungültiges Format: Die Daten sind zu kurz, um IV und Ciphertext zu enthalten.');
                    }
                    
                    iv = bytes.slice(0, AES_GCM_IV_LENGTH);
                    encryptedData = bytes.slice(AES_GCM_IV_LENGTH);

                    // Versuche automatisch verschiedene Schlüsselgrößen, wenn der Schlüssel aus Android stammen könnte
                    const possibleKeySizes = [keySize]; // Zuerst die ausgewählte Größe versuchen

                    // Wenn es sich um einen externen Schlüssel handeln könnte, füge alternative Größen hinzu
                    if (useExternalKey || password.length !== keySize / 4) {
                        // Automatisch erkannte Größe hinzufügen (falls sie sich von der ausgewählten unterscheidet)
                        const detectedSize = detectKeySize(password);
                        if (detectedSize !== keySize && !possibleKeySizes.includes(detectedSize)) {
                            possibleKeySizes.push(detectedSize);
                        }

                        // Füge andere Standardgrößen hinzu, die noch nicht in der Liste sind
                        // Wichtig: 256 zuerst prüfen, da Android standardmäßig 256 für Passwort-Hash verwendet
                        [256, 192, 128].forEach(size => {
                            if (!possibleKeySizes.includes(size)) {
                                possibleKeySizes.push(size);
                            }
                        });
                    }

                    // Versuche nacheinander verschiedene Schlüsselgrößen
                    let decryptedText = null;
                    let lastError = null;

                    for (const size of possibleKeySizes) {
                        try {
                            // Der gleiche Hash-Ansatz wie in der Android-App für volle Kompatibilität
                            // Wichtig: Wir verwenden exakt die gleiche Methode wie in der Android-App
                            let passwordBufferForSize;
                            
                            // Prüfen ob es ein Base64-Key ist - wie in Android-App
                            if (/^[A-Za-z0-9+/=]+$/.test(cleanPassword.trim()) && cleanPassword.trim().length >= 24) {
                                try {
                                    // Als Base64-Schlüssel versuchen
                                    console.log('Versuche Schlüssel als Base64 zu interpretieren');
                                    const rawKey = atob(cleanPassword.trim());
                                    const bytes = new Uint8Array(rawKey.length);
                                    for (let i = 0; i < rawKey.length; i++) {
                                        bytes[i] = rawKey.charCodeAt(i);
                                    }
                                    passwordBufferForSize = bytes.buffer;
                                } catch (e) {
                                    console.log('Base64-Interpretation fehlgeschlagen, verwende SHA-256');
                                    // Fallback auf SHA-256
                                    passwordBufferForSize = await crypto.subtle.digest(
                                        'SHA-256',
                                        new TextEncoder().encode(cleanPassword)
                                    );
                                }
                            } else {
                                // Standard-Passwort-Hashing mit SHA-256
                                passwordBufferForSize = await crypto.subtle.digest(
                                    'SHA-256',
                                    new TextEncoder().encode(cleanPassword)
                                );
                            }
                            
                            // Schlüssel aus Passwort ableiten
                            // WebCrypto API unterstützt nur 128 und 256 Bit
                            // Wir verwenden immer 256 Bit für maximale Kompatibilität
                            console.log(`Ursprüngliche Schlüsselgröße: ${size} Bit`);
                            const keyImportSize = 256; // Standard ist 256 Bit
                            
                            // Verwende IMMER SHA-256 für den Schlüssel um exakt 32 Bytes (256 Bits) zu haben
                            let effectiveBuffer;
                            try {
                                // SHA-256 erzeugt immer genau 32 Bytes (256 Bits)
                                effectiveBuffer = await crypto.subtle.digest(
                                    'SHA-256',
                                    new TextEncoder().encode(cleanPassword)
                                );
                                
                                console.log(`Schlüssel mit SHA-256 erzeugt: ${effectiveBuffer.byteLength * 8} Bits`);
                            } catch (e) {
                                console.error('Fehler bei Schlüsselerzeugung:', e);
                                throw new Error('Fehler bei der Schlüsselerzeugung: ' + e.message);
                            }
                            
                            let key;
                            try {
                                key = await crypto.subtle.importKey(
                                    'raw',
                                    effectiveBuffer,
                                    {name: 'AES-GCM', length: keyImportSize},
                                    false,
                                    ['decrypt']
                                );
                                console.log('Schlüssel erfolgreich importiert');
                            } catch (e) {
                                console.error('Fehler beim Schlüsselimport:', e);
                                console.error('Buffer-Länge:', effectiveBuffer.byteLength, 'Bytes');
                                throw new Error('Fehler beim Schlüsselimport: ' + e.message);
                            }

                            // Mit beiden Formaten versuchen: 1) Android-Format (Salt + IV) und 2) Web-Standard (nur IV)
                            let decryptedBuffer;
                            
                            // Versuche mehrere Entschlüsselungsformate, um die Kompatibilität zu maximieren
                            let formatErrors = [];
                            
                            // 1. Versuche zuerst das Android-Format (Salt + IV) - Umkehrung der Reihenfolge für bessere Kompatibilität
                            if (androidFormatPossible) {
                                try {
                                    // Prüfen, ob genug Daten für Android-Format vorhanden sind
                                    if (bytes.length < 16 + AES_GCM_IV_LENGTH + 16) { // Salt + IV + mindestens 16 Bytes Daten mit Tag
                                        console.warn('Daten zu kurz für Android-Format:', bytes.length, 'Bytes');
                                        console.warn('Mindestlänge für Android-Format:', 16 + AES_GCM_IV_LENGTH + 16, 'Bytes');
                                        throw new Error('Daten zu kurz für Android-Format');
                                    }
                                    
                                    // Android: [Salt(16) + IV(12) + Data]
                                    const salt = bytes.slice(0, 16);
                                    const androidIv = bytes.slice(16, 16 + AES_GCM_IV_LENGTH);
                                    const androidEncryptedData = bytes.slice(16 + AES_GCM_IV_LENGTH);
                                    
                                    console.log('Versuche Android-Format mit Salt als AAD', {
                                        saltLength: salt.length,
                                        ivLength: androidIv.length,
                                        dataLength: androidEncryptedData.length,
                                        totalLength: bytes.length
                                    });
                                    
                                    // Debug-Visualisierung der ersten Bytes
                                    console.log('Salt-Bytes (erste 4):', Array.from(salt.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));
                                    console.log('IV-Bytes (erste 4):', Array.from(androidIv.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));
                                    console.log('Ciphertext-Bytes (erste 4):', Array.from(androidEncryptedData.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));
                                    
                                    // Als AAD für GCM hinzufügen
                                    decryptedBuffer = await crypto.subtle.decrypt(
                                        {
                                            name: 'AES-GCM', 
                                            iv: androidIv,
                                            additionalData: salt // Salt als AAD hinzufügen
                                        },
                                        key,
                                        androidEncryptedData
                                    );
                                    hasAndroidFormat = true;
                                    console.log('Android-Format Entschlüsselung erfolgreich');
                                } catch (androidFormatError) {
                                    console.log('Android-Format Entschlüsselung fehlgeschlagen:', androidFormatError.message);
                                    
                                    // Versuche Android-Format OHNE AAD (für ältere Android-Versionen)
                                    try {
                                        // Prüfen, ob genug Daten für Android-Format vorhanden sind
                                        if (bytes.length < 16 + AES_GCM_IV_LENGTH + 16) { // Salt + IV + mindestens 16 Bytes Daten mit Tag
                                            console.warn('Daten zu kurz für Android-Format ohne AAD:', bytes.length, 'Bytes');
                                            throw new Error('Daten zu kurz für Android-Format ohne AAD');
                                        }
                                        
                                        const salt = bytes.slice(0, 16);
                                        const androidIv = bytes.slice(16, 16 + AES_GCM_IV_LENGTH);
                                        const androidEncryptedData = bytes.slice(16 + AES_GCM_IV_LENGTH);
                                        
                                        console.log('Versuche Android-Format OHNE Salt als AAD');
                                        
                                        // Ohne additionalData probieren
                                        decryptedBuffer = await crypto.subtle.decrypt(
                                            {
                                                name: 'AES-GCM', 
                                                iv: androidIv
                                                // Kein additionalData
                                            },
                                            key,
                                            androidEncryptedData
                                        );
                                        hasAndroidFormat = true;
                                        console.log('Android-Format OHNE AAD Entschlüsselung erfolgreich');
                                    } catch (noAadError) {
                                        console.log('Android-Format OHNE AAD fehlgeschlagen:', noAadError.message);
                                        formatErrors.push(`Android-Format mit AAD: ${androidFormatError.message}, ohne AAD: ${noAadError.message}`);
                                    }
                                }
                            }
                            
                            // 2. Versuche das Web-Format (nur IV) falls Android-Format fehlgeschlagen oder noch kein Erfolg
                            if (!decryptedBuffer && webFormatPossible) {
                                try {
                                    console.log('Versuche Web-Format ohne Salt', {
                                        ivLength: iv.length,
                                        dataLength: encryptedData.length,
                                        totalLength: bytes.length,
                                        keySize: size
                                    });
                                    
                                    // Sicherheitscheck für IV und Daten
                                    if (iv.length !== AES_GCM_IV_LENGTH) {
                                        console.error('Ungültige IV-Länge für Web-Format:', iv.length);
                                        throw new Error('Ungültige IV-Länge für Web-Format');
                                    }
                                    
                                    if (encryptedData.length < 16) { // Mindestens ein AES-Block + Tag
                                        console.error('Daten zu kurz für Web-Format:', encryptedData.length);
                                        throw new Error('Daten zu kurz für Web-Format');
                                    }
                                    
                                    // Extra Debug-Info für Browser-zu-Browser Format
                                    console.log('IV-Bytes (erste 4):', Array.from(iv.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));
                                    console.log('Ciphertext-Bytes (erste 4):', Array.from(encryptedData.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));
                                    
                                    // Prüfe Base64-Konsistenz für Debugging
                                    const reencoded = btoa(String.fromCharCode(...iv, ...encryptedData));
                                    console.log('Base64-Konsistenzcheck:', {
                                        originalLength: cleanedInput.length,
                                        reencodedLength: reencoded.length,
                                        consistent: cleanedInput.length === reencoded.length
                                    });
                                    
                                    decryptedBuffer = await crypto.subtle.decrypt(
                                        {name: 'AES-GCM', iv},
                                        key,
                                        encryptedData
                                    );
                                    // Wenn erfolgreich, beende die Formatschleifen
                                    console.log('Web-Format Entschlüsselung erfolgreich');
                                } catch (webFormatError) {
                                    console.error('Web-Format fehlgeschlagen:', webFormatError.message);
                                    console.error('Das könnte bedeuten, dass der Schlüssel falsch ist oder das Format nicht unterstützt wird.');
                                    
                                    // Wenn es ein "operation does not meet requirements" Fehler ist, zeige spezifische Hilfe
                                    if (webFormatError.message.includes('operation does not meet requirements')) {
                                        console.error('--> Dies ist ein typischer Fehler bei Browser-zu-Browser Entschlüsselung wenn:');
                                        console.error('    1. Der Text nicht vollständig kopiert wurde');
                                        console.error('    2. Der Browser ein veraltetes Cache verwendet - versuche die Seite neu zu laden');
                                        console.error('    3. Ein Browser-Erweiterung den Text verändert hat');
                                    }
                                    
                                    formatErrors.push(`Web-Format: ${webFormatError.message}`);
                                }
                            }
                            
                            // 3. Wenn keine der Methoden funktioniert hat, wirf einen Fehler
                            if (!decryptedBuffer) {
                                throw new Error(`Entschlüsselung fehlgeschlagen: ${formatErrors.join(', ')}`);
                            }

                            // Als Text ausgeben
                            decryptedText = new TextDecoder().decode(decryptedBuffer);

                            // Wenn die Entschlüsselung erfolgreich war, aktualisiere die Schlüsselgröße
                            if (size !== keySize) {
                                setKeySize(size);
                                setInfo(`Entschlüsselung mit ${size} Bit erfolgreich (Schlüsselgröße angepasst)`);
                                setTimeout(() => setInfo(''), 3000);
                            }
                            
                            if (hasAndroidFormat) {
                                setInfo(`Entschlüsselung mit ${size} Bit erfolgreich (Android-App-Format mit Salt erkannt)`);
                                setTimeout(() => setInfo(''), 5000);
                            }

                            break; // Wenn erfolgreich, beende die Schleife
                        } catch (e) {
                            lastError = e;
                            console.log(`Entschlüsselung mit ${size} Bit fehlgeschlagen, versuche andere Größen...`);
                        }
                    }

                    if (decryptedText) {
                        setOutputText(decryptedText);
                    } else {
                        throw lastError || new Error('Entschlüsselung fehlgeschlagen mit allen Schlüsselgrößen');
                    }
                } catch (error) {
                    // Verbesserte Fehlermeldung mit spezifischen Hinweisen je nach Fehlertyp
                    if (error.message && error.message.includes('provided data is too small')) {
                        setError('Die Daten aus der Android-App sind zu klein für die Entschlüsselung. ' +
                                'Wichtig für Android→Web Kompatibilität: ' +
                                'Verwenden Sie in der Android-App die Methode encryptWebAppCompatible() ' +
                                'oder wählen Sie in der App "Web-App Kompatibel" in den Einstellungen. ' +
                                'Normale Android-Verschlüsselung verwendet ein anderes Format als die Web-App.');
                        
                        console.error('Android→Web Kompatibilitätsproblem erkannt:');
                        console.error('Die Daten aus der Android-App haben nicht das richtige Format für die Web-App.');
                        console.error('Lösung: In der Android-App muss encryptWebAppCompatible() verwendet werden.');
                    } else if (error.message && error.message.includes('BAD_DECRYPT')) {
                        setError('Entschlüsselung fehlgeschlagen: BAD_DECRYPT-Fehler. Möglicherweise wurde der Text mit einer anderen Version verschlüsselt. ' +
                                'Verwenden Sie in der Android-App die "encryptWebAppCompatible"-Methode für die Verschlüsselung oder aktivieren Sie hier das "Android-Kompatibilitätsmodus"-Checkbox. ' +
                                'Siehe die Kompatibilitätsanleitung für weitere Details.');
                    } else if (error.message && error.message.includes('operation does not meet requirements')) {
                        setError('Browser-zu-Browser Entschlüsselung fehlgeschlagen: Die Daten entsprechen nicht den erwarteten Anforderungen. ' +
                                'Dies kann passieren, wenn der verschlüsselte Text nicht vollständig kopiert wurde oder das Format beschädigt ist. ' +
                                'Versuche die Verschlüsselung erneut und achte darauf, den gesamten verschlüsselten Text zu kopieren.');
                                
                        // Detaillierte Fehleranalyse im Konsolenfenster ausgeben
                        console.error('Detaillierte Fehleranalyse für "operation does not meet requirements":');
                        console.error('- Fehlertyp: Browser-zu-Browser Verschlüsselung');
                        console.error('- Mögliche Ursachen:');
                        console.error('  1. Verschlüsselter Text wurde nicht vollständig kopiert');
                        console.error('  2. IV + Ciphertext Struktur ist beschädigt');
                        console.error('  3. Ein falsches Passwort/Schlüssel wurde verwendet');
                        console.error('  4. Browser-Cache enthält veraltete Seite - versuche Seite neu zu laden');
                    } else {
                        setError(`Entschlüsselung fehlgeschlagen. Überprüfe den Text und das Passwort. Fehler: ${error.message}`);
                    }
                    console.error('Detaillierter Fehler bei der Entschlüsselung:', error);
                }
            }
        } catch (error) {
            setError(`Fehler: ${error.message}`);
            console.error(error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">AES Verschlüsselung
                    mit IV</h3>

                <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        AES (Advanced Encryption Standard) ist ein symmetrischer
                        Verschlüsselungsalgorithmus,
                        der weltweit für sichere Kommunikation verwendet wird. Diese Implementierung
                        nutzt AES-GCM mit IV
                        (Initialization Vector) für zusätzliche Sicherheit.
                    </p>
                </div>

                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => setMode('encrypt')}
                        className={`px-4 py-2 rounded-md ${mode === 'encrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
                    >
                        Verschlüsseln
                    </button>
                    <button
                        onClick={() => setMode('decrypt')}
                        className={`px-4 py-2 rounded-md ${mode === 'decrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
                    >
                        Entschlüsseln
                    </button>
                </div>
                
                {mode === 'encrypt' && (
                    <div className="flex items-center mb-4 p-2 border rounded dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20">
                        <input
                            type="checkbox"
                            id="useAndroidFormat"
                            className="mr-2"
                        />
                        <label htmlFor="useAndroidFormat" className="text-sm text-amber-800 dark:text-amber-300">
                            Android-Kompatibilitätsmodus (mit Salt) verwenden
                            <span className="text-xs ml-2 opacity-75">(für Kompatibilität mit älteren Verschlüsselungen aus der Android-App)</span>
                        </label>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2 font-medium dark:text-gray-200">
                            {mode === 'encrypt' ? 'Zu verschlüsselnder Text' : 'Zu entschlüsselnder Text (Base64)'}
                        </label>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            placeholder={mode === 'encrypt' ? 'Text eingeben...' : 'Verschlüsselten Text eingeben...'}
                        />
                    </div>

                    <div>
                        <label
                            className="block mb-2 font-medium dark:text-gray-200">Ergebnis</label>
                        <div className="relative">
              <textarea
                  value={outputText}
                  readOnly
                  className="w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
                            {outputText && (
                                <div className="absolute top-2 right-2 flex space-x-1"> 
                                    <button
                                        onClick={() => copyToClipboard(outputText)}
                                        className="p-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40 flex items-center gap-1"
                                        title="Verschlüsselten Text kopieren"
                                    >
                                        <Copy size={14} />
                                        <span className="text-xs">Text</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Ergebnisknopf (Anzeigen nach erfolgreicher Ver-/Entschlüsselung) */}
                        {outputText && (
                            <div className="mt-2 flex justify-end">
                                <button 
                                    onClick={() => copyToClipboard(outputText)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
                                >
                                    <Copy size={16} className="mr-1" />
                                    Ergebnis kopieren
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="font-medium dark:text-gray-200">Passwort / Schlüssel</label>
                        <button
                            onClick={() => setUseExternalKey(!useExternalKey)}
                            className="text-blue-600 dark:text-blue-400 text-sm flex items-center"
                        >
                            {useExternalKey ? 'Eigenen Schlüssel eingeben' : 'Fremden Schlüssel importieren'}
                        </button>
                    </div>

                    {!useExternalKey ? (
                        // Standard-Eingabe für eigene Schlüssel
                        <>
                            <div className="flex">
                                <div className="relative flex-1">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-3 pr-20 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                        placeholder="Passwort oder Hex-Schlüssel eingeben..."
                                    />
                                    <div className="absolute top-1/2 right-3 transform -translate-y-1/2 flex items-center space-x-2">
                                        {password && (
                                            <button
                                                onClick={() => copyToClipboard(password)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                                                title="Schlüssel kopieren"
                                            >
                                                <Copy size={16}/>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-gray-500 dark:text-gray-300"
                                        >
                                            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={generateKey}
                                    className="ml-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center dark:text-gray-200"
                                    title="Zufälligen Schlüssel generieren"
                                >
                                    <RefreshCw size={18}/>
                                </button>
                            </div>

                            <div className="mt-2 flex items-center">
                                <span className="mr-2 text-sm dark:text-gray-300">Schlüsselgröße:</span>
                                <select
                                    value={keySize}
                                    onChange={(e) => setKeySize(Number(e.target.value))}
                                    className="p-1 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                >
                                    <option value={128}>128 Bit</option>
                                    <option value={192}>192 Bit</option>
                                    <option value={256}>256 Bit</option>
                                </select>
                            </div>
                        </>
                    ) : (
                        // Eingabe für fremde Schlüssel mit automatischer Größenerkennung
                        <div className="border p-3 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                Importiere einen externen AES-Schlüssel (Hex oder Base64). Die Schlüsselgröße wird automatisch erkannt.
                            </p>

                            <div className="relative">
                                <textarea
                                    value={externalKeyText}
                                    onChange={(e) => {
                                        const text = e.target.value;
                                        setExternalKeyText(text);
                                        setPassword(text);

                                        // Automatisch Größe erkennen
                                        if (text.trim()) {
                                            const detectedSize = detectKeySize(text);
                                            setDetectedKeySize(detectedSize);
                                            setKeySize(detectedSize);
                                        } else {
                                            setDetectedKeySize(null);
                                        }
                                    }}
                                    rows={3}
                                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-600 dark:border-gray-600 dark:text-gray-100 text-xs font-mono"
                                    placeholder="Extern generierten AES-Schlüssel (Hex oder Base64) einfügen..."
                                />
                                {externalKeyText && (
                                    <button
                                        onClick={() => copyToClipboard(externalKeyText)}
                                        className="absolute top-2 right-2 p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40 flex items-center gap-1"
                                        title="Schlüssel kopieren"
                                    >
                                        <Copy size={14} />
                                        <span className="text-xs">Kopieren</span>
                                    </button>
                                )}
                            </div>

                            {detectedKeySize && (
                                <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                                    ✓ Erkannte Schlüsselgröße: <strong>{detectedKeySize} Bit</strong>
                                </div>
                            )}

                            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                                Hinweis: Bei der Entschlüsselung werden automatisch verschiedene Schlüsselgrößen probiert,
                                falls die Entschlüsselung mit der erkannten Größe fehlschlägt.
                            </div>
                            
                            <div className="mt-3 flex items-center p-2 border rounded dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                                <input
                                    type="checkbox"
                                    id="useAndroidFormatExternal"
                                    className="mr-2"
                                    onChange={(e) => {
                                        // Synchronisiere beide Checkboxen
                                        if (document.getElementById('useAndroidFormat')) {
                                            document.getElementById('useAndroidFormat').checked = e.target.checked;
                                        }
                                    }}
                                />
                                <label htmlFor="useAndroidFormatExternal" className="text-sm text-blue-800 dark:text-blue-300">
                                    Mit Android-Kompatibilitätsmodus verschlüsseln
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div
                        className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                        {error}
                    </div>
                )}

                {info && (
                    <div
                        className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                        {info}
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-2">
                    {mode === 'encrypt' && password && (
                        <button
                            onClick={() => copyToClipboard(password)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md flex items-center"
                        >
                            <Copy size={16} className="mr-2" />
                            Schlüssel kopieren
                        </button>
                    )}
                    <button
                        onClick={processText}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                        {mode === 'encrypt' ? 'Verschlüsseln' : 'Entschlüsseln'}
                    </button>
                </div>
            </div>

            {/* Gespeicherte Schlüssel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold dark:text-gray-100">Gespeicherte
                        Schlüssel</h3>

                    {/* Export Buttons */}
                    <div className="flex space-x-2">
                        <button
                            onClick={exportAllKeys}
                            disabled={savedKeys.length === 0}
                            className={`px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center text-sm ${savedKeys.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Save size={16} className="mr-1"/>
                            Alle exportieren
                        </button>
                        <button
                            onClick={() => importFileRef.current.click()}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center text-sm"
                        >
                            <Upload size={16} className="mr-1"/>
                            Importieren
                        </button>
                        <input
                            type="file"
                            ref={importFileRef}
                            onChange={handleFileUpload}
                            accept=".json"
                            style={{display: 'none'}}
                        />
                    </div>
                </div>

                <div className="flex mb-4">
                    <input
                        type="text"
                        value={keyName}
                        onChange={(e) => setKeyName(e.target.value)}
                        className="flex-1 p-2 border rounded-l-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        placeholder="Schlüsselname"
                    />
                    <button
                        onClick={saveKey}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md"
                    >
                        Aktuellen Schlüssel speichern
                    </button>
                </div>

                {savedKeys.length > 0 ? (
                    <div
                        className="border rounded-md divide-y dark:divide-gray-700 dark:border-gray-600">
                        {savedKeys.map(key => (
                            <div key={key.id} className="p-3 flex items-center justify-between">
                                <div>
                                    <p className="font-medium dark:text-gray-100">{key.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {key.keySize} Bit • Erstellt
                                        am {new Date(key.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <button
                                        onClick={() => loadKey(key)}
                                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-md mr-2 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        Laden
                                    </button>
                                    {/*<button*/}
                                    {/*    onClick={() => exportKey(key)}*/}
                                    {/*    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-md mr-2 hover:bg-gray-300 dark:hover:bg-gray-600"*/}
                                    {/*>*/}
                                    {/*    Exportieren*/}
                                    {/*</button>*/}
                                    <button
                                        onClick={() => deleteKey(key.id)}
                                        className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md"
                                    >
                                        Löschen
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        Keine gespeicherten Schlüssel vorhanden
                    </p>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Hinweise zur
                    AES-Verschlüsselung</h3>

                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                    <li>• <strong className="dark:text-white">AES-GCM</strong> ist ein moderner,
                        sicherer Verschlüsselungsalgorithmus mit Authentifizierung, der
                        einen <strong className="dark:text-white">Initialization Vector
                            (IV)</strong> verwendet, um die Einzigartigkeit jeder Verschlüsselung zu
                        gewährleisten.
                    </li>
                    <li>• Längere Schlüssel (192, 256 Bit) bieten mehr Sicherheit, können aber mehr
                        Rechenleistung erfordern. 256 Bit gilt als zukunftssicher.
                    </li>
                    <li>• Der Initialization Vector wird automatisch bei jeder Verschlüsselung
                        erzeugt und im verschlüsselten Text gespeichert, daher ist er nicht separat
                        zu speichern.
                    </li>
                    <li>• Es gibt keine Möglichkeit, ein verlorenes Passwort oder einen verlorenen
                        Schlüssel wiederherzustellen. Bewahre deine Schlüssel sicher auf!
                    </li>
                    <li>• Für maximale Sicherheit solltest du zufällig generierte Schlüssel statt
                        einfacher Passwörter verwenden, da diese resistenter gegen Wörterbuch- und
                        Brute-Force-Angriffe sind.
                    </li>
                    <li>• Der verschlüsselte Text ist Base64-kodiert und kann sicher in E-Mails,
                        Datenbanken oder Textdateien gespeichert werden.
                    </li>
                </ul>
            </div>

        </div>
    );
}