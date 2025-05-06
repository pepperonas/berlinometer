import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, useMediaQuery } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#2e7d32', // Grün
          },
          secondary: {
            main: '#f57c00', // Orange
          },
          background: {
            default: darkMode ? '#121212' : '#f5f5f5',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 500,
          },
          h2: {
            fontWeight: 500,
          },
          h3: {
            fontWeight: 500,
          },
          h4: {
            fontWeight: 500,
          },
          h5: {
            fontWeight: 500,
          },
          h6: {
            fontWeight: 500,
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: darkMode 
                  ? '0 4px 6px rgba(0,0,0,0.3)' 
                  : '0 2px 10px rgba(0,0,0,0.08)',
                width: '100%',
              },
            },
          },
          MuiCardContent: {
            styleOverrides: {
              root: {
                padding: '16px 24px',
                '&:last-child': {
                  paddingBottom: '24px',
                },
              },
            },
          },
          MuiListItemText: {
            styleOverrides: {
              primary: {
                color: darkMode ? 'rgba(255, 255, 255, 0.9)' : undefined,
              },
            },
          },
          MuiListItemIcon: {
            styleOverrides: {
              root: {
                color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined,
              },
            },
          },
          // Stellt sicher, dass alle ComboBoxen und Select-Felder mindestens 100px breit sind
          MuiInputBase: {
            styleOverrides: {
              root: {
                '&.MuiInputBase-formControl': {
                  minWidth: '100px',
                },
                '&.MuiInputBase-adornedEnd': {
                  minWidth: '100px',
                },
              },
            },
          },
          // Zusätzlich für Select-Komponenten
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                minWidth: '100px',
              },
            },
          },
          // Auch für Autocomplete-Komponenten
          MuiAutocomplete: {
            styleOverrides: {
              root: {
                minWidth: '100px',
              },
              inputRoot: {
                minWidth: '100px',
              },
            },
          },
        },
      }),
    [darkMode],
  );

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        <Header toggleTheme={toggleTheme} darkMode={darkMode} toggleSidebar={toggleSidebar} />
        <Sidebar open={sidebarOpen} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            width: { sm: sidebarOpen ? `calc(100% - 240px)` : '100%' },
            maxWidth: '100%',
            bgcolor: 'background.default',
            overflow: 'auto',
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Toolbar sx={{ mb: 2 }} /> {/* Spacer for fixed AppBar with extra margin */}
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;