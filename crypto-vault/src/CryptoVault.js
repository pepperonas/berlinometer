import React, { useState, useEffect, useRef } from 'react';
import { Lock, Key, Shield, Menu, X, Save, ChevronRight, Upload, File, RefreshCw } from 'lucide-react';

// Crypto-Algorithmen
import { AESEncryption } from './crypto/AES';
import { RSAEncryption } from './crypto/RSA';
import { CaesarCipher } from './crypto/Caesar';
// FileEncryption-Komponente einbinden
import { FileEncryption } from './crypto/FileEncryption';

const algorithms = [
  {
    id: 'aes',
    name: 'AES',
    description: 'Advanced Encryption Standard mit IV',
    icon: <Shield size={20} />,
    component: AESEncryption
  },
  {
    id: 'rsa',
    name: 'RSA',
    description: 'Asymmetrische Verschlüsselung',
    icon: <Key size={20} />,
    component: RSAEncryption
  },
  {
    id: 'caesar',
    name: 'Caesar',
    description: 'Einfache Verschiebungs-Chiffre',
    icon: <Lock size={20} />,
    component: CaesarCipher
  },
  {
    id: 'files',
    name: 'Dateien',
    description: 'Dateiverschlüsselung mit AES',
    icon: <File size={20} />,
    component: FileEncryption
  }
];

