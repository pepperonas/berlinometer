// src/utils/EnergyDataStorage.js - Verbesserte und robustere Datenbank für Energiedaten mit IndexedDB

// Name und Version der Datenbank
const DB_NAME = 'GlitterHueEnergyDB';
const DB_VERSION = 1;

// Namen der Object Stores (Tabellen)
const STORES = {
    LIGHT_DATA: 'lightData',       // Energiedaten pro Lampe
    USAGE_HISTORY: 'usageHistory', // Historische Daten für jede Lampe
    SETTINGS: 'settings',          // Benutzereinstellungen
    DAILY_TOTALS: 'dailyTotals',   // Tägliche Gesamtwerte
    MONTHLY_TOTALS: 'monthlyTotals' // Monatliche Gesamtwerte
};

// Fallback für Browser ohne IndexedDB
const localStorageFallback = {
    data: {},

    // Initialisiert den Speicher
    init() {
        // Lade vorhandene Daten aus dem localStorage
        try {
            const savedData = localStorage.getItem('energy-data');
            if (savedData) {
                this.data = JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Fehler beim Laden der Energiedaten aus dem localStorage:', error);
            this.data = {};
        }

        // Stelle sicher, dass alle Stores existieren
        Object.values(STORES).forEach(store => {
            if (!this.data[store]) {
                this.data[store] = {};
            }
        });

        return Promise.resolve();
    },

    // Speichert Daten im Store
    save(storeName, key, value) {
        if (!this.data[storeName]) {
            this.data[storeName] = {};
        }

        this.data[storeName][key] = value;

        // Speichere im localStorage
        try {
            localStorage.setItem('energy-data', JSON.stringify(this.data));
        } catch (error) {
            console.error('Fehler beim Speichern der Energiedaten im localStorage:', error);
        }

        return Promise.resolve(value);
    },

    // Lädt Daten aus dem Store
    get(storeName, key) {
        if (!this.data[storeName]) {
            return Promise.resolve(null);
        }

        return Promise.resolve(this.data[storeName][key] || null);
    },

    // Lädt alle Daten aus einem Store
    getAll(storeName) {
        if (!this.data[storeName]) {
            return Promise.resolve([]);
        }

        return Promise.resolve(Object.values(this.data[storeName]));
    },

    // Löscht Daten aus dem Store
    delete(storeName, key) {
        if (this.data[storeName] && this.data[storeName][key]) {
            delete this.data[storeName][key];

            // Speichere im localStorage
            try {
                localStorage.setItem('energy-data', JSON.stringify(this.data));
            } catch (error) {
                console.error('Fehler beim Speichern der Energiedaten im localStorage:', error);
            }
        }

        return Promise.resolve();
    },

    // Löscht alle Daten aus einem Store
    clear(storeName) {
        if (this.data[storeName]) {
            this.data[storeName] = {};

            // Speichere im localStorage
            try {
                localStorage.setItem('energy-data', JSON.stringify(this.data));
            } catch (error) {
                console.error('Fehler beim Speichern der Energiedaten im localStorage:', error);
            }
        }

        return Promise.resolve();
    }
};

// Prüft, ob IndexedDB verfügbar ist
const isIndexedDBSupported = () => {
    try {
        return !!window.indexedDB;
    } catch (e) {
        return false;
    }
};

// Storage-Manager für robuste Datenspeicherung
const storageManager = {
    useIndexedDB: isIndexedDBSupported(),
    dbPromise: null,

    // Initialisiert die Speicherung
    init() {
        if (this.useIndexedDB) {
            return this._initIndexedDB();
        } else {
            console.warn('IndexedDB wird nicht unterstützt. Verwende localStorage als Fallback.');
            return localStorageFallback.init();
        }
    },

    // Initialisiert IndexedDB
    _initIndexedDB() {
        if (this.dbPromise) {
            return this.dbPromise;
        }

        this.dbPromise = new Promise((resolve, reject) => {
            try {
                const request = window.indexedDB.open(DB_NAME, DB_VERSION);

                // Wird aufgerufen, wenn die Datenbank neu erstellt oder aktualisiert werden muss
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // Erstelle Object Stores (Tabellen), falls sie noch nicht existieren

                    // Speichert aktuelle Energiedaten pro Lampe
                    if (!db.objectStoreNames.contains(STORES.LIGHT_DATA)) {
                        const lightDataStore = db.createObjectStore(STORES.LIGHT_DATA, { keyPath: 'lightId' });
                        lightDataStore.createIndex('timestamp', 'timestamp', { unique: false });
                    }

                    // Speichert den Verlauf der Energiedaten pro Lampe
                    if (!db.objectStoreNames.contains(STORES.USAGE_HISTORY)) {
                        const historyStore = db.createObjectStore(STORES.USAGE_HISTORY, { keyPath: 'id', autoIncrement: true });
                        historyStore.createIndex('lightId', 'lightId', { unique: false });
                        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                        historyStore.createIndex('lightId_timestamp', ['lightId', 'timestamp'], { unique: false });
                    }

                    // Speichert Benutzereinstellungen
                    if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                    }

                    // Speichert tägliche Gesamtwerte
                    if (!db.objectStoreNames.contains(STORES.DAILY_TOTALS)) {
                        const dailyStore = db.createObjectStore(STORES.DAILY_TOTALS, { keyPath: 'date' });
                        dailyStore.createIndex('month', 'month', { unique: false });
                    }

                    // Speichert monatliche Gesamtwerte
                    if (!db.objectStoreNames.contains(STORES.MONTHLY_TOTALS)) {
                        const monthlyStore = db.createObjectStore(STORES.MONTHLY_TOTALS, { keyPath: 'month' });
                        monthlyStore.createIndex('year', 'year', { unique: false });
                    }
                };

                request.onerror = (event) => {
                    console.error('Fehler beim Öffnen der Datenbank:', event.target.error);
                    this.useIndexedDB = false;
                    resolve(localStorageFallback.init());
                };

                request.onsuccess = (event) => {
                    const db = event.target.result;

                    // Ereignislistener für Fehler
                    db.onerror = (event) => {
                        console.error('Datenbankfehler:', event.target.error);
                    };

                    resolve(db);
                };
            } catch (error) {
                console.error('Fehler bei der Initialisierung von IndexedDB:', error);
                this.useIndexedDB = false;
                resolve(localStorageFallback.init());
            }
        });

        return this.dbPromise;
    },

    // Öffnet eine Transaktion für bestimmte Object Stores
    async openTransaction(storeNames, mode = 'readonly') {
        if (!this.useIndexedDB) {
            return { fallback: true };
        }

        try {
            const db = await this._initIndexedDB();

            // Wenn db nicht eine IndexedDB-Instanz ist (Fallback wurde aktiviert)
            if (!db.transaction) {
                this.useIndexedDB = false;
                return { fallback: true };
            }

            const transaction = db.transaction(storeNames, mode);

            const stores = {};

            if (Array.isArray(storeNames)) {
                storeNames.forEach(name => {
                    stores[name] = transaction.objectStore(name);
                });
            } else {
                stores[storeNames] = transaction.objectStore(storeNames);
            }

            return { stores, transaction, fallback: false };
        } catch (error) {
            console.error('Fehler beim Öffnen der Transaktion:', error);
            this.useIndexedDB = false;
            return { fallback: true };
        }
    }
};

