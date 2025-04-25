import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // Explizite URL zum lokalen Backend
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
    console.error('API-Fehler:', error);
    
    // Wenn der Fehler ein 401 (Unauthorized) ist, dann Benutzer ausloggen
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
    return Promise.reject(error);
  }
);

export default api;
