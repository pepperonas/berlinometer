import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LANGUAGES = {
  DE: 'de',
  EN: 'en'
};

// Translation strings
const translations = {
  [LANGUAGES.DE]: {
    // Navigation & Header
    'welcome': 'Willkommen',
    'myLocations': 'Meine Locations',
    'profile': 'Profil',
    'login': 'Anmelden',
    'logout': 'Abmelden',
    'register': 'Registrieren',
    
    // User Profile
    'username': 'Benutzername',
    'email': 'E-Mail',
    'password': 'Passwort',
    'confirmPassword': 'Passwort bestätigen',
    'memberSince': 'Mitglied seit',
    'lastLogin': 'Letzter Login',
    'filters': 'Filter',
    'themes': 'Themes',
    'language': 'Sprache',
    
    // Theme names
    'themeDark': 'Dunkel',
    'themeLight': 'Hell',
    'themePsychedelic': 'Psychedelisch',
    'themeSelect': 'Theme auswählen',
    'themeDescription': 'Wählen Sie das gewünschte Design für die Benutzeroberfläche.',
    'themeSelected': 'Aktiv',
    'themeTip': 'Das ausgewählte Theme wird automatisch gespeichert und bei Ihrem nächsten Besuch wiederhergestellt.',
    
    // Language
    'languageSelect': 'Sprache auswählen',
    'languageDescription': 'Wählen Sie Ihre bevorzugte Sprache für die Benutzeroberfläche.',
    'languageGerman': 'Deutsch',
    'languageEnglish': 'English',
    
    // Filters
    'addNewFilter': 'Neuen Filter hinzufügen',
    'filterValue': 'Filterwert',
    'addFilter': 'Filter hinzufügen',
    'yourFilters': 'Ihre Filter',
    'noFilters': 'Keine Filter konfiguriert. Fügen Sie oben einen Filter hinzu, um die Scraping-Ergebnisse automatisch zu filtern.',
    'toggleFilter': 'Filter umschalten',
    'deleteFilter': 'Filter löschen',
    'filterAdded': 'Filter erfolgreich hinzugefügt!',
    'filterDeleted': 'Filter erfolgreich gelöscht!',
    
    // Authentication
    'usernameOrEmail': 'Benutzername oder E-Mail',
    'createAccount': 'Konto erstellen',
    'registrationSuccessful': 'Registrierung erfolgreich! Sie können sich jetzt anmelden.',
    'alreadyHaveAccount': 'Bereits ein Konto?',
    'noAccount': 'Noch kein Konto?',
    'loginHere': 'Hier anmelden',
    'registerHere': 'Hier registrieren',
    
    // Locations
    'savedLocations': 'Gespeicherte Locations',
    'noSavedLocations': 'Keine gespeicherten Locations gefunden.',
    'saveLocation': 'Location speichern',
    'removeLocation': 'Entfernen',
    'addLocations': 'Locations hinzufügen',
    'searchLocations': 'Locations durchsuchen...',
    'noSearchResults': 'Keine passenden Locations gefunden.',
    'scrapeSelected': 'Ausgewählte scrapen',
    'reorderLocations': 'Locations neu anordnen',
    'locationAdded': 'Location erfolgreich hinzugefügt!',
    'allLocationsAdded': 'Alle verfügbaren Locations wurden hinzugefügt',
    
    // Cookie Banner
    'cookieNotice': 'Cookie-Hinweis',
    'cookieDescription': 'Diese Website verwendet Cookies für Analytics und zur Verbesserung der Nutzererfahrung.',
    'accept': 'Akzeptieren',
    'decline': 'Ablehnen',
    'moreDetails': 'Mehr Details in der Datenschutzerklärung',
    
    // Footer
    'madeWith': 'Made with ❤️ by Martin Pfeffer',
    'imprint': 'Impressum',
    'privacy': 'Datenschutz',
    
    // Generic
    'close': 'Schließen',
    'cancel': 'Abbrechen',
    'save': 'Speichern',
    'delete': 'Löschen',
    'edit': 'Bearbeiten',
    'loading': 'Laden...',
    'error': 'Fehler',
    'success': 'Erfolg',
    'on': 'AN',
    'off': 'AUS'
  },
  
  [LANGUAGES.EN]: {
    // Navigation & Header
    'welcome': 'Welcome',
    'myLocations': 'My Locations',
    'profile': 'Profile',
    'login': 'Login',
    'logout': 'Logout',
    'register': 'Register',
    
    // User Profile
    'username': 'Username',
    'email': 'Email',
    'password': 'Password',
    'confirmPassword': 'Confirm Password',
    'memberSince': 'Member since',
    'lastLogin': 'Last Login',
    'filters': 'Filters',
    'themes': 'Themes',
    'language': 'Language',
    
    // Theme names
    'themeDark': 'Dark',
    'themeLight': 'Light',
    'themePsychedelic': 'Psychedelic',
    'themeDescription': 'Choose your preferred design for the user interface.',
    'themeSelected': 'Active',
    'themeTip': 'The selected theme will be automatically saved and restored on your next visit.',
    
    // Language
    'languageSelect': 'Select Language',
    'languageDescription': 'Choose your preferred language for the user interface.',
    'languageGerman': 'Deutsch',
    'languageEnglish': 'English',
    
    // Filters
    'addNewFilter': 'Add New Filter',
    'filterValue': 'Filter Value',
    'addFilter': 'Add Filter',
    'yourFilters': 'Your Filters',
    'noFilters': 'No filters configured. Add a filter above to automatically filter scraping results.',
    'toggleFilter': 'Toggle Filter',
    'deleteFilter': 'Delete Filter',
    'filterAdded': 'Filter successfully added!',
    'filterDeleted': 'Filter successfully deleted!',
    
    // Authentication
    'usernameOrEmail': 'Username or Email',
    'createAccount': 'Create Account',
    'registrationSuccessful': 'Registration successful! You can now log in.',
    'alreadyHaveAccount': 'Already have an account?',
    'noAccount': 'No account yet?',
    'loginHere': 'Login here',
    'registerHere': 'Register here',
    
    // Locations
    'savedLocations': 'Saved Locations',
    'noSavedLocations': 'No saved locations found.',
    'saveLocation': 'Save Location',
    'removeLocation': 'Remove',
    'addLocations': 'Add Locations',
    'searchLocations': 'Search locations...',
    'noSearchResults': 'No matching locations found.',
    'scrapeSelected': 'Scrape Selected',
    'reorderLocations': 'Reorder Locations',
    'locationAdded': 'Location successfully added!',
    'allLocationsAdded': 'All available locations have been added',
    
    // Cookie Banner
    'cookieNotice': 'Cookie Notice',
    'cookieDescription': 'This website uses cookies for analytics and to improve user experience.',
    'accept': 'Accept',
    'decline': 'Decline',
    'moreDetails': 'More details in the privacy policy',
    
    // Footer
    'madeWith': 'Made with ❤️ by Martin Pfeffer',
    'imprint': 'Imprint',
    'privacy': 'Privacy',
    
    // Generic
    'close': 'Close',
    'cancel': 'Cancel',
    'save': 'Save',
    'delete': 'Delete',
    'edit': 'Edit',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'on': 'ON',
    'off': 'OFF'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(LANGUAGES.DE);

  useEffect(() => {
    // Load language from localStorage on mount
    const savedLanguage = localStorage.getItem('berlinometer-language');
    if (savedLanguage && Object.values(LANGUAGES).includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Save language to localStorage
    localStorage.setItem('berlinometer-language', language);
  }, [language]);

  const switchLanguage = (newLanguage) => {
    if (Object.values(LANGUAGES).includes(newLanguage)) {
      setLanguage(newLanguage);
    }
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        switchLanguage,
        t,
        availableLanguages: {
          [LANGUAGES.DE]: 'Deutsch',
          [LANGUAGES.EN]: 'English'
        }
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;