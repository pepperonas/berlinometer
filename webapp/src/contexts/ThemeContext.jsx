import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light'
};

export const THEME_NAMES = {
  [THEMES.DARK]: 'Dunkel',
  [THEMES.LIGHT]: 'Hell'
};

// Theme configurations
const themeConfig = {
  [THEMES.DARK]: {
    name: 'Dunkel',
    description: 'Elegantes dunkles Theme',
    cssClass: 'theme-dark',
    colors: {
      'background-dark': '#2B2E3B',
      'background-darker': '#252830',
      'card-background': '#343845',
      'accent-blue': '#688db1',
      'accent-green': '#9cb68f',
      'accent-red': '#e16162',
      'text-primary': '#d1d5db',
      'text-secondary': '#9ca3af',
      'card-bg': '#343845',
      'border-color': '#4B5563',
      'text-color': '#d1d5db',
      'input-bg': '#374151',
      'primary-color': '#688db1',
      'hover-bg': '#414755'
    }
  },
  [THEMES.LIGHT]: {
    name: 'Hell',
    description: 'Modernes helles Theme',
    cssClass: 'theme-light',
    colors: {
      'background-dark': '#FFFFFF',
      'background-darker': '#F8F9FA',
      'card-background': '#FFFFFF',
      'accent-blue': '#3B82F6',
      'accent-green': '#10B981',
      'accent-red': '#EF4444',
      'text-primary': '#1F2937',
      'text-secondary': '#6B7280',
      'card-bg': '#FFFFFF',
      'border-color': '#E5E7EB',
      'text-color': '#1F2937',
      'input-bg': '#F9FAFB',
      'primary-color': '#3B82F6',
      'hover-bg': '#F3F4F6'
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(THEMES.DARK);

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('berlinometer-theme');
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    applyTheme(theme);
    
    // Save theme to localStorage
    localStorage.setItem('berlinometer-theme', theme);
  }, [theme]);

  const applyTheme = (selectedTheme) => {
    const config = themeConfig[selectedTheme];
    const root = document.documentElement;

    // Remove existing theme classes
    Object.values(THEMES).forEach(t => {
      document.body.classList.remove(themeConfig[t].cssClass);
    });

    // Add new theme class
    document.body.classList.add(config.cssClass);

    // Apply CSS custom properties
    Object.entries(config.colors).forEach(([property, value]) => {
      root.style.setProperty(`--${property}`, value);
    });
  };

  const switchTheme = (newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const getCurrentThemeConfig = () => themeConfig[theme];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        switchTheme,
        getCurrentThemeConfig,
        availableThemes: themeConfig,
        themeNames: THEME_NAMES
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;