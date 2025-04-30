import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { fetchEvents, fetchAllEvents } from './services/api';
import { exportAsJSON, exportAsCSV } from './utils/exportUtils';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import EventsContainer from './components/EventsContainer';
import Pagination from './components/Pagination';
import Loader from './components/Loader';
import Message from './components/Message';
import './App.css';

// Material Design Theme mit dem gewünschten Farbschema
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2C2E3B',
    },
    secondary: {
      main: '#3D405B',
    },
    error: {
      main: '#FF4848',
    },
    background: {
      default: '#1A1C26',
      paper: '#262837',
    },
    text: {
      primary: '#E6E6E6',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#262837',
          transition: 'transform 0.3s',
          '&:hover': {
            transform: 'translateY(-5px)',
          },
        },
      },
    },
  },
});

function App() {
  // State Variablen
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [baseUrl, setBaseUrl] = useState('https://de.ra.co/events/de/berlin');
  const [filters, setFilters] = useState({
    date: 'all',
    genre: 'all',
    venue: 'all',
    search: '',
  });

  // Liste der verfügbaren Venues basierend auf den Events
  const [venues, setVenues] = useState([]);

  // Zeige Nachricht für 5 Sekunden
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 5000);
  };

  // Events filtern basierend auf den ausgewählten Filtern
  useEffect(() => {
    if (allEvents.length === 0) return;

    let filtered = [...allEvents];

    // Datumsfilter
    if (filters.date !== 'all') {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      switch (filters.date) {
        case 'today':
          filtered = filtered.filter((event) => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === today.toDateString();
          });
          break;
        case 'tomorrow':
          filtered = filtered.filter((event) => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === tomorrow.toDateString();
          });
          break;
        case 'weekend':
          // Freitag bis Sonntag
          filtered = filtered.filter((event) => {
            const eventDate = new Date(event.date);
            const day = eventDate.getDay();
            return day >= 5 || day === 0; // Freitag, Samstag oder Sonntag
          });
          break;
        case 'week':
          // Nächste 7 Tage
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);

          filtered = filtered.filter((event) => {
            const eventDate = new Date(event.date);
            return eventDate >= today && eventDate <= nextWeek;
          });
          break;
        default:
          break;
      }
    }

    // Genre-Filter
    if (filters.genre !== 'all') {
      filtered = filtered.filter(
        (event) => event.genre && event.genre.includes(filters.genre)
      );
    }

    // Venue-Filter
    if (filters.venue !== 'all') {
      filtered = filtered.filter((event) => event.venue === filters.venue);
    }

    // Suchfilter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter((event) => {
        return (
          event.title.toLowerCase().includes(searchTerm) ||
          event.venue.toLowerCase().includes(searchTerm) ||
          (event.artists &&
            event.artists.some((artist) =>
              artist.toLowerCase().includes(searchTerm)
            ))
        );
      });
    }

    setFilteredEvents(filtered);
  }, [allEvents, filters]);

  // Liste der Venues aktualisieren
  useEffect(() => {
    if (allEvents.length === 0) return;
    const uniqueVenues = [...new Set(allEvents.map((event) => event.venue))];
    setVenues(uniqueVenues);
  }, [allEvents]);

  // Event-Handler

  // Events neu laden (erste Seite)
  const handleResetAndFetchEvents = async () => {
    setAllEvents([]);
    setCurrentPage(1);
    setHasMorePages(true);

    try {
      setIsLoading(true);
      const newEvents = await fetchEvents(baseUrl, 1);

      if (newEvents.length < 10) {
        setHasMorePages(false);
      }

      setAllEvents(newEvents);
      showMessage(`${newEvents.length} Events geladen (Seite 1)`, 'success');
    } catch (error) {
      console.error(error);
      showMessage(`Fehler beim Laden der Events: ${error.message}`, 'error');
      setHasMorePages(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Nächste Seite laden
  const handleLoadNextPage = async () => {
    if (isLoading || !hasMorePages) return;

    const nextPage = currentPage + 1;

    try {
      setIsLoading(true);
      const newEvents = await fetchEvents(baseUrl, nextPage);

      if (newEvents.length < 10) {
        setHasMorePages(false);
      }

      setAllEvents([...allEvents, ...newEvents]);
      setCurrentPage(nextPage);
      showMessage(`${newEvents.length} weitere Events geladen (Seite ${nextPage})`, 'success');
    } catch (error) {
      console.error(error);
      showMessage(`Fehler beim Laden der Events: ${error.message}`, 'error');
      setHasMorePages(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Bestimmte Seite laden
  const handlePageChange = async (page) => {
    if (page === currentPage) return;

    try {
      setIsLoading(true);
      setAllEvents([]);
      const newEvents = await fetchEvents(baseUrl, page);

      setAllEvents(newEvents);
      setCurrentPage(page);
      showMessage(`Events für Seite ${page} geladen`, 'success');
    } catch (error) {
      console.error(error);
      showMessage(`Fehler beim Laden der Events: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Alle Seiten laden
  const handleLoadAllEvents = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      showMessage('Lade alle Events...', 'success');

      const events = await fetchAllEvents(baseUrl);

      setAllEvents(events);
      setHasMorePages(false);
      showMessage(`Alle Events geladen: ${events.length} Events`, 'success');
    } catch (error) {
      console.error(error);
      showMessage(`Fehler beim Laden aller Events: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter ändern
  const handleFilterChange = (filterName, value) => {
    setFilters({
      ...filters,
      [filterName]: value,
    });
  };

  // URL ändern
  const handleBaseUrlChange = (newUrl) => {
    setBaseUrl(newUrl);
  };

  // Export-Funktionen
  const handleExportJSON = () => {
    if (allEvents.length === 0) {
      showMessage('Keine Events zum Exportieren', 'error');
      return;
    }

    exportAsJSON(allEvents);
    showMessage('Events als JSON exportiert', 'success');
  };

  const handleExportCSV = () => {
    if (allEvents.length === 0) {
      showMessage('Keine Events zum Exportieren', 'error');
      return;
    }

    exportAsCSV(allEvents);
    showMessage('Events als CSV exportiert', 'success');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Header baseUrl={baseUrl} onBaseUrlChange={handleBaseUrlChange} />

        {message.text && <Message text={message.text} type={message.type} />}

        <FilterBar
          filters={filters}
          venues={venues}
          onFilterChange={handleFilterChange}
          onFetchEvents={handleResetAndFetchEvents}
          onLoadAllEvents={handleLoadAllEvents}
        />

        <Box sx={{
          bgcolor: 'background.paper',
          borderRadius: 1,
          p: 2,
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>{allEvents.length} Events geladen</span>
          <span>Seite {currentPage}</span>
        </Box>

        {isLoading && <Loader />}

        <EventsContainer events={filteredEvents.length ? filteredEvents : allEvents} />

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="contained"
            color="secondary"
            disabled={isLoading || !hasMorePages}
            onClick={handleLoadNextPage}
            sx={{ mb: 3 }}
          >
            {hasMorePages ? 'Weitere Events laden' : 'Keine weiteren Events'}
          </Button>
        </Box>

        <Pagination
          currentPage={currentPage}
          hasMorePages={hasMorePages}
          onPageChange={handlePageChange}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
          <Button variant="contained" color="secondary" onClick={handleExportJSON}>
            Als JSON exportieren
          </Button>
          <Button variant="contained" color="secondary" onClick={handleExportCSV}>
            Als CSV exportieren
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
