import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
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
    'filters': 'Filter (Beta)',
    'themes': 'Themes',
    'language': 'Sprache',
    'tip': 'Tipp',
    
    // Theme names
    'themeDark': 'Dunkel',
    'themeLight': 'Hell',
    'themeNewspaper': 'Zeitung',
    'themeDarkDesc': 'Elegantes dunkles Theme',
    'themeLightDesc': 'Modernes helles Theme',
    'themeNewspaperDesc': 'Vintage Zeitungs-Design',
    'themeBerlin': 'Berlin',
    'themeBerlinDesc': 'Urbanes Berlin-Theme mit BVG-Gelb',
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
    
    // Login Form
    'loginTitle': 'Anmelden',
    'loginButton': 'Anmelden',
    'loginInProgress': 'Anmeldung läuft...',
    'loginFailed': 'Anmeldung fehlgeschlagen',
    'networkError': 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
    'usernamePlaceholder': 'Geben Sie Ihren Benutzername oder E-Mail ein',
    'passwordPlaceholder': 'Geben Sie Ihr Passwort ein',
    'orContinueWith': 'oder weiter mit',
    'googleLoginFailed': 'Google-Anmeldung fehlgeschlagen',
    
    // Register Form
    'registerTitle': 'Konto erstellen',
    'registerButton': 'Konto erstellen',
    'registerInProgress': 'Konto wird erstellt...',
    'registerFailed': 'Registrierung fehlgeschlagen',
    'passwordMismatch': 'Passwörter stimmen nicht überein',
    'passwordTooShort': 'Passwort muss mindestens 6 Zeichen lang sein',
    'usernameTooShort': 'Benutzername muss mindestens 3 Zeichen lang sein',
    'invalidEmail': 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
    'registrationSuccess': 'Registrierung erfolgreich! Ihr Konto wartet auf Aktivierung. Sie können sich anmelden, sobald ein Administrator Ihr Konto aktiviert hat.',
    'usernamePlaceholderRegister': 'Wählen Sie einen Benutzernamen (min. 3 Zeichen)',
    'emailPlaceholder': 'Geben Sie Ihre E-Mail-Adresse ein',
    'passwordPlaceholderRegister': 'Wählen Sie ein Passwort (min. 6 Zeichen)',
    'confirmPasswordPlaceholder': 'Bestätigen Sie Ihr Passwort',
    'activationNote': 'Neue Konten erfordern eine manuelle Aktivierung durch einen Administrator. Sie können sich anmelden, sobald Ihr Konto aktiviert wurde.',
    'noteLabel': 'Hinweis:',
    
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
    
    // ResultsDisplay
    'scrapingResults': 'Scraping Ergebnisse',
    'locationsAnalyzed': 'Location{count} analysiert',
    'locationsFiltered': 'Location{count} gefiltert',
    'searchLocationsPlaceholder': 'Locations durchsuchen...',
    'unknownLocation': 'Unbekannte Location',
    'stars': 'Sterne',
    'liveOccupancy': 'Live-Auslastung:',
    'occupancyData': 'Auslastungsdaten:',
    'realtimeData': 'Echtzeitdaten von Google Maps',
    'noOccupancyData': 'Keine Auslastungsdaten verfügbar',
    'errorLabel': 'Fehler:',
    'openGoogleMaps': 'Google Maps öffnen',
    'showHistory': 'Historie anzeigen',
    'closeHistory': 'Historie schließen',
    'noResultsYet': 'Noch keine Ergebnisse verfügbar',
    'noMatchesFound': 'Keine Treffer gefunden',
    'tryDifferentSearch': 'Versuche einen anderen Suchbegriff',
    'historical': 'Historisch',
    'live': 'LIVE',
    
    // AboutDialog
    'aboutApp': 'Über die App',
    
    // App.jsx
    'berlinometerSubtitle': 'Finde heraus, wo heute was los ist in Berlins Bars und Clubs',
    'resultsFilteredByProfile': 'Die Ergebnisse werden basierend auf deinen Profileinstellungen gefiltert',
    'automatedScrapingActive': 'Automatisches Scraping aktiv',
    'automatedScrapingDescription': 'Die Locations werden automatisch alle 20-30 Minuten gescrapt. Die neuesten Ergebnisse werden automatisch geladen.',
    'aboutTheApp': 'Über die App',
    'missingLocation': 'Dir fehlt eine Location?',
    'emailSubjectNewLocation': 'Berlinometer - Neue Location vorschlagen',
    'errorLoadingHistory': 'Fehler beim Laden der Historie',
    
    // SearchBar
    'clearSearch': 'Suche löschen',
    'searchFor': 'Suche nach:',

    // Sorting
    'sortBy': 'Sortieren nach',
    'sortByOccupancy': 'Auslastung',
    'sortByDistance': 'Entfernung',
    'sortByHours': 'Öffnungszeit',
    
    // OccupancyChart
    'occupancyLast12Hours': 'Auslastung der letzten 12 Stunden',
    'occupancyLast24Hours': 'Auslastung der letzten 24 Stunden',
    'occupancyLast48Hours': 'Auslastung der letzten 48 Stunden',
    'currentOccupancy': 'Aktuelle Auslastung',
    'normalOccupancy': 'Normale Auslastung',
    
    
    // Export/HTML
    'noData': 'Keine Daten',
    'high': 'Hoch',
    'medium': 'Mittel',
    'low': 'Niedrig',
    
    // MoodBarometer
    'livelyMood': '🔥 Lebendige Stimmung',
    'livelyMoodDesc': 'Die meisten Locations sind gut besucht ({highPercent}% hoch). Perfekt für eine energiegeladene Atmosphäre, aber eventuell längere Wartezeiten.',
    'relaxedMood': '😌 Entspannte Stimmung',
    'relaxedMoodDesc': 'Die meisten Locations sind ruhig ({lowPercent}% niedrig). Ideal für gemütliche Gespräche und entspannte Atmosphäre.',
    'diverseMood': '🎭 Vielfältige Stimmung',
    'diverseMoodDesc': 'Die Auslastung variiert stark ({highPercent}% hoch, {normalPercent}% normal, {lowPercent}% niedrig). Je nach Vorliebe finden Sie sowohl lebendige als auch entspannte Locations.',
    'averageOccupancy': 'Durchschnittliche Auslastung',
    'highCategory': '🔥 Hoch (≥70%)',
    'normalCategory': '⚖️ Normal (30-69%)',
    'lowCategory': '😌 Niedrig (<30%)',
    'moodBarometer': '📊 Stimmungsbarometer',
    'occupancyAnalysis': 'Auslastungsanalyse aller {totalLocations} erfolgreich gescrapten Locations',
    'stronglyVisited': 'Stark besucht',
    'averageVisited': 'Durchschnittlich',
    'lightlyVisited': 'Wenig besucht',
    'balancedMood': '🟡 Ausgeglichene Stimmung',
    'balancedMoodDesc': '{mediumPercent}% der Locations haben normale Auslastung. Eine ausgewogene Mischung aus lebendiger und entspannter Atmosphäre erwartet Sie.',

    'germanInterface': 'Deutsche Benutzeroberfläche',
    'englishInterface': 'English user interface',
    
    // Footer
    'madeWith': 'Made with ❤️ by Martin Pfeffer',
    'imprint': 'Impressum',
    'privacy': 'Datenschutz',
    
    // DefaultLocations
    'pleaseSelectOneLocation': 'Bitte wählen Sie mindestens eine Location aus',
    'loadingDefaultLocations': 'Lade Standard-Locations...',
    'errorLoadingLocations': 'Fehler beim Laden der Locations',
    'tryAgain': 'Erneut versuchen',
    'standardLocations': 'Standard Locations',
    'selectLocationsDescription': 'Wählen Sie die Locations aus, deren Auslastung Sie analysieren möchten',
    'aboutTheAppTitle': 'Über die App',
    'selectAll': 'Alle auswählen',
    'selectNone': 'Keine auswählen',
    'selectedCount': '{count} von {total} ausgewählt',
    'inactive': '(inaktiv)',
    'scrapingRunning': 'Scraping läuft...',
    'startScraping': 'Scraping starten ({count})',

    // ResultsDisplay - Live data indicators
    'containsLiveData': 'Enthält Live-Daten',
    'currentlyOccupied': 'Derzeit zu {percent} % ausgelastet',
    'normalOccupancyIs': 'normal sind {percent} %',
    'resetSortOrder': 'Sortierung zurücksetzen',
    'dragToReorder': 'Ziehen zum Neuordnen',
    'distance': 'Entfernung',
    'allowLocation': 'Standort zulassen für Entfernungsanzeige',
    'locationNotAvailable': 'Standort nicht verfügbar',

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
    'filters': 'Filters (Beta)',
    'themes': 'Themes',
    'language': 'Language',
    'tip': 'Tip',
    
    // Theme names
    'themeDark': 'Dark',
    'themeLight': 'Light',
    'themeNewspaper': 'Newspaper',
    'themeDarkDesc': 'Elegant dark theme',
    'themeLightDesc': 'Modern light theme',
    'themeNewspaperDesc': 'Vintage newspaper design',
    'themeBerlin': 'Berlin',
    'themeBerlinDesc': 'Urban Berlin theme with BVG yellow',
    'themeSelect': 'Select Theme',
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
    
    // Login Form
    'loginTitle': 'Login',
    'loginButton': 'Login',
    'loginInProgress': 'Logging in...',
    'loginFailed': 'Login failed',
    'networkError': 'Network error. Please try again.',
    'usernamePlaceholder': 'Enter your username or email',
    'passwordPlaceholder': 'Enter your password',
    'orContinueWith': 'or continue with',
    'googleLoginFailed': 'Google login failed',
    
    // Register Form
    'registerTitle': 'Create Account',
    'registerButton': 'Create Account',
    'registerInProgress': 'Creating account...',
    'registerFailed': 'Registration failed',
    'passwordMismatch': 'Passwords do not match',
    'passwordTooShort': 'Password must be at least 6 characters long',
    'usernameTooShort': 'Username must be at least 3 characters long',
    'invalidEmail': 'Please enter a valid email address',
    'registrationSuccess': 'Registration successful! Your account is pending activation. You can log in once an administrator activates your account.',
    'usernamePlaceholderRegister': 'Choose a username (min. 3 characters)',
    'emailPlaceholder': 'Enter your email address',
    'passwordPlaceholderRegister': 'Choose a password (min. 6 characters)',
    'confirmPasswordPlaceholder': 'Confirm your password',
    'activationNote': 'New accounts require manual activation by an administrator. You can log in once your account has been activated.',
    'noteLabel': 'Note:',
    
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
    
    // ResultsDisplay
    'scrapingResults': 'Scraping Results',
    'locationsAnalyzed': 'location{count} analyzed',
    'locationsFiltered': 'location{count} filtered',
    'searchLocationsPlaceholder': 'Search locations...',
    'unknownLocation': 'Unknown Location',
    'stars': 'stars',
    'liveOccupancy': 'Live Occupancy:',
    'occupancyData': 'Occupancy Data:',
    'realtimeData': 'Real-time data from Google Maps',
    'noOccupancyData': 'No occupancy data available',
    'errorLabel': 'Error:',
    'openGoogleMaps': 'Open Google Maps',
    'showHistory': 'Show History',
    'closeHistory': 'Close History',
    'noResultsYet': 'No results available yet',
    'noMatchesFound': 'No matches found',
    'tryDifferentSearch': 'Try a different search term',
    'historical': 'Historical',
    'live': 'LIVE',
    
    // AboutDialog
    'aboutApp': 'About the App',
    
    // App.jsx
    'berlinometerSubtitle': 'Find out where the party is in Berlin\'s bars and clubs tonight',
    'resultsFilteredByProfile': 'Results are filtered based on your profile settings',
    'automatedScrapingActive': 'Automated Scraping Active',
    'automatedScrapingDescription': 'Locations are automatically scraped every 20-30 minutes. The latest results are loaded automatically.',
    'aboutTheApp': 'About the App',
    'missingLocation': 'Missing a location?',
    'emailSubjectNewLocation': 'Berlinometer - Suggest New Location',
    'errorLoadingHistory': 'Error loading history',
    
    // SearchBar
    'clearSearch': 'Clear search',
    'searchFor': 'Search for:',

    // Sorting
    'sortBy': 'Sort by',
    'sortByOccupancy': 'Occupancy',
    'sortByDistance': 'Distance',
    'sortByHours': 'Opening hours',
    
    // OccupancyChart
    'occupancyLast12Hours': 'Occupancy of the last 12 hours',
    'occupancyLast24Hours': 'Occupancy of the last 24 hours',
    'occupancyLast48Hours': 'Occupancy of the last 48 hours',
    'currentOccupancy': 'Current Occupancy',
    'normalOccupancy': 'Normal Occupancy',
    
    
    // Export/HTML
    'noData': 'No data',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low',
    
    // MoodBarometer
    'livelyMood': '🔥 Lively Atmosphere',
    'livelyMoodDesc': 'Most locations are well visited ({highPercent}% high). Perfect for an energetic atmosphere, but possibly longer wait times.',
    'relaxedMood': '😌 Relaxed Atmosphere',
    'relaxedMoodDesc': 'Most locations are quiet ({lowPercent}% low). Ideal for cozy conversations and relaxed atmosphere.',
    'diverseMood': '🎭 Diverse Atmosphere',
    'diverseMoodDesc': 'Occupancy varies greatly ({highPercent}% high, {normalPercent}% normal, {lowPercent}% low). Depending on preference, you\'ll find both lively and relaxed locations.',
    'averageOccupancy': 'Average Occupancy',
    'highCategory': '🔥 High (≥70%)',
    'normalCategory': '⚖️ Normal (30-69%)',
    'lowCategory': '😌 Low (<30%)',
    'moodBarometer': '📊 Mood Barometer',
    'occupancyAnalysis': 'Occupancy analysis of all {totalLocations} successfully scraped locations',
    'stronglyVisited': 'Strongly visited',
    'averageVisited': 'Average',
    'lightlyVisited': 'Lightly visited',
    'balancedMood': '🟡 Balanced Atmosphere',
    'balancedMoodDesc': '{mediumPercent}% of locations have normal occupancy. A balanced mix of lively and relaxed atmosphere awaits you.',

    'germanInterface': 'Deutsche Benutzeroberfläche',
    'englishInterface': 'English user interface',
    
    // Footer
    'madeWith': 'Made with ❤️ by Martin Pfeffer',
    'imprint': 'Imprint',
    'privacy': 'Privacy',
    
    // DefaultLocations
    'pleaseSelectOneLocation': 'Please select at least one location',
    'loadingDefaultLocations': 'Loading default locations...',
    'errorLoadingLocations': 'Error loading locations',
    'tryAgain': 'Try again',
    'standardLocations': 'Standard Locations',
    'selectLocationsDescription': 'Select the locations whose occupancy you want to analyze',
    'aboutTheAppTitle': 'About the App',
    'selectAll': 'Select all',
    'selectNone': 'Select none',
    'selectedCount': '{count} of {total} selected',
    'inactive': '(inactive)',
    'scrapingRunning': 'Scraping running...',
    'startScraping': 'Start scraping ({count})',

    // ResultsDisplay - Live data indicators
    'containsLiveData': 'Contains Live Data',
    'currentlyOccupied': 'Currently {percent}% occupied',
    'normalOccupancyIs': 'normal is {percent}%',
    'resetSortOrder': 'Reset Sort Order',
    'dragToReorder': 'Drag to reorder',
    'distance': 'Distance',
    'allowLocation': 'Allow location for distance display',
    'locationNotAvailable': 'Location not available',

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