// Main App component with routing and theme management

import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, useMediaQuery } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext';

// Components
import MainLayout from './components/Layout/MainLayout';
import FoodView from './components/FoodView/FoodView';
// import LoginView from './components/Auth/LoginView';
// import RegisterView from './components/Auth/RegisterView';
// import CocktailView from './components/CocktailView/CocktailView';
// import FavoritesView from './components/FavoritesView/FavoritesView';
// import HistoryView from './components/HistoryView/HistoryView';
// import ProfileView from './components/ProfileView/ProfileView';
// import PremiumView from './components/PremiumView/PremiumView';
// import AdminView from './components/AdminView/AdminView';
// import SettingsView from './components/SettingsView/SettingsView';
// import SharedRecipeView from './components/SharedRecipeView/SharedRecipeView';
// import NotFoundView from './components/NotFoundView/NotFoundView';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  // Theme state management
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : prefersDarkMode;
  });

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Create Material-UI theme
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#FF6B35', // Orange primary color
            light: '#FF8F65',
            dark: '#E55A2B',
          },
          secondary: {
            main: '#4ECDC4', // Teal secondary color
            light: '#7DDDD6',
            dark: '#3BA69F',
          },
          background: {
            default: darkMode ? '#121212' : '#FAFAFA',
            paper: darkMode ? '#1E1E1E' : '#FFFFFF',
          },
          success: {
            main: '#4CAF50',
            light: '#81C784',
            dark: '#388E3C',
          },
          error: {
            main: '#F44336',
            light: '#E57373',
            dark: '#D32F2F',
          },
          warning: {
            main: '#FF9800',
            light: '#FFB74D',
            dark: '#F57C00',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 700,
          },
          h2: {
            fontWeight: 600,
          },
          h3: {
            fontWeight: 600,
          },
          h4: {
            fontWeight: 600,
          },
          h5: {
            fontWeight: 500,
          },
          h6: {
            fontWeight: 500,
          },
          button: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: '0.875rem',
                fontWeight: 500,
              },
              contained: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: darkMode 
                  ? '0 4px 20px rgba(0,0,0,0.3)'
                  : '0 4px 20px rgba(0,0,0,0.1)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 16,
              },
              elevation1: {
                boxShadow: darkMode
                  ? '0 2px 8px rgba(0,0,0,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.1)',
              },
              elevation2: {
                boxShadow: darkMode
                  ? '0 4px 16px rgba(0,0,0,0.3)'
                  : '0 4px 16px rgba(0,0,0,0.1)',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
        },
      }),
    [darkMode]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              {/* For now, simple routing - will add auth routes later */}
              <Route
                path="/*"
                element={
                  <MainLayout darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
                }
              >
                <Route index element={<FoodView />} />
                <Route path="food" element={<FoodView />} />
                {/* TODO: Add other routes */}
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