/**
 * Speichert Energiedaten für eine Lampe
 * @param {string} lightId - ID der Lampe
 * @param {Object} data - Zu speichernde Daten
 * @returns {Promise<Object>} - Die gespeicherten Daten
 */
export const saveLightData = async (lightId, data) => {
    try {
        await storageManager.init();

        const lightData = {
            lightId,
            ...data,
            timestamp: data.timestamp || Date.now()
        };

        if (!storageManager.useIndexedDB) {
            return localStorageFallback.save(STORES.LIGHT_DATA, lightId, lightData);
        }

        const { stores, fallback } = await storageManager.openTransaction(STORES.LIGHT_DATA, 'readwrite');

        if (fallback) {
            return localStorageFallback.save(STORES.LIGHT_DATA, lightId, lightData);
        }

        const store = stores[STORES.LIGHT_DATA];

        return new Promise((resolve, reject) => {
            const request = store.put(lightData);

            request.onsuccess = () => resolve(lightData);
            request.onerror = () => {
                console.error('Fehler beim Speichern der Lampendaten:', request.error);
                // Fallback
                localStorageFallback.save(STORES.LIGHT_DATA, lightId, lightData)
                    .then(resolve)
                    .catch(reject);
            };
        });
    } catch (error) {
        console.error('Fehler beim Speichern der Lampendaten:', error);
        return localStorageFallback.save(STORES.LIGHT_DATA, lightId, data);
    }
};

