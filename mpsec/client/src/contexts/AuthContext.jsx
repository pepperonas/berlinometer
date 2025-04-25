import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import jwt_decode from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // API Header mit Token aktualisieren
  const updateApiHeader = useCallback((newToken) => {
    if (newToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, []);

  // Token im localStorage aktualisieren
  useEffect(() => {
    if (token) {
      // Token im Storage speichern
      localStorage.setItem('token', token);
      // API-Header setzen
      updateApiHeader(token);

      try {
        // Token dekodieren und Benutzerinfo extrahieren
        const decoded = jwt_decode(token);

        // Prüfen, ob Token abgelaufen ist
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
          console.log('Token abgelaufen, Benutzer wird abgemeldet');
          logout();
          return;
        }

        // Benutzerinfo aus Token setzen
        setUser({
          id: decoded.id,
          username: decoded.username
        });
      } catch (err) {
        console.error('Token-Dekodierungsfehler:', err);
        // Bei fehlerhaftem Token ausloggen
        logout();
      }
    } else {
      // Token entfernen
      localStorage.removeItem('token');
      updateApiHeader(null);
      setUser(null);
    }
  }, [token, updateApiHeader]);

  // Benutzervalidierung beim App-Start
  useEffect(() => {
    const validateUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        // API-Header mit gespeichertem Token setzen
        updateApiHeader(storedToken);

        // Benutzerinfo vom Server abrufen, um Token zu validieren
        const response = await api.get('/auth/me');

        // Token ist gültig, Benutzer setzen
        setToken(storedToken); // Löst useEffect für Token aus
        setUser(response.data.data);
      } catch (err) {
        console.error('Token-Validierungsfehler:', err);
        // Bei ungültigem Token ausloggen
        logout();
      } finally {
        setLoading(false);
      }
    };

    validateUser();
  }, [updateApiHeader]);

  // Registrierung
  const register = async (username, password) => {
    setError('');

    try {
      const response = await api.post('/auth/register', {
        username,
        password
      });

      if (response.data.success && response.data.token) {
        // Token speichern (löst useEffect für Token aus)
        setToken(response.data.token);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Unbekannter Fehler bei der Registrierung');
      }
    } catch (err) {
      console.error('Registrierungsfehler:', err);
      setError(
          err.response?.data?.message ||
          err.message ||
          'Bei der Registrierung ist ein Fehler aufgetreten'
      );
      throw err;
    }
  };

  // Anmeldung
  const login = async (username, password) => {
    setError('');

    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });

      if (response.data.success && response.data.token) {
        // Token speichern (löst useEffect für Token aus)
        setToken(response.data.token);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Unbekannter Fehler bei der Anmeldung');
      }
    } catch (err) {
      console.error('Anmeldefehler:', err);
      setError(
          err.response?.data?.message ||
          err.message ||
          'Bei der Anmeldung ist ein Fehler aufgetreten'
      );
      throw err;
    }
  };

  // Abmeldung
  const logout = useCallback(() => {
    // Token löschen (löst useEffect für Token aus)
    setToken(null);
  }, []);

  // Kontext-Werte
  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    setError,
    isAuthenticated: !!user
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
};

export default AuthContext;