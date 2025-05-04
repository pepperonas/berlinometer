import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// API Basis-URL - nimmt entweder die REACT_APP_API_URL Umgebungsvariable oder einen Standard-Wert
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5024/api';

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
        
        try {
          // Setze Authorization Header für alle Anfragen
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Benutzer von der API laden
          const response = await axios.get(`${API_URL}/auth/me`);
          
          if (response.data && response.data.success) {
            setCurrentUser(response.data.data);
          } else {
            // Token ist ungültig
            console.log('Token ist ungültig oder API-Antwort ungültig');
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setCurrentUser(null);
          }
        } catch (apiError) {
          console.error('API-Fehler beim Laden des Benutzers:', apiError);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Allgemeiner Fehler beim Laden des Benutzers:', err);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
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
      console.log('Versuche Anmeldung bei:', `${API_URL}/auth/login`);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 Sekunden Timeout
      });
      
      console.log('Login Antwort:', response.data);
      
      if (response.data && response.data.success) {
        // Token im localStorage speichern
        localStorage.setItem('token', response.data.token);
        
        // Setze Authorization Header für alle Anfragen
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        setCurrentUser(response.data.user);
        return { success: true };
      } else {
        throw new Error(response.data?.error || 'Anmeldung fehlgeschlagen');
      }
    } catch (err) {
      console.error('Login Error:', err);
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
      console.log('Versuche Registrierung bei:', `${API_URL}/auth/register`);
      console.log('Mit Daten:', { name, email, password: '***HIDDEN***' });
      
      // Nutze direkt fetch statt axios wegen möglicher CORS-Probleme
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });
      
      console.log('Register response status:', response.status);
      
      const data = await response.json();
      console.log('Register response data:', data);
      
      if (data.success) {
        return {
          success: true,
          message: data.message || 'Registrierung erfolgreich! Dein Konto wird vom Administrator aktiviert.'
        };
      } else {
        throw new Error(data.error || 'Registrierung fehlgeschlagen');
      }
    } catch (err) {
      console.error('Register error:', err);
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
      if (!currentUser || !currentUser.id) {
        throw new Error('Sie müssen angemeldet sein, um Ihr Profil zu aktualisieren');
      }
      
      // Check if this is a password change request
      let endpoint = `${API_URL}/users/${currentUser.id}`;
      let method = userData.currentPassword ? 'POST' : 'PUT';
      
      if (userData.currentPassword && userData.newPassword) {
        endpoint = `${API_URL}/auth/change-password`;
        // Verwende POST statt PUT
        userData = {
          currentPassword: userData.currentPassword,
          newPassword: userData.newPassword
        };
        
        // Log detailed debugging info
        console.log('Password change request:', {
          endpoint,
          method,
          data: { 
            currentPassword: "***HIDDEN***", 
            newPassword: "***HIDDEN***" 
          },
          token: axios.defaults.headers.common['Authorization'] ? "Token exists" : "No token"
        });
      }
      
      console.log('Updating profile with endpoint:', endpoint, 'method:', method);
      
      try {
        // Versuche mit fetch statt axios (CORS-Problem umgehen)
        const token = localStorage.getItem('token');
        const fetchResponse = await fetch(endpoint, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userData),
          credentials: 'include'
        });
        
        console.log('Fetch response status:', fetchResponse.status);
        
        if (!fetchResponse.ok) {
          throw new Error(`Server antwortete mit Status ${fetchResponse.status}`);
        }
        
        const data = await fetchResponse.json();
        
        if (data && data.success) {
          // If we have updated user data, update the current user
          if (data.user) {
            setCurrentUser(data.user);
          } else if (data.data) {
            setCurrentUser(prev => ({ ...prev, ...data.data }));
          }
          return { success: true };
        } else {
          throw new Error(data?.error || 'Aktualisierung fehlgeschlagen');
        }
      } catch (fetchErr) {
        console.error('Fetch error:', fetchErr);
        
        // Fallback zu axios als letzter Versuch
        console.log('Fallback zu axios mit Methode:', method);
        const axiosMethod = method.toLowerCase();
        const response = await axios[axiosMethod](endpoint, userData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data && response.data.success) {
          // If we have updated user data, update the current user
          if (response.data.user) {
            setCurrentUser(response.data.user);
          } else if (response.data.data) {
            // Maintain backward compatibility
            setCurrentUser(prev => ({ ...prev, ...response.data.data }));
          }
          return { success: true };
        } else {
          throw new Error(response.data?.error || 'Aktualisierung fehlgeschlagen');
        }
      }
    } catch (err) {
      console.error('Update profile error:', err);
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