/**
 * Lädt Energiedaten für eine bestimmte Lampe
 * @param {string} lightId - ID der Lampe
 * @returns {Promise<Object>} - Die gespeicherten Daten oder null
 */
export const getLightData = async (lightId) => {
    try {
        await storageManager.init();

        if (!storageManager.useIndexedDB) {
            return localStorageFallback.get(STORES.LIGHT_DATA, lightId);
        }

        const { stores, fallback } = await storageManager.openTransaction(STORES.LIGHT_DATA);

        if (fallback) {
            return localStorageFallback.get(STORES.LIGHT_DATA, lightId);
        }

        const store = stores[STORES.LIGHT_DATA];

        return new Promise((resolve, reject) => {
            const request = store.get(lightId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => {
                console.error('Fehler beim Laden der Lampendaten:', request.error);
                // Fallback
                localStorageFallback.get(STORES.LIGHT_DATA, lightId)
                    .then(resolve)
                    .catch(reject);
            };
        });
    } catch (error) {
        console.error('Fehler beim Laden der Lampendaten:', error);
        return localStorageFallback.get(STORES.LIGHT_DATA, lightId);
    }
};

/**
 * Lädt Energiedaten für alle Lampen
 * @returns {Promise<Array<Object>>} - Liste aller gespeicherten Lampendaten
 */
export const getAllLightData = async () => {
    try {
        await storageManager.init();

        if (!storageManager.useIndexedDB) {
            return localStorageFallback.getAll(STORES.LIGHT_DATA);
        }

        const { stores, fallback } = await storageManager.openTransaction(STORES.LIGHT_DATA);

        if (fallback) {
            return localStorageFallback.getAll(STORES.LIGHT_DATA);
        }

        const store = stores[STORES.LIGHT_DATA];

        return new Promise((resolve, reject) => {
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => {
                console.error('Fehler beim Laden aller Lampendaten:', request.error);
                // Fallback
                localStorageFallback.getAll(STORES.LIGHT_DATA)
                    .then(resolve)
                    .catch(reject);
            };
        });
    } catch (error) {
        console.error('Fehler beim Laden aller Lampendaten:', error);
        return localStorageFallback.getAll(STORES.LIGHT_DATA);
    }
};

/**
 * Fügt einen Eintrag zum Verlauf hinzu
 * @param {Object} historyEntry - Der hinzuzufügende Verlaufseintrag
 * @returns {Promise<number>} - Die ID des gespeicherten Eintrags
 */
export const addToHistory = async (historyEntry) => {
    try {
        await storageManager.init();

        const entry = {
            ...historyEntry,
            timestamp: historyEntry.timestamp || Date.now()
        };

        // Generiere eine ID für den localStorage-Fallback
        const id = `${entry.lightId}_${entry.timestamp}`;

        if (!storageManager.useIndexedDB) {
            return localStorageFallback.save(STORES.USAGE_HISTORY, id, entry);
        }

        const { stores, fallback } = await storageManager.openTransaction(STORES.USAGE_HISTORY, 'readwrite');

        if (fallback) {
            return localStorageFallback.save(STORES.USAGE_HISTORY, id, entry);
        }

        const store = stores[STORES.USAGE_HISTORY];

        return new Promise((resolve, reject) => {
            const request = store.add(entry);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                console.error('Fehler beim Hinzufügen zum Verlauf:', request.error);
                // Fallback
                localStorageFallback.save(STORES.USAGE_HISTORY, id, entry)
                    .then(resolve)
                    .catch(reject);
            };
        });
    } catch (error) {
        console.error('Fehler beim Hinzufügen zum Verlauf:', error);
        const id = `${historyEntry.lightId}_${historyEntry.timestamp || Date.now()}`;
        return localStorageFallback.save(STORES.USAGE_HISTORY, id, historyEntry);
    }
};

