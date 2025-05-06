import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar, useMediaQuery } from '@mui/material';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import Header from './Header';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

const Layout = ({ children }) => {
  const { darkMode, fontSize, toggleDarkMode } = useTheme();
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
          // Schriftgröße basierend auf der Einstellung anpassen
          fontSize: fontSize === 'small' ? 13 : fontSize === 'large' ? 16 : 14,
          h1: {
            fontWeight: 500,
            fontSize: fontSize === 'small' ? '2.2rem' : fontSize === 'large' ? '2.8rem' : '2.5rem',
          },
          h2: {
            fontWeight: 500,
            fontSize: fontSize === 'small' ? '1.8rem' : fontSize === 'large' ? '2.4rem' : '2.1rem',
          },
          h3: {
            fontWeight: 500,
            fontSize: fontSize === 'small' ? '1.5rem' : fontSize === 'large' ? '2.1rem' : '1.8rem',
          },
          h4: {
            fontWeight: 500,
            fontSize: fontSize === 'small' ? '1.2rem' : fontSize === 'large' ? '1.8rem' : '1.5rem',
          },
          h5: {
            fontWeight: 500,
            fontSize: fontSize === 'small' ? '1.1rem' : fontSize === 'large' ? '1.5rem' : '1.3rem',
          },
          h6: {
            fontWeight: 500,
            fontSize: fontSize === 'small' ? '0.9rem' : fontSize === 'large' ? '1.3rem' : '1.1rem',
          },
          body1: {
            fontSize: fontSize === 'small' ? '0.9rem' : fontSize === 'large' ? '1.1rem' : '1rem',
          },
          body2: {
            fontSize: fontSize === 'small' ? '0.8rem' : fontSize === 'large' ? '1rem' : '0.9rem',
          },
          button: {
            fontSize: fontSize === 'small' ? '0.8rem' : fontSize === 'large' ? '1rem' : '0.9rem',
          },
          caption: {
            fontSize: fontSize === 'small' ? '0.7rem' : fontSize === 'large' ? '0.9rem' : '0.8rem',
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <MuiThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        <Header toggleTheme={toggleDarkMode} darkMode={darkMode} toggleSidebar={toggleSidebar} />
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
    </MuiThemeProvider>
  );
};

export default Layout;