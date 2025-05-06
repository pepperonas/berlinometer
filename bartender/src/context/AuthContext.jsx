import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// API Basis-URL - nimmt entweder die REACT_APP_API_URL Umgebungsvariable oder einen Standard-Wert
// Überprüfe, ob wir im Development oder Production sind
const isLocalhost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

// Base Path ermitteln (für Subpaths wie /bartender)
const basePath = (() => {
  // Wenn wir im Production sind und die URL einen Pfad enthält, extrahieren wir diesen
  if (!isLocalhost) {
    const pathMatch = window.location.pathname.match(/^\/([^\/]+)/);
    if (pathMatch && pathMatch[1]) {
      return `/${pathMatch[1]}`;
    }
  }
  return '';
})();

// In Development: lokale URL mit Port
// In Production: relative URL (basePath + /api) ohne Domain
const API_URL = process.env.REACT_APP_API_URL || 
  (isLocalhost ? 'http://localhost:5024/api' : `${basePath}/api`);

console.log(`Using API URL: ${API_URL} (${isLocalhost ? 'development' : 'production'} mode, basePath: '${basePath}')`);

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
        
        // Speichere den User inkl. Bar-Info im localStorage für API-Interceptor
        // Ensure consistent id and _id properties
        const userData = response.data.user;
        if (userData._id && !userData.id) userData.id = userData._id;
        if (userData.id && !userData._id) userData._id = userData.id;
        
        // Make sure bar info is consistent too
        if (userData.bar && userData.bar._id && !userData.bar.id) userData.bar.id = userData.bar._id;
        if (userData.bar && userData.bar.id && !userData.bar._id) userData.bar._id = userData.bar.id;
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        setCurrentUser(userData); // Use our normalized userData
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
      console.log('Full registration URL:', `${API_URL}/auth/register`);
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password
        }),
        credentials: 'include' // Wichtig für Cookies
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
      
      // Entferne den gespeicherten User
      localStorage.removeItem('currentUser');
      
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
      // Check if token exists in localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage for updateProfile');
        // Force reauthentication
        setCurrentUser(null);
        throw new Error('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
      }
      
      // Make sure Authorization header is set for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      if (!currentUser) {
        throw new Error('Sie müssen angemeldet sein, um Ihr Profil zu aktualisieren');
      }
      // Use _id or id depending on what's available
      if (!currentUser._id && !currentUser.id) {
        console.error('User object missing both _id and id:', currentUser);
        throw new Error('Ungültiges Benutzerprofil. Bitte melden Sie sich erneut an.');
      }
      
      // Try using the auth/profile endpoint instead of users/profile
      let endpoint = `${API_URL}/auth/profile`;
      let method = 'POST';
      
      if (userData.currentPassword && userData.newPassword) {
        // No need to change endpoint for password change anymore
        // Convert the password parameters to expected ones
        userData = {
          ...userData,
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
        
        if (!token) {
          console.error('No token found in localStorage!');
          setCurrentUser(null);
          throw new Error('Sie sind nicht eingeloggt. Bitte melden Sie sich an.');
        }
        
        console.log('Using token from localStorage:', token ? 'Token exists' : 'No token');
        
        // Direktes Logging des Tokens für Debug-Zwecke (nur die ersten 10 Zeichen)
        console.log('Token first 10 chars:', token.substring(0, 10) + '...');
        
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
        
        if (fetchResponse.status === 401 || fetchResponse.status === 403) {
          // Token ungültig oder abgelaufen - User abmelden
          console.error('Authentication error, logging out');
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          delete axios.defaults.headers.common['Authorization'];
          setCurrentUser(null);
          throw new Error('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
        }
        
        if (!fetchResponse.ok) {
          throw new Error(`Server antwortete mit Status ${fetchResponse.status}`);
        }
        
        const data = await fetchResponse.json();
        
        if (data && data.success) {
          // If we have updated user data, update the current user
          if (data.user) {
            setCurrentUser(data.user);
          } else if (data.data) {
            // If we have bar data, merge it with the current user
            if (data.bar) {
              setCurrentUser(prev => ({
                ...prev,
                ...data.data,
                bar: {
                  ...(prev.bar || {}),
                  ...data.bar
                }
              }));
            } else {
              // Otherwise just update the user data
              setCurrentUser(prev => ({ ...prev, ...data.data }));
            }
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
        
        // Make sure headers are set for axios
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No token found in localStorage for axios fallback!');
          setCurrentUser(null);
          throw new Error('Sie sind nicht eingeloggt. Bitte melden Sie sich an.');
        }
        
        // Force set the authorization header again
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          const response = await axios[axiosMethod](endpoint, userData, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Erfolgreiche Antwort
          console.log('Axios response status:', response.status);
        
          if (response.data && response.data.success) {
            // If we have updated user data, update the current user
            if (response.data.user) {
              setCurrentUser(response.data.user);
            } else if (response.data.data) {
              // If we have bar data, merge it with the current user
              if (response.data.bar) {
                setCurrentUser(prev => ({
                  ...prev,
                  ...response.data.data,
                  bar: {
                    ...(prev.bar || {}),
                    ...response.data.bar
                  }
                }));
              } else {
                // Otherwise just update the user data
                setCurrentUser(prev => ({ ...prev, ...response.data.data }));
              }
            }
            return { success: true };
          } else {
            throw new Error(response.data?.error || 'Aktualisierung fehlgeschlagen');
          }
        } catch (axiosError) {
          console.error('Axios error:', axiosError);
          
          if (axiosError.response) {
            if (axiosError.response.status === 401 || axiosError.response.status === 403) {
              // Token ungültig oder abgelaufen - User abmelden
              console.error('Authentication error in axios, logging out');
              localStorage.removeItem('token');
              localStorage.removeItem('currentUser');
              delete axios.defaults.headers.common['Authorization'];
              setCurrentUser(null);
              throw new Error('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
            }
            
            throw new Error(`Server antwortete mit Status ${axiosError.response.status}: ${axiosError.response.data?.error || axiosError.message}`);
          }
          
          throw axiosError;
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