/**
 * Lädt den Verlauf für eine bestimmte Lampe
 * @param {string} lightId - ID der Lampe
 * @param {Object} options - Zusätzliche Optionen (z.B. Zeitraum)
 * @returns {Promise<Array<Object>>} - Liste der Verlaufseinträge
 */
export const getLightHistory = async (lightId, options = {}) => {
    try {
        await storageManager.init();

        if (!storageManager.useIndexedDB) {
            // Für localStorage müssen wir alle Daten holen und dann filtern
            const allHistory = await localStorageFallback.getAll(STORES.USAGE_HISTORY);

            // Filtern nach lightId
            let results = allHistory.filter(item => item.lightId === lightId);

            // Nach Zeitraum filtern
            if (options.startTime && options.endTime) {
                results = results.filter(entry =>
                    entry.timestamp >= options.startTime &&
                    entry.timestamp <= options.endTime
                );
            } else if (options.startTime) {
                results = results.filter(entry =>
                    entry.timestamp >= options.startTime
                );
            } else if (options.endTime) {
                results = results.filter(entry =>
                    entry.timestamp <= options.endTime
                );
            }

            // Sortieren nach Zeitstempel (aufsteigend)
            results.sort((a, b) => a.timestamp - b.timestamp);

            return results;
        }

        const { stores, fallback } = await storageManager.openTransaction(STORES.USAGE_HISTORY);

        if (fallback) {
            return getLightHistory(lightId, options); // Rekursiver Aufruf für Fallback
        }

        const store = stores[STORES.USAGE_HISTORY];

        // Verwende den Index lightId für die Suche
        const index = store.index('lightId');

        return new Promise((resolve, reject) => {
            const request = index.getAll(lightId);

            request.onsuccess = () => {
                let results = request.result || [];

                // Filtere nach Zeitraum, falls angegeben
                if (options.startTime && options.endTime) {
                    results = results.filter(entry =>
                        entry.timestamp >= options.startTime &&
                        entry.timestamp <= options.endTime
                    );
                } else if (options.startTime) {
                    results = results.filter(entry =>
                        entry.timestamp >= options.startTime
                    );
                } else if (options.endTime) {
                    results = results.filter(entry =>
                        entry.timestamp <= options.endTime
                    );
                }

                // Sortiere nach Zeitstempel (aufsteigend)
                results.sort((a, b) => a.timestamp - b.timestamp);

                resolve(results);
            };

            request.onerror = () => {
                console.error('Fehler beim Laden des Lampenverlaufs:', request.error);
                // Fallback
                getLightHistory(lightId, options)
                    .then(resolve)
                    .catch(reject);
            };
        });
    } catch (error) {
        console.error('Fehler beim Laden des Lampenverlaufs:', error);
        // Für localStorage müssen wir alle Daten holen und dann filtern
        const allHistory = await localStorageFallback.getAll(STORES.USAGE_HISTORY);

        // Filtern nach lightId
        let results = allHistory.filter(item => item.lightId === lightId);

        // Nach Zeitraum filtern
        if (options.startTime && options.endTime) {
            results = results.filter(entry =>
                entry.timestamp >= options.startTime &&
                entry.timestamp <= options.endTime
            );
        } else if (options.startTime) {
            results = results.filter(entry =>
                entry.timestamp >= options.startTime
            );
        } else if (options.endTime) {
            results = results.filter(entry =>
                entry.timestamp <= options.endTime
            );
        }

        // Sortieren nach Zeitstempel (aufsteigend)
        results.sort((a, b) => a.timestamp - b.timestamp);

        return results;
    }
};

