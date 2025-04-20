// src/utils/EnergyDataStorage.js - Datenbank für Energiedaten mit IndexedDB

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

/**
 * Initialisiere die Datenbank
 * @returns {Promise<IDBDatabase>} - Eine Promise, die die Datenbankverbindung liefert
 */
const initDatabase = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

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
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;

            // Ereignislistener für Fehler
            db.onerror = (event) => {
                console.error('Datenbankfehler:', event.target.error);
            };

            resolve(db);
        };
    });
};

/**
 * Öffnet eine Transaktion für bestimmte Object Stores
 * @param {string|Array<string>} storeNames - Name(n) der zu öffnenden Object Stores
 * @param {string} mode - Transaktionsmodus ('readonly' oder 'readwrite')
 * @returns {Promise<Object>} - Object Stores in einer Transaktion
 */
const openTransaction = async (storeNames, mode = 'readonly') => {
    const db = await initDatabase();
    const transaction = db.transaction(storeNames, mode);

    const stores = {};

    if (Array.isArray(storeNames)) {
        storeNames.forEach(name => {
            stores[name] = transaction.objectStore(name);
        });
    } else {
        stores[storeNames] = transaction.objectStore(storeNames);
    }

    return { stores, transaction };
};

/**
 * Speichert Energiedaten für eine Lampe
 * @param {string} lightId - ID der Lampe
 * @param {Object} data - Zu speichernde Daten
 * @returns {Promise<Object>} - Die gespeicherten Daten
 */
