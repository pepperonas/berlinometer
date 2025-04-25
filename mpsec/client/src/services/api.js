import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5005/api',
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
        // Debug-Ausgabe für API-Anfragen
        if (process.env.NODE_ENV === 'development') {
            console.debug(`API-Anfrage: ${config.method.toUpperCase()} ${config.url}`);
        }
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
        if (process.env.NODE_ENV === 'development') {
            console.debug(`API-Antwort (${response.status}): ${response.config.method.toUpperCase()} ${response.config.url}`);
        }
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
                data: error.response.data
            });

            // 401 Unauthorized: Token ist ungültig oder abgelaufen
            if (error.response.status === 401) {
                // Token aus localStorage entfernen
                localStorage.removeItem('token');
                // Authorization-Header entfernen
                delete api.defaults.headers.common['Authorization'];

                // Optional: Automatisch zur Login-Seite umleiten
                // window.location.href = '/login';
            }
        } else if (error.request) {
            // Keine Antwort vom Server erhalten
            console.error('Keine Antwort erhalten:', error.request);
        } else {
            // Fehler beim Erstellen der Anfrage
            console.error('Anfrage-Fehler:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;