export default function CryptoVault() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('aes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const importFileRef = useRef(null);

  // Neue State-Variablen für den Passwortschutz beim Export
  const [showExportPasswordModal, setShowExportPasswordModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [confirmExportPassword, setConfirmExportPassword] = useState('');
  const [isProtectedExport, setIsProtectedExport] = useState(false);
  const [exportInProgress, setExportInProgress] = useState(false);

  // Zustände für die Entschlüsselungsabfrage
  const [showDecryptionModal, setShowDecryptionModal] = useState(false);
  const [decryptionPassword, setDecryptionPassword] = useState('');
  const [encryptedImportData, setEncryptedImportData] = useState(null);

  // Finde den aktuell ausgewählten Algorithmus
  const currentAlgorithm = algorithms.find(algo => algo.id === selectedAlgorithm);

  // Dynamisches Laden der Komponente basierend auf der Auswahl
  const AlgorithmComponent = currentAlgorithm?.component || (() => <div>Algorithmus nicht gefunden</div>);

  // Export aller Schlüssel
  const exportAllKeys = () => {
    try {
      // AES-Schlüssel laden
      const aesKeys = JSON.parse(localStorage.getItem('aesKeys') || '[]');

      // RSA-Schlüsselpaare laden
      const rsaKeys = JSON.parse(localStorage.getItem('rsaKeyPairs') || '[]');

      // Prüfen, ob Schlüssel vorhanden sind
      if (aesKeys.length === 0 && rsaKeys.length === 0) {
        setError('Keine Schlüssel zum Exportieren vorhanden');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Prüfen ob unverschlüsselte private RSA-Schlüssel enthalten sind
      const hasUnencryptedPrivateKeys = rsaKeys.some(key =>
          key.privateKey && !key.isEncrypted
      );

      if (hasUnencryptedPrivateKeys) {
        // Dialog zum Verschlüsseln des Exports anzeigen
        setShowExportPasswordModal(true);
      } else {
        // Direkt exportieren ohne Passwortschutz
        proceedWithExport(false);
      }
    } catch (err) {
      setError(`Fehler beim Exportieren der Schlüssel: ${err.message}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Neue Funktionen für den Export mit Passwortschutz
  const proceedWithExport = async (usePassword = false) => {
    setExportInProgress(true);
    try {
      // AES-Schlüssel laden
      const aesKeys = JSON.parse(localStorage.getItem('aesKeys') || '[]');

      // RSA-Schlüsselpaare laden
      const rsaKeys = JSON.parse(localStorage.getItem('rsaKeyPairs') || '[]');

      // Daten für den Export vorbereiten
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        aesKeys,
        rsaKeys,
        isEncrypted: usePassword
      };

      let dataToExport;

      if (usePassword) {
        // Daten mit Passwort verschlüsseln
        try {
          dataToExport = await encryptExportData(JSON.stringify(exportData), exportPassword);
        } catch (err) {
          setError(`Fehler bei der Verschlüsselung: ${err.message}`);
          setExportInProgress(false);
          return;
        }
      } else {
        // Unverschlüsselte Daten
        dataToExport = JSON.stringify(exportData, null, 2);
      }

      // Datei-Endung basierend auf Verschlüsselung
      const fileExtension = usePassword ? '.enc.json' : '.json';

      // Blob erstellen und herunterladen
      const blob = new Blob([dataToExport], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `cryptovault_keys_export${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Modales Fenster schließen und Zustände zurücksetzen
      setShowExportPasswordModal(false);
      setExportPassword('');
      setConfirmExportPassword('');
      setIsProtectedExport(false);

      setInfo(`Schlüssel wurden erfolgreich ${usePassword ? 'verschlüsselt ' : ''}exportiert`);
      setTimeout(() => setInfo(''), 3000);
    } catch (err) {
      setError(`Fehler beim Exportieren der Schlüssel: ${err.message}`);
      setTimeout(() => setError(''), 3000);
    } finally {
      setExportInProgress(false);
    }
  };

  // Funktion zum Verschlüsseln der Exportdaten
  const encryptExportData = async (data, password) => {
    try {
      // Password-based key derivation
      const encoder = new TextEncoder();
      const passwordKey = await crypto.subtle.importKey(
          'raw',
          encoder.encode(password),
          { name: 'PBKDF2' },
          false,
          ['deriveBits', 'deriveKey']
      );

      // Salz generieren
      const salt = crypto.getRandomValues(new Uint8Array(16));

      // Schlüssel ableiten
      const aesKey = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
          },
          passwordKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt']
      );

      // IV generieren
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Daten verschlüsseln
      const encryptedData = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          aesKey,
          encoder.encode(data)
      );

      // Ergebnis zusammenführen (Format: {version, salt, iv, data})
      const encryptedArray = new Uint8Array(encryptedData);

      // Wir erstellen ein Objekt zur besseren Lesbarkeit und Erweiterbarkeit
      const result = {
        version: 1,
        salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
        data: Array.from(new Uint8Array(encryptedData)).map(b => b.toString(16).padStart(2, '0')).join('')
      };

      return JSON.stringify(result);
    } catch (error) {
      console.error('Fehler beim Verschlüsseln:', error);
      throw error;
    }
  };

  // Die Import-Funktion muss ebenfalls angepasst werden
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        let importedData;

        try {
          // Versuchen, die Datei als JSON zu parsen
          importedData = JSON.parse(content);

          // Prüfen, ob es sich um eine verschlüsselte Datei handelt
          if (importedData.version && importedData.salt && importedData.iv && importedData.data) {
            // Wir haben eine verschlüsselte Datei - Passwort abfragen
            promptDecryptionPassword(importedData);
            return;
          }

        } catch (parseError) {
          // Wenn das Parsen fehlschlägt, ist es wahrscheinlich keine gültige JSON-Datei
          setError('Ungültiges Dateiformat. Die Datei konnte nicht gelesen werden.');
          setTimeout(() => setError(''), 3000);
          event.target.value = null;
          return;
        }

        // Validierung für unverschlüsselte Dateien
        if (!importedData.aesKeys && !importedData.rsaKeys) {
          throw new Error('Ungültiges Dateiformat. Keine Schlüssel gefunden.');
        }

        // Importiere Schlüssel
        importKeys(importedData);

      } catch (err) {
        setError(`Fehler beim Importieren der Schlüssel: ${err.message}`);
        setTimeout(() => setError(''), 3000);
      }

      // Zurücksetzen des Datei-Inputs
      event.target.value = null;
    };

    reader.onerror = () => {
      setError('Fehler beim Lesen der Datei');
      setTimeout(() => setError(''), 3000);
      // Zurücksetzen des Datei-Inputs
      event.target.value = null;
    };

    reader.readAsText(file);
  };

  // Funktion zum Anzeigen des Passwort-Eingabe-Dialogs für verschlüsselte Importe
  const promptDecryptionPassword = (encryptedData) => {
    setEncryptedImportData(encryptedData);
    setShowDecryptionModal(true);
  };

  // Funktion zum Entschlüsseln und Importieren der Daten
  const decryptAndImportData = async () => {
    try {
      if (!encryptedImportData || !decryptionPassword) return;

      // Salt und IV aus Hex-String in Uint8Array umwandeln
      const salt = new Uint8Array(encryptedImportData.salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const iv = new Uint8Array(encryptedImportData.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const encryptedData = new Uint8Array(encryptedImportData.data.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

      // Password-based key derivation
      const encoder = new TextEncoder();
      const passwordKey = await crypto.subtle.importKey(
          'raw',
          encoder.encode(decryptionPassword),
          { name: 'PBKDF2' },
          false,
          ['deriveBits', 'deriveKey']
      );

      // Schlüssel ableiten
      const aesKey = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
          },
          passwordKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
      );

      // Daten entschlüsseln
      const decryptedData = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          aesKey,
          encryptedData
      );

      // Entschlüsselte Daten parsen
      const decryptedObj = JSON.parse(new TextDecoder().decode(decryptedData));

      // Schlüssel importieren
      importKeys(decryptedObj);

      // Dialog schließen und Zustände zurücksetzen
      setShowDecryptionModal(false);
      setDecryptionPassword('');
      setEncryptedImportData(null);

    } catch (error) {
      setError(`Entschlüsselung fehlgeschlagen: ${error.message}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Gemeinsame Funktion für den Import von Schlüsseln
  const importKeys = (importedData) => {
    // AES-Schlüssel importieren, wenn vorhanden
    if (Array.isArray(importedData.aesKeys) && importedData.aesKeys.length > 0) {
      const existingAesKeys = JSON.parse(localStorage.getItem('aesKeys') || '[]');
      const existingIds = new Set(existingAesKeys.map(key => key.id));
      const newAesKeys = importedData.aesKeys.filter(key => !existingIds.has(key.id));

      if (newAesKeys.length > 0) {
        const updatedAesKeys = [...existingAesKeys, ...newAesKeys];
        localStorage.setItem('aesKeys', JSON.stringify(updatedAesKeys));
      }
    }

    // RSA-Schlüssel importieren, wenn vorhanden
    if (Array.isArray(importedData.rsaKeys) && importedData.rsaKeys.length > 0) {
      const existingRsaKeys = JSON.parse(localStorage.getItem('rsaKeyPairs') || '[]');
      const existingIds = new Set(existingRsaKeys.map(key => key.id));
      const newRsaKeys = importedData.rsaKeys.filter(key => !existingIds.has(key.id));

      if (newRsaKeys.length > 0) {
        const updatedRsaKeys = [...existingRsaKeys, ...newRsaKeys];
        localStorage.setItem('rsaKeyPairs', JSON.stringify(updatedRsaKeys));
      }
    }

    setInfo('Schlüssel erfolgreich importiert');
    setTimeout(() => setInfo(''), 3000);
  };

  return (
      <div className={`flex h-screen ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden flex flex-col`} style={{ backgroundColor: '#2C2E3B' }}>
          <div className="p-4 flex items-center justify-between border-b border-gray-700">
            <h1 className="text-xl font-bold text-white flex items-center">
              <Lock size={24} className="mr-2" />
              CryptoVault
            </h1>
            <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-300 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <p className="px-4 text-sm text-gray-300 mb-2">Algorithmen</p>
            {algorithms.map(algo => (
                <button
                    key={algo.id}
                    onClick={() => setSelectedAlgorithm(algo.id)}
                    className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-700 transition-colors ${selectedAlgorithm === algo.id ? 'bg-gray-700' : ''}`}
                >
                  <div className="w-6 mr-3 text-gray-300">
                    {algo.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-100">{algo.name}</p>
                    <p className="text-xs text-gray-300">{algo.description}</p>
                  </div>
                  {selectedAlgorithm === algo.id && (
                      <ChevronRight size={16} className="ml-auto text-gray-300" />
                  )}
                </button>
            ))}
          </div>

          <div className="border-t border-gray-700 p-4 space-y-2">
            <button
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center justify-center"
                onClick={exportAllKeys}
            >
              <Save size={18} className="mr-2" />
              Schlüssel exportieren
            </button>

            <button
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium flex items-center justify-center"
                onClick={() => importFileRef.current.click()}
            >
              <Upload size={18} className="mr-2" />
              Schlüssel importieren
            </button>
            <input
                type="file"
                ref={importFileRef}
                onChange={handleFileUpload}
                accept=".json"
                style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow flex items-center`}>
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className={`mr-4 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Menu size={24} />
                </button>
            )}
            <h2 className="text-xl font-semibold">{currentAlgorithm?.name || 'Verschlüsselung'}</h2>

            <div className="ml-auto">
              <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`px-3 py-1 rounded ${isDarkMode ? 'bg-gray-600 text-gray-100' : 'bg-gray-200 text-gray-700'}`}
              >
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-4">
            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                  {error}
                </div>
            )}

            {info && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                  {info}
                </div>
            )}

            <AlgorithmComponent />
          </main>

          {/* Footer */}
          <footer className={`py-3 px-4 text-center text-sm ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            Build 🔒 by Martin Pfeffer
          </footer>
        </div>

        {/* Passwort-Dialog für Export */}
        {showExportPasswordModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100">Sicherer Export</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Deine Exportdatei enthält unverschlüsselte private Schlüssel. Es wird empfohlen, den Export mit einem Passwort zu schützen.
                </p>

                <div className="mb-2">
                  <div className="flex items-center mb-4">
                    <input
                        type="checkbox"
                        id="protectExport"
                        checked={isProtectedExport}
                        onChange={(e) => setIsProtectedExport(e.target.checked)}
                        className="mr-2"
                    />
                    <label htmlFor="protectExport" className="text-sm font-medium dark:text-gray-200">
                      Export mit Passwort schützen (empfohlen)
                    </label>
                  </div>
                </div>

                {isProtectedExport && (
                    <>
                      <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium dark:text-gray-200">Passwort:</label>
                        <input
                            type="password"
                            value={exportPassword}
                            onChange={(e) => setExportPassword(e.target.value)}
                            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            placeholder="Gib ein sicheres Passwort ein"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium dark:text-gray-200">Passwort bestätigen:</label>
                        <input
                            type="password"
                            value={confirmExportPassword}
                            onChange={(e) => setConfirmExportPassword(e.target.value)}
                            className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                      </div>
                    </>
                )}

                <div className="flex justify-end space-x-2 mt-6">
                  <button
                      onClick={() => {
                        setShowExportPasswordModal(false);
                        setExportPassword('');
                        setConfirmExportPassword('');
                        setIsProtectedExport(false);
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded"
                  >
                    Abbrechen
                  </button>
                  {isProtectedExport ? (
                      <button
                          onClick={() => {
                            if (exportPassword !== confirmExportPassword) {
                              setError('Die Passwörter stimmen nicht überein!');
                              return;
                            }
                            if (exportPassword.length < 8) {
                              setError('Das Passwort sollte mindestens 8 Zeichen lang sein!');
                              return;
                            }
                            proceedWithExport(true);
                          }}
                          disabled={exportInProgress}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
                      >
                        {exportInProgress ? (
                            <>
                              <RefreshCw size={18} className="mr-2 animate-spin" />
                              Exportiere...
                            </>
                        ) : (
                            'Verschlüsselt exportieren'
                        )}
                      </button>
                  ) : (
                      <button
                          onClick={() => proceedWithExport(false)}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
                      >
                        Ungeschützt exportieren
                      </button>
                  )}
                </div>
              </div>
            </div>
        )}

        {/* Passwort-Dialog für Import */}
        {showDecryptionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100">Verschlüsselte Datei entschlüsseln</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Diese Exportdatei ist passwortgeschützt. Bitte gib das Passwort ein, mit dem die Datei verschlüsselt wurde.
                </p>

                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium dark:text-gray-200">Passwort:</label>
                  <input
                      type="password"
                      value={decryptionPassword}
                      onChange={(e) => setDecryptionPassword(e.target.value)}
                      className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button
                      onClick={() => {
                        setShowDecryptionModal(false);
                        setDecryptionPassword('');
                        setEncryptedImportData(null);
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded"
                  >
                    Abbrechen
                  </button>
                  <button
                      onClick={decryptAndImportData}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Entschlüsseln
                  </button>
                </div>
              </div>
            </div>
        )}

      </div>
  );
}