/**
 * Speichert eine Einstellung
 * @param {string} key - Schlüssel der Einstellung
 * @param {*} value - Wert der Einstellung
 * @returns {Promise<Object>} - Die gespeicherte Einstellung
 */
export const saveSetting = async (key, value) => {
    try {
        await storageManager.init();

        const setting = {
            key,
            value,
            updatedAt: Date.now()
        };

        if (!storageManager.useIndexedDB) {
            return localStorageFallback.save(STORES.SETTINGS, key, setting);
        }

        const { stores, fallback } = await storageManager.openTransaction(STORES.SETTINGS, 'readwrite');

        if (fallback) {
            return localStorageFallback.save(STORES.SETTINGS, key, setting);
        }

        const store = stores[STORES.SETTINGS];

        return new Promise((resolve, reject) => {
            const request = store.put(setting);

            request.onsuccess = () => resolve(setting);
            request.onerror = () => {
                console.error('Fehler beim Speichern der Einstellung:', request.error);
                // Fallback
                localStorageFallback.save(STORES.SETTINGS, key, setting)
                    .then(resolve)
                    .catch(reject);
            };
        });
    } catch (error) {
        console.error('Fehler beim Speichern der Einstellung:', error);
        return localStorageFallback.save(STORES.SETTINGS, key, {
            key,
            value,
            updatedAt: Date.now()
        });
    }
};

/**
 * Lädt eine Einstellung
 * @param {string} key - Schlüssel der Einstellung
 * @param {*} defaultValue - Standardwert, falls keine Einstellung gefunden wird
 * @returns {Promise<*>} - Der gespeicherte Wert oder der Standardwert
 */
export const getSetting = async (key, defaultValue = null) => {
    try {
        await storageManager.init();

        if (!storageManager.useIndexedDB) {
            const setting = await localStorageFallback.get(STORES.SETTINGS, key);
            return setting ? setting.value : defaultValue;
        }

        const { stores, fallback } = await storageManager.openTransaction(STORES.SETTINGS);

        if (fallback) {
            const setting = await localStorageFallback.get(STORES.SETTINGS, key);
            return setting ? setting.value : defaultValue;
        }

        const store = stores[STORES.SETTINGS];

        return new Promise((resolve, reject) => {
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : defaultValue);
            };

            request.onerror = () => {
                console.error('Fehler beim Laden der Einstellung:', request.error);
                // Fallback
                localStorageFallback.get(STORES.SETTINGS, key)
                    .then(setting => resolve(setting ? setting.value : defaultValue))
                    .catch(() => resolve(defaultValue));
            };
        });
    } catch (error) {
        console.error('Fehler beim Laden der Einstellung:', error);
        try {
            const setting = await localStorageFallback.get(STORES.SETTINGS, key);
            return setting ? setting.value : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }
};

/**
 * Speichert tägliche Gesamtwerte
 * @param {string} date - Datum im Format YYYY-MM-DD
 * @param {Object} data - Zu speichernde Daten
 * @returns {Promise<Object>} - Die gespeicherten Daten
 */
export const saveDailyTotal = async (date, data) => {
    try {
        await storageManager.init();

        const [year, month, day] = date.split('-').map(Number);

        const dailyData = {
            date,
            year,
            month: `${year}-${month.toString().padStart(2, '0')}`,
            day,
            ...data,
            updatedAt: Date.now()
        };

        if (!storageManager.useIndexedDB) {
            return localStorageFallback.save(STORES.DAILY_TOTALS, date, dailyData);
        }

        const { stores, fallback } = await storageManager.openTransaction(STORES.DAILY_TOTALS, 'readwrite');

        if (fallback) {
            return localStorageFallback.save(STORES.DAILY_TOTALS, date, dailyData);
        }

        const store = stores[STORES.DAILY_TOTALS];

        return new Promise((resolve, reject) => {
            const request = store.put(dailyData);

            request.onsuccess = () => resolve(dailyData);
            request.onerror = () => {
                console.error('Fehler beim Speichern der Tageswerte:', request.error);
                // Fallback
                localStorageFallback.save(STORES.DAILY_TOTALS, date, dailyData)
                    .then(resolve)
                    .catch(reject);
            };
        });
    } catch (error) {
        console.error('Fehler beim Speichern der Tageswerte:', error);
        return localStorageFallback.save(STORES.DAILY_TOTALS, date, {
            date,
            ...data,
            updatedAt: Date.now()
        });
    }
};

