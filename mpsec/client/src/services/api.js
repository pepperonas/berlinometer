import axios from 'axios';

// Bestimme den Basis-URL basierend auf der Umgebung
let baseURL = '/api'; // Standard für lokale Entwicklung mit Proxy

// Domain und Host erkennen
const isHostedDomain = window.location.hostname === 'mrx3k1.de';

// Wenn wir auf dem Produktionsserver sind (über /mpsec erreichbar)
// oder wenn wir einen speziellen Pfad in der URL haben
if (window.location.pathname.startsWith('/mpsec') ||
    process.env.NODE_ENV === 'production') {
    if (isHostedDomain) {
        // Für die gehostete Anwendung auf mrx3k1.de
        baseURL = 'https://mrx3k1.de/mpsec/api';
    } else {
        baseURL = '/mpsec/api';
    }
}

// DIREKTER API-ZUGRIFF (für Debugging, falls das Proxy nicht funktioniert)
if (process.env.NODE_ENV === 'development' && !isHostedDomain) {
    // Nur im Development-Modus direkt auf den API-Server zugreifen
    baseURL = 'http://localhost:5012/api';
}

console.log('[DEBUG] API baseURL:', baseURL);

const api = axios.create({
    baseURL,
    timeout: 30000, // Erhöht auf 30 Sekunden für bessere Zuverlässigkeit
    headers: {
        'Content-Type': 'application/json'
    },
    // Wichtig: Verhindert, dass Cookies entlang gesendet werden
    withCredentials: false
});

// Initialen Token aus localStorage hinzufügen, falls vorhanden
const token = localStorage.getItem('token');
if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Request-Interceptor für Debugging - verbessert mit vollem Logging
api.interceptors.request.use(
    (config) => {
        try {
            // Vollständiges Debug-Logging für API-Anfragen
            console.debug(`API-Anfrage: ${config.method.toUpperCase()} ${config.url}`);
            console.debug('Vollständige URL:', `${config.baseURL}${config.url}`);
            console.debug('Headers:', JSON.stringify(config.headers));
            if (config.data) {
                const logData = {...config.data};
                // Sensible Daten maskieren
                if (logData.password) logData.password = '***';
                console.debug('Request-Daten:', JSON.stringify(logData));
            }
        } catch (logError) {
            console.warn('Debug-Logging-Fehler:', logError);
        }

        return config;
    },
    (error) => {
        console.error('Request-Fehler:', error);
        return Promise.reject(error);
    }
);

// Response-Interceptor für Fehlerbehandlung - mit verbessertem Logging
api.interceptors.response.use(
    (response) => {
        try {
            // Erfolgreiche Antwort
            console.debug(`API-Antwort (${response.status}): ${response.config.method.toUpperCase()} ${response.config.url}`);
            // Kompakte Antwortdaten ausgeben (nur für Debugging)
            console.debug('Antwort-Daten:', JSON.stringify(response.data).substring(0, 200) + '...');
        } catch (logError) {
            console.warn('Response-Logging-Fehler:', logError);
        }
        return response;
    },
    (error) => {
        // Fehlerhafte Antwort - umfassende Fehlerinfo
        console.error('API-Fehler:', error.message || error);

        if (error.response) {
            // Server hat mit einem Fehlercode geantwortet
            try {
                console.error('Antwort vom Server:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    url: error.config.url,
                    fullUrl: `${error.config.baseURL}${error.config.url}`
                });
            } catch (logError) {
                console.warn('Fehler beim Logging der Serverantwort:', logError);
            }

            // 401 Unauthorized: Token ist ungültig oder abgelaufen
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                delete api.defaults.headers.common['Authorization'];
                console.warn('Token wurde entfernt wegen 401 Unauthorized');

                // Optional: Redirect zur Login-Seite
                if (window.location.pathname !== '/mpsec/login' &&
                    window.location.pathname !== '/login') {
                    console.log('Weiterleitung zur Login-Seite...');
                    window.location.href = window.location.pathname.startsWith('/mpsec')
                        ? '/mpsec/login'
                        : '/login';
                }
            }
        } else if (error.request) {
            // Keine Antwort vom Server erhalten
            console.error('Keine Antwort erhalten - Server möglicherweise nicht erreichbar');
            console.error('Anfrage-URL:', `${error.config.baseURL}${error.config.url}`);
            console.error('Request-Objekt:', error.request);
        } else {
            // Fehler beim Erstellen der Anfrage
            console.error('Anfrage-Fehler:', error.message);
        }

        return Promise.reject(error);
    }
);

// Hilfsfunktion für direkte API-Tests
window.testApi = async (path = '/auth/login', method = 'post', data = {}) => {
    try {
        console.log(`Teste API-Endpunkt: ${baseURL}${path}`);
        const response = await api({
            method,
            url: path,
            data
        });
        console.log('API-Test erfolgreich:', response.data);
        return response.data;
    } catch (error) {
        console.error('API-Test fehlgeschlagen:', error);
        throw error;
    }
};

// Helper für Wiederholungsversuche bei Netzwerkfehlern
export const fetchWithRetry = async (apiCall, maxRetries = 3) => {
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            return await apiCall();
        } catch (error) {
            retries++;
            
            // Nur bei Timeout oder Network Error wiederholen
            const isNetworkError = 
                error.message.includes('timeout') || 
                error.message.includes('Network Error');
                
            if (!isNetworkError || retries >= maxRetries) {
                throw error;
            }
            
            console.log(`Anfrage fehlgeschlagen (${error.message}). Wiederholungsversuch ${retries}/${maxRetries}...`);
            
            // Exponentielles Backoff: 1s, 2s, 4s, ...
            const delay = Math.pow(2, retries - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// Helper für Serververbindungsstatus mit Datenbank-Prüfung
export const checkServerStatus = async () => {
    try {
        const endpoints = [
            '/ping',
            '/api/ping',
            '/mpsec/api/ping'
        ];
        
        const results = {};
        let dbConnected = false;
        let dbStatus = null;
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Prüfe Verbindung zu: ${baseURL}${endpoint}`);
                const start = Date.now();
                const response = await api.get(endpoint, { timeout: 5000 });
                const elapsed = Date.now() - start;
                
                // Prüfe auf Datenbank-Status in der Antwort
                if (response.data?.db) {
                    dbStatus = response.data.db;
                    if (response.data.db.connected) {
                        dbConnected = true;
                    }
                }
                
                results[endpoint] = {
                    status: 'success',
                    time: elapsed,
                    data: response.data
                };
            } catch (err) {
                results[endpoint] = {
                    status: 'error',
                    message: err.message,
                    code: err.code
                };
            }
        }
        
        // Server-Status bestimmen
        const serverConnected = Object.values(results).some(r => r.status === 'success');
        
        return {
            baseURL,
            timestamp: new Date().toISOString(),
            connected: serverConnected,
            dbConnected: dbConnected,
            dbStatus: dbStatus,
            endpoints: results
        };
    } catch (error) {
        console.error('Fehler bei Serverstatusprüfung:', error);
        return {
            baseURL,
            timestamp: new Date().toISOString(),
            connected: false,
            dbConnected: false,
            error: error.message
        };
    }
};

export default api;