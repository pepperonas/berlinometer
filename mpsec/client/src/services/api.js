import axios from 'axios';

// Bestimme den Basis-URL basierend auf der Umgebung
let baseURL = '/api'; // Standard für lokale Entwicklung

// Wenn wir auf dem Produktionsserver sind (über /mpsec erreichbar)
// oder wenn wir einen speziellen Pfad in der URL haben
if (window.location.pathname.startsWith('/mpsec') ||
    process.env.NODE_ENV === 'production') {
    baseURL = '/mpsec/api';
}

console.log('[DEBUG] API baseURL:', baseURL);

const api = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Initialen Token aus localStorage hinzufügen, falls vorhanden
const token = localStorage.getItem('token');
if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Request-Interceptor für Debugging
api.interceptors.request.use(
    (config) => {
        // Immer Debug-Ausgabe für API-Anfragen
        console.debug(`API-Anfrage: ${config.method.toUpperCase()} ${config.url}`);
        console.debug('Vollständige URL:', `${config.baseURL}${config.url}`);
        console.debug('Headers:', config.headers);

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response-Interceptor für Fehlerbehandlung
api.interceptors.response.use(
    (response) => {
        // Erfolgreiche Antwort
        console.debug(`API-Antwort (${response.status}): ${response.config.method.toUpperCase()} ${response.config.url}`);
        return response;
    },
    (error) => {
        // Fehlerhafte Antwort
        console.error('API-Fehler:', error);

        if (error.response) {
            // Server hat mit einem Fehlercode geantwortet
            console.error('Antwort vom Server:', {
                status: error.response.status,
                headers: error.response.headers,
                data: error.response.data,
                url: error.config.url,
                fullUrl: `${error.config.baseURL}${error.config.url}`
            });

            // 401 Unauthorized: Token ist ungültig oder abgelaufen
            if (error.response.status === 401) {
                // Token aus localStorage entfernen
                localStorage.removeItem('token');
                // Authorization-Header entfernen
                delete api.defaults.headers.common['Authorization'];
            }
        } else if (error.request) {
            // Keine Antwort vom Server erhalten
            console.error('Keine Antwort erhalten:', error.request);
            console.error('Anfrage-URL:', `${error.config.baseURL}${error.config.url}`);
        } else {
            // Fehler beim Erstellen der Anfrage
            console.error('Anfrage-Fehler:', error.message);
        }

        return Promise.reject(error);
    }
);

// Hilfsfunktion für direkte API-Tests (kann in der Konsole aufgerufen werden)
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