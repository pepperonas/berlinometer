import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Token im localStorage speichern/entfernen
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    // Überprüfen des Token beim Laden der App
    const checkToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        setUser(response.data.data);
      } catch (err) {
        console.error('Token-Verifizierungsfehler:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  const register = async (username, password) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        password
      });
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Bei der Registrierung ist ein Fehler aufgetreten'
      );
      throw err;
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Bei der Anmeldung ist ein Fehler aufgetreten'
      );
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
