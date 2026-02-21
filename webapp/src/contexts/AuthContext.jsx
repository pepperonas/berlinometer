import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user_info');

      if (storedToken && storedUser) {
        try {
          const userInfo = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userInfo);

          // Verify token is still valid before finishing loading
          await verifyToken(storedToken);
        } catch (error) {
          console.error('Error parsing stored user info:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_info');
        }
      }

      setLoading(false);
    };
    initAuth();
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      });

      if (!response.ok) {
        // Token is invalid or expired
        logout();
      } else {
        // Update user state with latest data from server (includes role, email)
        const data = await response.json();
        if (data.user) {
          const updatedUser = { ...data.user };
          setUser(updatedUser);
          localStorage.setItem('user_info', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Token verification error:', error);
      // On network error, keep the token but user can try to use it
    }
  };

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('user_info', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
  };

  const isAuthenticated = () => {
    return !!(user && token);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isLocationOwner = () => {
    return user?.role === 'location_owner';
  };

  const canAccessAdmin = () => {
    return user?.role === 'admin' || user?.role === 'location_owner';
  };

  const getAuthHeaders = () => {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  const authFetch = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: { ...getAuthHeaders(), ...options.headers }
    });
    if (response.status === 401) {
      logout();
    }
    return response;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isLocationOwner,
    canAccessAdmin,
    getAuthHeaders,
    authFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