/**
 * Lädt Tageswerte für einen bestimmten Zeitraum
 * @param {Object} options - Optionen für den Zeitraum
 * @returns {Promise<Array<Object>>} - Liste der täglichen Werte
 */
export const getDailyTotals = async (options = {}) => {
    try {
        await storageManager.init();

        if (!storageManager.useIndexedDB) {
            // Für localStorage müssen wir alle Daten holen und dann filtern
            const allDailyTotals = await localStorageFallback.getAll(STORES.DAILY_TOTALS);

            // Filtern nach Zeitraum
            let results = [...allDailyTotals];

            if (options.month) {
                results = results.filter(entry => entry.month === options.month);
            } else {
                // Ansonsten alle Werte laden und filtern
                if (options.startDate && options.endDate) {
                    results = results.filter(entry =>
                        entry.date >= options.startDate &&
                        entry.date <= options.endDate
                    );
                } else if (options.startDate) {
                    results = results.filter(entry =>
                        entry.date >= options.startDate
                    );
                } else if (options.endDate) {
                    results = results.filter(entry =>
                        entry.date <= options.endDate
                    );
                }
            }

            // Sortiere nach Datum (aufsteigend)
            results.sort((a, b) => {
                if (a.date < b.date) return -1;
                if (a.date > b.date) return 1;
                return 0;
            });

            return results;
        }

        const { stores, fallback } = await storageManager.openTransaction(STORES.DAILY_TOTALS);

        if (fallback) {
            return getDailyTotals(options); // Rekursiver Aufruf für Fallback
        }

        const store = stores[STORES.DAILY_TOTALS];

        // Für Monatswerte verwenden wir den Index "month"
        if (options.month) {
            const index = store.index('month');

            return new Promise((resolve, reject) => {
                const request = index.getAll(options.month);

                request.onsuccess = () => {
                    const results = request.result || [];
                    // Sortiere nach Tag (aufsteigend)
                    results.sort((a, b) => a.day - b.day);
                    resolve(results);
                };

                request.onerror = () => {
                    console.error('Fehler beim Laden der Tageswerte für den Monat:', request.error);
                    // Fallback
                    getDailyTotals(options)
                        .then(resolve)
                        .catch(reject);
                };
            });
        }

        // Ansonsten alle Werte laden und filtern
        return new Promise((resolve, reject) => {
            const request = store.getAll();

            request.onsuccess = () => {
                let results = request.result || [];

                // Filtern nach Zeitraum
                if (options.startDate && options.endDate) {
                    results = results.filter(entry =>
                        entry.date >= options.startDate &&
                        entry.date <= options.endDate
                    );
                } else if (options.startDate) {
                    results = results.filter(entry =>
                        entry.date >= options.startDate
                    );
                } else if (options.endDate) {
                    results = results.filter(entry =>
                        entry.date <= options.endDate
                    );
                }

                // Sortiere nach Datum (aufsteigend)
                results.sort((a, b) => {
                    if (a.date < b.date) return -1;
                    if (a.date > b.date) return 1;
                    return 0;
                });

                resolve(results);
            };

            request.onerror = () => {
                console.error('Fehler beim Laden der Tageswerte:', request.error);
                // Fallback
                getDailyTotals(options)
                    .then(resolve)
                    .catch(reject);
            };
        });
    } catch (error) {
        console.error('Fehler beim Laden der Tageswerte:', error);
        // Für localStorage müssen wir alle Daten holen und dann filtern
        const allDailyTotals = await localStorageFallback.getAll(STORES.DAILY_TOTALS);

        // Filtern nach Zeitraum
        let results = [...allDailyTotals];

        if (options.month) {
            results = results.filter(entry => entry.month === options.month);
        } else {
            // Ansonsten alle Werte laden und filtern
            if (options.startDate && options.endDate) {
                results = results.filter(entry =>
                    entry.date >= options.startDate &&
                    entry.date <= options.endDate
                );
            } else if (options.startDate) {
                results = results.filter(entry =>
                    entry.date >= options.startDate
                );
            } else if (options.endDate) {
                results = results.filter(entry =>
                    entry.date <= options.endDate
                );
            }
        }

        // Sortiere nach Datum (aufsteigend)
        results.sort((a, b) => {
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;
            return 0;
        });

        return results;
    }
};

