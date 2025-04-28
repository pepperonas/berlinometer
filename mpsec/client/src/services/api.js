import axios from 'axios';

// Bestimme den Basis-URL basierend auf der Umgebung
let baseURL = '/api'; // Standard für lokale Entwicklung mit Proxy

// Wenn wir auf dem Produktionsserver sind (über /mpsec erreichbar)
// oder wenn wir einen speziellen Pfad in der URL haben
if (window.location.pathname.startsWith('/mpsec') ||
    process.env.NODE_ENV === 'production') {
    baseURL = '/mpsec/api';
}

// DIREKTER API-ZUGRIFF (nur für Notfall-Debugging)
// Wenn das Proxy nicht funktioniert, kannst du diesen Kommentar entfernen:
// baseURL = 'http://localhost:5012/api';

console.log('[DEBUG] API baseURL:', baseURL);

const api = axios.create({
    baseURL,
    timeout: 10000,
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

export default api;