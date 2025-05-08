import React, { createContext, useContext, useState, useEffect } from 'react';

// Default-Einstellungen
const defaultThemeSettings = {
  darkMode: false,
  fontSize: 'medium' // 'small', 'medium', 'large'
};

// Theme-Kontext erstellen
const ThemeContext = createContext();

// Custom Hook für den einfachen Zugriff auf den Theme-Kontext
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Theme-Einstellungen aus dem localStorage laden oder Standardwerte verwenden
  const [themeSettings, setThemeSettings] = useState(() => {
    const savedSettings = localStorage.getItem('themeSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (error) {
        console.error('Fehler beim Parsen der gespeicherten Theme-Einstellungen:', error);
        return defaultThemeSettings;
      }
    }
    return defaultThemeSettings;
  });

  // Theme-Einstellungen im localStorage speichern, wenn sie sich ändern
  useEffect(() => {
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
  }, [themeSettings]);

  // Aktualisieren der Theme-Einstellungen
  const updateThemeSettings = (newSettings) => {
    setThemeSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  // Dunklen Modus umschalten
  const toggleDarkMode = () => {
    setThemeSettings(prevSettings => ({
      ...prevSettings,
      darkMode: !prevSettings.darkMode
    }));
  };

  // Schriftgröße ändern
  const setFontSize = (size) => {
    if (['small', 'medium', 'large'].includes(size)) {
      setThemeSettings(prevSettings => ({
        ...prevSettings,
        fontSize: size
      }));
    }
  };

  // Werte, die dem Kontext zur Verfügung gestellt werden
  const contextValue = {
    ...themeSettings,
    updateThemeSettings,
    toggleDarkMode,
    setFontSize
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;