/**
 * Speichert monatliche Gesamtwerte
 * @param {string} month - Monat im Format YYYY-MM
 * @param {Object} data - Zu speichernde Daten
 * @returns {Promise<Object>} - Die gespeicherten Daten
 */
export const saveMonthlyTotal = async (month, data) => {
    try {
        await storageManager.init();

        const [year, monthNum] = month.split('-').map(Number);

        const monthlyData = {
            month,
            year: year.toString(),
            monthNum,
            ...data,
            updatedAt: Date.now()
        };

        if (!storageManager.useIndexedDB) {
            return localStorageFallback.save(STORES.MONTHLY_TOTALS, month, monthlyData);
        }

        const { stores, fallback } = await storageManager.openTransaction(STORES.MONTHLY_TOTALS, 'readwrite');

        if (fallback) {
            return localStorageFallback.save(STORES.MONTHLY_TOTALS, month, monthlyData);
        }

        const store = stores[STORES.MONTHLY_TOTALS];

        return new Promise((resolve, reject) => {
            const request = store.put(monthlyData);

            request.onsuccess = () => resolve(monthlyData);
            request.onerror = () => {
                console.error('Fehler beim Speichern der Monatswerte:', request.error);
                // Fallback
                localStorageFallback.save(STORES.MONTHLY_TOTALS, month, monthlyData)
                    .then(resolve)
                    .catch(reject);
            };
        });
    } catch (error) {
        console.error('Fehler beim Speichern der Monatswerte:', error);
        return localStorageFallback.save(STORES.MONTHLY_TOTALS, month, {
            month,
            ...data,
            updatedAt: Date.now()
        });
    }
};

/**
 * Lädt Monatswerte für ein bestimmtes Jahr
 * @param {string} year - Jahr (z.B. '2023')
 * @returns {Promise<Array<Object>>} - Liste der monatlichen Werte
 */
export const getMonthlyTotals = async (year = null) => {
    try {
        await storageManager.init();

        if (!storageManager.useIndexedDB) {
            // Für localStorage müssen wir alle Daten holen und dann filtern
            const allMonthlyTotals = await localStorageFallback.getAll(STORES.MONTHLY_TOTALS);

            // Filtern nach Jahr
            let results = [...allMonthlyTotals];

            if (year) {
                results = results.filter(entry => entry.year === year);
            }

            // Sortiere nach Jahr und Monat
            results.sort((a, b) => {
                if (a.year !== b.year) {
                    return a.year - b.year;
                }
                return a.monthNum - b.monthNum;
            });

            return results;
        }

        const { stores, fallback } = await storageManager.openTransaction(STORES.MONTHLY_TOTALS);

        if (fallback) {
            return getMonthlyTotals(year); // Rekursiver Aufruf für Fallback
        }

        const store = stores[STORES.MONTHLY_TOTALS];

        // Für Jahreswerte verwenden wir den Index "year"
        if (year) {
            const index = store.index('year');

            return new Promise((resolve, reject) => {
                const request = index.getAll(year);

                request.onsuccess = () => {
                    const results = request.result || [];
                    // Sortiere nach Monat (aufsteigend)
                    results.sort((a, b) => a.monthNum - b.monthNum);
                    resolve(results);
                };

                request.onerror = () => {
                    console.error('Fehler beim Laden der Monatswerte für das Jahr:', request.error);
                    // Fallback
                    getMonthlyTotals(year)
                        .then(resolve)
                        .catch(reject);
                };
            });
        }

        // Ansonsten alle Monatswerte laden
        return new Promise((resolve, reject) => {
            const request = store.getAll();

            request.onsuccess = () => {
                const results = request.result || [];

                // Sortiere nach Jahr und Monat
                results.sort((a, b) => {
                    if (a.year !== b.year) {
                        return a.year - b.year;
                    }
                    return a.monthNum - b.monthNum;
                });

                resolve(results);
            };

            request.onerror = () => {
                console.error('Fehler beim Laden der Monatswerte:', request.error);
                // Fallback
                getMonthlyTotals(year)
                    .then(resolve)
                    .catch(reject);
            };
        });
    } catch (error) {
        console.error('Fehler beim Laden der Monatswerte:', error);
        // Für localStorage müssen wir alle Daten holen und dann filtern
        const allMonthlyTotals = await localStorageFallback.getAll(STORES.MONTHLY_TOTALS);

        // Filtern nach Jahr
        let results = [...allMonthlyTotals];

        if (year) {
            results = results.filter(entry => entry.year === year);
        }

        // Sortiere nach Jahr und Monat
        results.sort((a, b) => {
            if (a.year !== b.year) {
                return a.year - b.year;
            }
            return a.monthNum - b.monthNum;
        });

        return results;
    }
};

