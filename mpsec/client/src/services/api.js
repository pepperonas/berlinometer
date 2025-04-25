import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5012/api',  // Port auf 5005 angepasst
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Token aus localStorage hinzufügen, falls vorhanden
const token = localStorage.getItem('token');
if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Interceptor für API-Fehler
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Detailliertere Fehlerausgabe
        console.error('API-Fehler:', error);

        if (error.response) {
            // Der Server hat geantwortet, aber mit einem Status-Code außerhalb von 2xx
            console.error('Antwort vom Server:', {
                status: error.response.status,
                headers: error.response.headers,
                data: error.response.data
            });
        } else if (error.request) {
            // Die Anfrage wurde gesendet, aber es kam keine Antwort
            console.error('Keine Antwort erhalten:', error.request);
        } else {
            // Fehler beim Aufsetzen der Anfrage
            console.error('Fehler beim Erstellen der Anfrage:', error.message);
        }

        // Wenn der Fehler ein 401 (Unauthorized) ist, dann Benutzer ausloggen
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
        }
        return Promise.reject(error);
    }
);

export default api;