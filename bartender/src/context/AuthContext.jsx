import React, { createContext, useContext, useState, useEffect } from 'react';

// Standard-Benutzer für die Demo
const DEFAULT_USER = {
  id: 'user1',
  name: 'Demo Benutzer',
  email: 'demo@example.com',
  role: 'admin',
  avatar: null,
};

// Erstellen eines Kontext für die Authentifizierung
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simuliert das Laden eines Benutzers beim App-Start
  useEffect(() => {
    const loadUser = async () => {
      try {
        // In einer echten App würde hier z.B. ein Token überprüft werden
        // und der Benutzer von der API geladen werden
        
        // Simulation einer API-Verzögerung
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Zu Demozwecken verwenden wir einen Standard-Benutzer
        setCurrentUser(DEFAULT_USER);
        setLoading(false);
      } catch (err) {
        console.error('Fehler beim Laden des Benutzers:', err);
        setError('Benutzer konnte nicht geladen werden.');
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Simuliert eine Anmeldung
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In einer echten App würde hier ein API-Aufruf stattfinden
      if (email === 'demo@example.com' && password === 'password') {
        setCurrentUser(DEFAULT_USER);
        return { success: true };
      } else {
        throw new Error('Ungültige Anmeldeinformationen');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Simuliert eine Abmeldung
  const logout = async () => {
    setLoading(true);
    
    try {
      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In einer echten App würden hier Token gelöscht werden
      setCurrentUser(null);
      return { success: true };
    } catch (err) {
      setError('Fehler bei der Abmeldung');
      return { success: false, error: 'Fehler bei der Abmeldung' };
    } finally {
      setLoading(false);
    }
  };

  // Simuliert eine Aktualisierung des Benutzerprofils
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Aktualisieren des Benutzers mit den neuen Daten
      setCurrentUser(prev => ({ ...prev, ...userData }));
      return { success: true };
    } catch (err) {
      setError('Fehler beim Aktualisieren des Profils');
      return { success: false, error: 'Fehler beim Aktualisieren des Profils' };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
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