export const saveLightData = async (lightId, data) => {
    try {
        const { stores } = await openTransaction(STORES.LIGHT_DATA, 'readwrite');
        const store = stores[STORES.LIGHT_DATA];

        const lightData = {
            lightId,
            ...data,
            timestamp: data.timestamp || Date.now()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(lightData);

            request.onsuccess = () => resolve(lightData);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Fehler beim Speichern der Lampendaten:', error);
        throw error;
    }
};

/**
 * Lädt Energiedaten für eine bestimmte Lampe
 * @param {string} lightId - ID der Lampe
 * @returns {Promise<Object>} - Die gespeicherten Daten oder null
 */
export const getLightData = async (lightId) => {
    try {
        const { stores } = await openTransaction(STORES.LIGHT_DATA);
        const store = stores[STORES.LIGHT_DATA];

        return new Promise((resolve, reject) => {
            const request = store.get(lightId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Lampendaten:', error);
        throw error;
    }
};

/**
 * Lädt Energiedaten für alle Lampen
 * @returns {Promise<Array<Object>>} - Liste aller gespeicherten Lampendaten
 */
export const getAllLightData = async () => {
    try {
        const { stores } = await openTransaction(STORES.LIGHT_DATA);
        const store = stores[STORES.LIGHT_DATA];

        return new Promise((resolve, reject) => {
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Fehler beim Laden aller Lampendaten:', error);
        throw error;
    }
};

/**
 * Fügt einen Eintrag zum Verlauf hinzu
 * @param {Object} historyEntry - Der hinzuzufügende Verlaufseintrag
 * @returns {Promise<number>} - Die ID des gespeicherten Eintrags
 */
export const addToHistory = async (historyEntry) => {
    try {
        const { stores } = await openTransaction(STORES.USAGE_HISTORY, 'readwrite');
        const store = stores[STORES.USAGE_HISTORY];

        const entry = {
            ...historyEntry,
            timestamp: historyEntry.timestamp || Date.now()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(entry);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Fehler beim Hinzufügen zum Verlauf:', error);
        throw error;
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
        const { stores } = await openTransaction(STORES.USAGE_HISTORY);
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

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Fehler beim Laden des Lampenverlaufs:', error);
        throw error;
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
        const { stores } = await openTransaction(STORES.SETTINGS, 'readwrite');
        const store = stores[STORES.SETTINGS];

        const setting = {
            key,
            value,
            updatedAt: Date.now()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(setting);

            request.onsuccess = () => resolve(setting);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Fehler beim Speichern der Einstellung:', error);
        throw error;
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
        const { stores } = await openTransaction(STORES.SETTINGS);
        const store = stores[STORES.SETTINGS];

        return new Promise((resolve, reject) => {
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : defaultValue);
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Einstellung:', error);
        return defaultValue;
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
        const { stores } = await openTransaction(STORES.DAILY_TOTALS, 'readwrite');
        const store = stores[STORES.DAILY_TOTALS];

        const [year, month, day] = date.split('-').map(Number);

        const dailyData = {
            date,
            year,
            month: `${year}-${month.toString().padStart(2, '0')}`,
            day,
            ...data,
            updatedAt: Date.now()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(dailyData);

            request.onsuccess = () => resolve(dailyData);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Fehler beim Speichern der Tageswerte:', error);
        throw error;
    }
};

/**
 * Lädt Tageswerte für einen bestimmten Zeitraum
 * @param {Object} options - Optionen für den Zeitraum
 * @returns {Promise<Array<Object>>} - Liste der täglichen Werte
 */
export const getDailyTotals = async (options = {}) => {
    try {
        const { stores } = await openTransaction(STORES.DAILY_TOTALS);
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

                request.onerror = () => reject(request.error);
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

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Tageswerte:', error);
        throw error;
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
        const { stores } = await openTransaction(STORES.MONTHLY_TOTALS, 'readwrite');
        const store = stores[STORES.MONTHLY_TOTALS];

        const [year, monthNum] = month.split('-').map(Number);

        const monthlyData = {
            month,
            year: year.toString(),
            monthNum,
            ...data,
            updatedAt: Date.now()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(monthlyData);

            request.onsuccess = () => resolve(monthlyData);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Fehler beim Speichern der Monatswerte:', error);
        throw error;
    }
};

/**
 * Lädt Monatswerte für ein bestimmtes Jahr
 * @param {string} year - Jahr (z.B. '2023')
 * @returns {Promise<Array<Object>>} - Liste der monatlichen Werte
 */
export const getMonthlyTotals = async (year = null) => {
    try {
        const { stores } = await openTransaction(STORES.MONTHLY_TOTALS);
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

                request.onerror = () => reject(request.error);
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

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Monatswerte:', error);
        throw error;
    }
};

/**
 * Exportiert alle Daten aus der Datenbank als JSON-Objekt
 * @returns {Promise<Object>} - Die exportierten Daten
 */
export const exportAllData = async () => {
    try {
        // Liste aller zu exportierenden Stores
        const allStores = Object.values(STORES);

        // Öffne Transaktion für alle Stores
        const { stores } = await openTransaction(allStores);

        // Lade die Daten aus jedem Store
        const exportData = {};

        const promises = allStores.map(storeName => {
            return new Promise((resolve, reject) => {
                const request = stores[storeName].getAll();

                request.onsuccess = () => {
                    exportData[storeName] = request.result;
                    resolve();
                };

                request.onerror = () => reject(request.error);
            });
        });

        // Warte, bis alle Daten geladen sind
        await Promise.all(promises);

        // Füge Metadaten hinzu
        exportData.meta = {
            exportTime: new Date().toISOString(),
            version: DB_VERSION,
            database: DB_NAME
        };

        return exportData;
    } catch (error) {
        console.error('Fehler beim Exportieren der Daten:', error);
        throw error;
    }
};

/**
 * Importiert Daten in die Datenbank
 * @param {Object} importData - Die zu importierenden Daten
 * @returns {Promise<void>}
 */
export const importData = async (importData) => {
    try {
        // Prüfe, ob das richtige Format vorliegt
        if (!importData || !importData.meta) {
            throw new Error('Ungültiges Datenformat für den Import');
        }

        // Liste aller zu importierenden Stores
        const storesToImport = Object.keys(importData)
            .filter(key => key !== 'meta' && Object.values(STORES).includes(key));

        // Erstelle eine Transaktion für alle betroffenen Stores
        const { stores } = await openTransaction(storesToImport, 'readwrite');

        // Importiere die Daten in jeden Store
        const promises = storesToImport.map(storeName => {
            if (!Array.isArray(importData[storeName])) {
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                // Lösche zuerst alle vorhandenen Daten
                const clearRequest = stores[storeName].clear();

                clearRequest.onsuccess = () => {
                    // Importiere dann die neuen Daten
                    const importPromises = importData[storeName].map(item => {
                        return new Promise((resolveItem, rejectItem) => {
                            const request = stores[storeName].add(item);
                            request.onsuccess = resolveItem;
                            request.onerror = rejectItem;
                        });
                    });

                    Promise.all(importPromises)
                        .then(resolve)
                        .catch(reject);
                };

                clearRequest.onerror = reject;
            });
        });

        // Warte, bis alle Daten importiert sind
        await Promise.all(promises);

        console.log('Datenimport erfolgreich abgeschlossen');
    } catch (error) {
        console.error('Fehler beim Importieren der Daten:', error);
        throw error;
    }
};

/**
 * Löscht alte Daten aus der Datenbank
 * @param {Object} options - Optionen für die Bereinigung
 * @returns {Promise<number>} - Anzahl der gelöschten Einträge
 */
export const cleanupOldData = async (options = {}) => {
    try {
        const opts = {
            maxAgeInDays: options.maxAgeInDays || 365, // Standard: 1 Jahr
            aggregateOldData: options.aggregateOldData !== undefined ? options.aggregateOldData : true
        };

        const { stores } = await openTransaction(STORES.USAGE_HISTORY, 'readwrite');
        const store = stores[STORES.USAGE_HISTORY];

        // Berechne den Zeitstempel für das maximale Alter
        const now = Date.now();
        const maxAgeTimestamp = now - (opts.maxAgeInDays * 24 * 60 * 60 * 1000);

        // Finde alte Einträge
        const index = store.index('timestamp');

        // Verwende ein IDBKeyRange für alle Einträge vor dem maxAgeTimestamp
        const range = IDBKeyRange.upperBound(maxAgeTimestamp);

        return new Promise((resolve, reject) => {
            // Sammle erst alle zu löschenden Einträge
            const getRequest = index.getAll(range);

            getRequest.onsuccess = () => {
                const oldEntries = getRequest.result || [];

                if (oldEntries.length === 0) {
                    resolve(0);
                    return;
                }

                // Wenn wir alte Daten aggregieren wollen, tun wir das hier
                if (opts.aggregateOldData) {
                    // Gruppiere nach Lampe und Tag
                    const aggregatedData = {};

                    oldEntries.forEach(entry => {
                        const date = new Date(entry.timestamp);
                        const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                        const key = `${entry.lightId}_${dateKey}`;

                        if (!aggregatedData[key]) {
                            aggregatedData[key] = {
                                lightId: entry.lightId,
                                date: dateKey,
                                timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
                                totalWatt: 0,
                                totalWh: 0,
                                count: 0,
                                isAggregated: true
                            };
                        }

                        aggregatedData[key].totalWatt += entry.value || 0;
                        aggregatedData[key].totalWh += entry.valueWh || 0;
                        aggregatedData[key].count++;
                    });

                    // Erstelle aggregierte Einträge
                    const aggregatedEntries = Object.values(aggregatedData).map(data => ({
                        lightId: data.lightId,
                        timestamp: data.timestamp,
                        value: data.totalWatt / data.count, // Durchschnittlicher Watt-Wert
                        valueWh: data.totalWh, // Gesamte Wh für den Tag
                        isAggregated: true,
                        originalCount: data.count,
                        date: data.date
                    }));

                    // Speichere die aggregierten Daten und lösche die alten
                    const transaction = store.transaction;
                    let deletedCount = 0;

                    // Erstelle Promises für jede Operation
                    const deletePromises = oldEntries.map(entry =>
                        new Promise((resolveDelete) => {
                            const deleteRequest = store.delete(entry.id);
                            deleteRequest.onsuccess = () => {
                                deletedCount++;
                                resolveDelete();
                            };
                            deleteRequest.onerror = () => resolveDelete();
                        })
                    );

                    const addPromises = aggregatedEntries.map(entry =>
                        new Promise((resolveAdd) => {
                            const addRequest = store.add(entry);
                            addRequest.onsuccess = resolveAdd;
                            addRequest.onerror = resolveAdd;
                        })
                    );

                    // Führe alle Operationen durch
                    Promise.all([...deletePromises, ...addPromises])
                        .then(() => resolve(deletedCount))
                        .catch(reject);
                } else {
                    // Lösche einfach alle alten Einträge ohne Aggregation
                    let deletedCount = 0;

                    const deletePromises = oldEntries.map(entry =>
                        new Promise((resolveDelete) => {
                            const deleteRequest = store.delete(entry.id);
                            deleteRequest.onsuccess = () => {
                                deletedCount++;
                                resolveDelete();
                            };
                            deleteRequest.onerror = () => resolveDelete();
                        })
                    );

                    Promise.all(deletePromises)
                        .then(() => resolve(deletedCount))
                        .catch(reject);
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    } catch (error) {
        console.error('Fehler bei der Bereinigung alter Daten:', error);
        throw error;
    }
};