/**
 * Importiert Daten in die Datenbank
 * @param {Object} importData - Die zu importierenden Daten
 * @returns {Promise<void>}
 */
export const importData = async (importData) => {
    try {
        // Initialisiere Storage
        await storageManager.init();

        // Prüfe, ob das richtige Format vorliegt
        if (!importData || !importData.meta) {
            throw new Error('Ungültiges Datenformat für den Import');
        }

        // Für jeden verfügbaren Store in den importierten Daten
        for (const storeName in STORES) {
            // Prüfe, ob Daten für diesen Store vorhanden sind
            if (importData[storeName] && Array.isArray(importData[storeName]) && importData[storeName].length > 0) {
                // Für IndexedDB
                if (storageManager.useIndexedDB) {
                    const { stores, fallback } = await storageManager.openTransaction(storeName, 'readwrite');

                    // Fallback zu localStorage
                    if (fallback) {
                        // Für localStorage müssen wir erst alles löschen
                        await localStorageFallback.clear(storeName);

                        // Dann alles neu speichern
                        for (const item of importData[storeName]) {
                            // Schlüssel extrahieren
                            const key = item.lightId || item.key || item.id || item.date || item.month;
                            if (key) {
                                await localStorageFallback.save(storeName, key, item);
                            }
                        }
                        continue;
                    }

                    const store = stores[storeName];

                    // Lösche zuerst alle vorhandenen Daten
                    await new Promise((resolve, reject) => {
                        const clearRequest = store.clear();
                        clearRequest.onsuccess = resolve;
                        clearRequest.onerror = reject;
                    });

                    // Importiere die neuen Daten
                    for (const item of importData[storeName]) {
                        await new Promise((resolve, reject) => {
                            const addRequest = store.add(item);
                            addRequest.onsuccess = resolve;
                            addRequest.onerror = (e) => {
                                console.warn(`Fehler beim Hinzufügen eines Elements zu ${storeName}:`, e.target.error);
                                resolve(); // Ignoriere Fehler und fahre fort
                            };
                        });
                    }
                }
                // Für localStorage
                else {
                    // Für localStorage müssen wir erst alles löschen
                    await localStorageFallback.clear(storeName);

                    // Dann alles neu speichern
                    for (const item of importData[storeName]) {
                        // Schlüssel extrahieren
                        const key = item.lightId || item.key || item.id || item.date || item.month;
                        if (key) {
                            await localStorageFallback.save(storeName, key, item);
                        }
                    }
                }
            }
        }

        console.log('Datenimport erfolgreich abgeschlossen');
    } catch (error) {
        console.error('Fehler beim Importieren der Daten:', error);
        throw error;
    }
};

// Initialisiere den Storage-Manager
storageManager.init().catch(error => {
    console.error('Fehler bei der Initialisierung des Storage-Managers:', error);
});

// Exportiere auch den Storage-Manager für Tests
export const _storageManager = storageManager;