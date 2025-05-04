import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// API Basis-URL - für Entwicklung fest auf den Backend-Server setzen
const API_URL = 'http://localhost:5024/api';

// Konfiguriere Axios für Cookies
axios.defaults.withCredentials = true;

// Erstellen eines Kontext für die Authentifizierung
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Laden des Benutzers beim App-Start
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        
        // Token aus dem localStorage holen
        const token = localStorage.getItem('token');
        
        if (!token) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        
        // Setze Authorization Header für alle Anfragen
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Benutzer von der API laden
        const response = await axios.get(`${API_URL}/auth/me`);
        
        if (response.data.success) {
          setCurrentUser(response.data.data);
        } else {
          // Token ist ungültig
          localStorage.removeItem('token');
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Fehler beim Laden des Benutzers:', err);
        localStorage.removeItem('token');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Anmeldung via API
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      if (response.data.success) {
        // Token im localStorage speichern
        localStorage.setItem('token', response.data.token);
        
        // Setze Authorization Header für alle Anfragen
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        setCurrentUser(response.data.user);
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Anmeldung fehlgeschlagen');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Unbekannter Fehler bei der Anmeldung';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Registrierung via API
  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password
      });
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Registrierung erfolgreich! Dein Konto wird vom Administrator aktiviert.'
        };
      } else {
        throw new Error(response.data.error || 'Registrierung fehlgeschlagen');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Unbekannter Fehler bei der Registrierung';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Abmeldung via API
  const logout = async () => {
    setLoading(true);
    
    try {
      await axios.post(`${API_URL}/auth/logout`);
      
      // Token entfernen
      localStorage.removeItem('token');
      
      // Entferne Authorization Header
      delete axios.defaults.headers.common['Authorization'];
      
      setCurrentUser(null);
      return { success: true };
    } catch (err) {
      const errorMessage = 'Fehler bei der Abmeldung';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Benutzeraktualisierung via API
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`${API_URL}/users/${currentUser.id}`, userData);
      
      if (response.data.success) {
        setCurrentUser(prev => ({ ...prev, ...response.data.data }));
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Aktualisierung fehlgeschlagen');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Fehler beim Aktualisieren des Profils';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;