#!/bin/bash
# Skript zum Erstellen der Projektstruktur für den RA Events Crawler (React Version)
# Erstellt die komplette Verzeichnisstruktur und alle Dateien in einem Verzeichnis "event-crawler"

# Farben für die Ausgabe
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== RA Events Crawler Setup-Skript =====${NC}"
echo -e "${BLUE}Dieses Skript erstellt die Projektstruktur in einem Verzeichnis 'event-crawler'${NC}"
echo ""

# Prüfen, ob das Zielverzeichnis bereits existiert
if [ -d "event-crawler" ]; then
  echo -e "${RED}ERROR: Das Verzeichnis 'event-crawler' existiert bereits.${NC}"
  echo -e "Bitte lösche es oder wähle ein anderes Verzeichnis."
  exit 1
fi

# Hauptverzeichnis erstellen
echo -e "${BLUE}1. Erstelle Hauptverzeichnis 'event-crawler'...${NC}"
mkdir -p event-crawler
cd event-crawler

# Backend-Struktur erstellen
echo -e "${BLUE}2. Erstelle Backend-Struktur...${NC}"
mkdir -p backend
cd backend

# package.json für Backend erstellen
echo -e "${YELLOW}   Erstelle package.json für Backend...${NC}"
cat > package.json << 'EOF'
{
  "name": "ra-events-crawler-backend",
  "version": "1.0.0",
  "description": "Backend-Server für den RA Events Crawler",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": [
    "crawler",
    "events",
    "resident advisor",
    "berlin",
    "backend"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12",
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

# server.js erstellen
echo -e "${YELLOW}   Erstelle server.js...${NC}"
cat > server.js << 'EOF'
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5022;

// CORS und JSON Middleware
app.use(cors());
app.use(express.json());

// API-Endpunkt zum Abrufen von RA-Events
app.get('/api/events', async (req, res) => {
    try {
        const page = req.query.page || 1;
        const baseUrl = req.query.url || 'https://de.ra.co/events/de/berlin';

        // Sicherstellen, dass die URL nicht mit ? oder & endet
        const cleanBaseUrl = baseUrl.replace(/[?&]$/, '');

        // Prüfen, ob die URL bereits einen Query-Parameter hat
        const separator = cleanBaseUrl.includes('?') ? '&' : '?';

        // Vollständige URL mit Seitennummer
        const url = `${cleanBaseUrl}${separator}page=${page}`;

        console.log(`Crawling ${url}...`);

        // Request mit Headers, die einen Browser simulieren
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
                'Referer': 'https://de.ra.co'
            }
        });

        // HTML-Parsing mit Cheerio
        const $ = cheerio.load(response.data);
        const events = [];

        // Event-Karten extrahieren
        $('[data-testid="event-listing"] [data-testid="event-listing-column"]').each((index, element) => {
            try {
                const $element = $(element);

                // Links und ID extrahieren
                let eventUrl = '';
                let eventId = '';

                $element.find('a').each((i, link) => {
                    const href = $(link).attr('href');
                    if (href && href.includes('/events/')) {
                        eventUrl = 'https://de.ra.co' + href;
                        eventId = href.split('/').pop();
                    }
                });

                // Titel, Datum, Venue extrahieren
                const title = $element.find('h3').text().trim();
                const dateElement = $element.find('time');
                const date = dateElement.attr('datetime') || '';
                const venue = $element.find('[data-testid="venue"]').text().trim();

                // Extrahiere die Anzahl der Interessierten
                const metaElement = $element.find('[data-testid="meta"]');
                const interestedText = metaElement.text().trim();
                const interestedCount = interestedText.match(/(\d+)/) ? parseInt(interestedText.match(/(\d+)/)[1]) : 0;

                // Genre aus Tags ermitteln
                const genreTags = [];
                $element.find('[data-testid="tag"]').each((i, tag) => {
                    genreTags.push($(tag).text().toLowerCase());
                });

                // Nur gültige Events hinzufügen
                if (eventId && title && venue) {
                    events.push({
                        id: eventId,
                        title,
                        date,
                        venue,
                        interestedCount,
                        url: eventUrl,
                        genre: genreTags,
                        artists: [] // Würde separate Anfragen erfordern
                    });
                }
            } catch (err) {
                console.error(`Fehler beim Parsen des Events ${index}:`, err);
            }
        });

        res.json({
            page: parseInt(page),
            count: events.length,
            events
        });
    } catch (error) {
        console.error('Fehler beim Crawlen:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen der Events',
            message: error.message
        });
    }
});

// Event-Details API-Endpunkt
app.get('/api/events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const url = `https://de.ra.co/events/${eventId}`;

        console.log(`Crawling event details for ${eventId}...`);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
                'Referer': 'https://de.ra.co'
            }
        });

        const $ = cheerio.load(response.data);

        // Line-up (Künstler) extrahieren
        const artists = [];
        $('[data-testid="event-detail-artists"] [data-testid="link"]').each((i, element) => {
            artists.push($(element).text().trim());
        });

        // Zeiten extrahieren
        const timeElement = $('[data-testid="event-detail-time"]');
        let startTime = '';
        let endTime = '';

        if (timeElement.length) {
            const timeText = timeElement.text();
            const timeMatch = timeText.match(/(\d{2}:\d{2}).*?(\d{2}:\d{2})/);

            if (timeMatch) {
                startTime = timeMatch[1];
                endTime = timeMatch[2];
            }
        }

        // Genres extrahieren
        const genres = [];
        $('[data-testid="event-detail-tag"]').each((i, element) => {
            genres.push($(element).text().toLowerCase());
        });

        // Beschreibung extrahieren
        const description = $('[data-testid="event-detail-description"]').text().trim();

        res.json({
            id: eventId,
            artists,
            startTime,
            endTime,
            genres,
            description
        });
    } catch (error) {
        console.error(`Fehler beim Abrufen der Event-Details für ${req.params.id}:`, error);
        res.status(500).json({
            error: 'Fehler beim Abrufen der Event-Details',
            message: error.message
        });
    }
});

// Server starten
app.listen(PORT, () => {
    console.log(`Backend-Server läuft auf http://localhost:${PORT}`);
    console.log(`API-Endpunkte:`);
    console.log(`  - GET /api/events?url=URL&page=PAGE`);
    console.log(`  - GET /api/events/:id`);
});
EOF

# README.md für Backend erstellen
echo -e "${YELLOW}   Erstelle README.md für Backend...${NC}"
cat > README.md << 'EOF'
# RA Events Crawler - Backend

Backend-Server für den RA Events Crawler. Dient als Proxy für Anfragen an Resident Advisor und umgeht CORS-Beschränkungen.

## Installation

```bash
npm install
```

## Starten

```bash
npm start
```

Der Server läuft dann auf http://localhost:5022

## API-Endpunkte

- `GET /api/events?url=URL&page=PAGE` - Holt Events von einer bestimmten Seite
- `GET /api/events/:id` - Holt Details zu einem bestimmten Event
EOF

# Zurück zum Hauptverzeichnis
cd ..

# Frontend-Struktur erstellen
echo -e "${BLUE}3. Erstelle Frontend-Struktur...${NC}"
mkdir -p frontend
cd frontend

# package.json für Frontend erstellen
echo -e "${YELLOW}   Erstelle package.json für Frontend...${NC}"
cat > package.json << 'EOF'
{
  "name": "ra-events-crawler-react",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.11.16",
    "@mui/material": "^5.13.0",
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:5022"
}
EOF

# Struktur für src erstellen
mkdir -p src/components src/services src/utils public

# public/index.html erstellen
echo -e "${YELLOW}   Erstelle public/index.html...${NC}"
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#2C2E3B" />
    <meta
      name="description"
      content="RA Events Berlin Crawler - Extrahiere Events von Resident Advisor"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>RA Events Crawler</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
  </head>
  <body>
    <noscript>Du musst JavaScript aktivieren, um diese App nutzen zu können.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# public/manifest.json erstellen
echo -e "${YELLOW}   Erstelle public/manifest.json...${NC}"
cat > public/manifest.json << 'EOF'
{
  "short_name": "RA Crawler",
  "name": "RA Events Crawler",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#2C2E3B",
  "background_color": "#1A1C26"
}
EOF

# src/index.js erstellen
echo -e "${YELLOW}   Erstelle src/index.js...${NC}"
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# src/index.css erstellen
echo -e "${YELLOW}   Erstelle src/index.css...${NC}"
cat > src/index.css << 'EOF'
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #1A1C26;
  color: #E6E6E6;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

/* Scrollbar Styling für Chrome, Edge und Safari */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #2C2E3B;
}

::-webkit-scrollbar-thumb {
  background-color: #3D405B;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #FF4848;
}
EOF

# src/App.js erstellen
echo -e "${YELLOW}   Erstelle src/App.js...${NC}"
cat > src/App.js << 'EOF'
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
EOF

# src/App.css erstellen
echo -e "${YELLOW}   Erstelle src/App.css...${NC}"
cat > src/App.css << 'EOF'
/* Diese Datei enthält ergänzende Styles zur Material UI Theme */

.loader {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

/* Animation für die Karten */
.event-card {
  transition: transform 0.3s, box-shadow 0.3s;
}

.event-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.event-date {
  font-weight: bold;
  margin-bottom: 5px;
}

.event-title {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 10px;
}

.event-venue {
  font-style: italic;
  margin-bottom: 10px;
}

.event-interested {
  background-color: rgba(255, 72, 72, 0.2);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: inline-block;
}

.search-input {
  flex-grow: 1;
}

/* Message-Animation */
.message-enter {
  opacity: 0;
  transform: translateY(-20px);
}

.message-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms, transform 300ms;
}

.message-exit {
  opacity: 1;
}

.message-exit-active {
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 300ms, transform 300ms;
}

/* Responsive Layout */
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
  }

  .filter-bar > * {
    margin-bottom: 10px;
    width: 100%;
  }

  .pagination {
    flex-wrap: wrap;
  }

  .events-grid {
    grid-template-columns: 1fr !important;
  }
}
EOF

# Komponenten erstellen
echo -e "${YELLOW}   Erstelle React-Komponenten...${NC}"

# Header.js
cat > src/components/Header.js << 'EOF'
import React from 'react';
import { Box, Typography, TextField, InputLabel, Paper } from '@mui/material';

const Header = ({ baseUrl, onBaseUrlChange }) => {
  return (
    <Paper
      component="header"
      sx={{
        bgcolor: 'primary.main',
        p: 3,
        borderRadius: 1,
        mb: 3,
        boxShadow: 3
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        RA Events Berlin Crawler
      </Typography>

      <Typography variant="body1" gutterBottom>
        Extrahiere Events von Resident Advisor Berlin
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mt: 2,
          flexWrap: { xs: 'wrap', sm: 'nowrap' }
        }}
      >
        <InputLabel htmlFor="baseUrlInput" sx={{ color: 'text.primary', minWidth: { xs: '100%', sm: '80px' } }}>
          Basis-URL:
        </InputLabel>

        <TextField
          id="baseUrlInput"
          fullWidth
          variant="outlined"
          size="small"
          value={baseUrl}
          onChange={(e) => onBaseUrlChange(e.target.value)}
          placeholder="https://de.ra.co/events/de/berlin"
          sx={{
            bgcolor: 'secondary.main',
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'primary.light',
              }
            }
          }}
        />
      </Box>
    </Paper>
  );
};

export default Header;
EOF

# FilterBar.js
cat > src/components/FilterBar.js << 'EOF'
import React from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';

const FilterBar = ({ filters, venues, onFilterChange, onFetchEvents, onLoadAllEvents }) => {
  return (
    <Box
      className="filter-bar"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3,
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <FormControl sx={{ minWidth: 140 }} size="small">
        <InputLabel id="date-filter-label">Datum</InputLabel>
        <Select
          labelId="date-filter-label"
          id="date-filter"
          value={filters.date}
          label="Datum"
          onChange={(e) => onFilterChange('date', e.target.value)}
          sx={{ bgcolor: 'secondary.main' }}
        >
          <MenuItem value="all">Alle Daten</MenuItem>
          <MenuItem value="today">Heute</MenuItem>
          <MenuItem value="tomorrow">Morgen</MenuItem>
          <MenuItem value="weekend">Dieses Wochenende</MenuItem>
          <MenuItem value="week">Diese Woche</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 140 }} size="small">
        <InputLabel id="genre-filter-label">Genre</InputLabel>
        <Select
          labelId="genre-filter-label"
          id="genre-filter"
          value={filters.genre}
          label="Genre"
          onChange={(e) => onFilterChange('genre', e.target.value)}
          sx={{ bgcolor: 'secondary.main' }}
        >
          <MenuItem value="all">Alle Genres</MenuItem>
          <MenuItem value="techno">Techno</MenuItem>
          <MenuItem value="house">House</MenuItem>
          <MenuItem value="electro">Electro</MenuItem>
          <MenuItem value="disco">Disco</MenuItem>
          <MenuItem value="ambient">Ambient</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 140 }} size="small">
        <InputLabel id="venue-filter-label">Venue</InputLabel>
        <Select
          labelId="venue-filter-label"
          id="venue-filter"
          value={filters.venue}
          label="Venue"
          onChange={(e) => onFilterChange('venue', e.target.value)}
          sx={{ bgcolor: 'secondary.main' }}
        >
          <MenuItem value="all">Alle Venues</MenuItem>
          {venues.map((venue) => (
            <MenuItem key={venue} value={venue}>
              {venue}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        variant="outlined"
        size="small"
        placeholder="Suche nach Events, Künstlern..."
        value={filters.search}
        onChange={(e) => onFilterChange('search', e.target.value)}
        sx={{
          flexGrow: 1,
          minWidth: { xs: '100%', sm: '200px' },
          bgcolor: 'secondary.main'
        }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
        }}
      />

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="error"
          onClick={onFetchEvents}
          startIcon={<RefreshIcon />}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Events laden
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={onLoadAllEvents}
          startIcon={<AllInclusiveIcon />}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Alles laden
        </Button>
      </Box>
    </Box>
  );
};

export default FilterBar;
EOF

# EventsContainer.js
cat > src/components/EventsContainer.js << 'EOF'
import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import EventCard from './EventCard';

const EventsContainer = ({ events }) => {
  if (events.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Typography variant="body1">
          Keine Events gefunden, die den Filterkriterien entsprechen.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3} className="events-grid">
      {events.map((event) => (
        <Grid item xs={12} sm={6} md={4} key={event.id}>
          <EventCard event={event} />
        </Grid>
      ))}
    </Grid>
  );
};

export default EventsContainer;
EOF

# EventCard.js
cat > src/components/EventCard.js << 'EOF'
import React from 'react';
import { Card, CardContent, Typography, Box, Link, Chip } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HeadsetIcon from '@mui/icons-material/Headset';

const EventCard = ({ event }) => {
  // Datum formatieren
  const formatDate = (dateString) => {
    const eventDate = new Date(dateString);
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return eventDate.toLocaleDateString('de-DE', options);
  };

  // Zeitinfo formatieren
  const formatTimeInfo = () => {
    let timeInfo = '';
    if (event.startTime) {
      timeInfo = `, ${event.startTime}`;
      if (event.endTime) {
        timeInfo += ` - ${event.endTime}`;
      }
      if (event.endDate) {
        const endDate = new Date(event.endDate);
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        timeInfo += ` (bis ${endDate.toLocaleDateString('de-DE', options)})`;
      }
    }
    return timeInfo;
  };

  return (
    <Card
      className="event-card"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          variant="subtitle1"
          component="div"
          color="error.main"
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'bold',
            mb: 1
          }}
        >
          <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
          {formatDate(event.date)}
          {formatTimeInfo()}
        </Typography>

        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 'bold',
            mb: 2,
            lineHeight: 1.3,
            height: '3.9em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {event.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontStyle: 'italic',
            mb: 2,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <LocationOnIcon fontSize="small" sx={{ mr: 1 }} />
          {event.venue}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
          <Chip
            label={`${event.interestedCount} Interessierte`}
            size="small"
            sx={{
              bgcolor: 'rgba(255, 72, 72, 0.1)',
              color: 'error.light',
              borderRadius: 1
            }}
          />
        </Box>

        {event.artists && event.artists.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <HeadsetIcon fontSize="small" sx={{ mr: 1, mt: 0.5 }} />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {event.artists.join(', ')}
            </Typography>
          </Box>
        )}

        {event.genre && event.genre.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            <MusicNoteIcon fontSize="small" sx={{ mr: 0.5 }} />
            {event.genre.map((genre) => (
              <Chip
                key={genre}
                label={genre}
                size="small"
                sx={{ bgcolor: 'secondary.main', fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        )}
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Link
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: 'block',
            textAlign: 'center',
            bgcolor: 'secondary.main',
            color: 'text.primary',
            textDecoration: 'none',
            p: 1,
            borderRadius: 1,
            transition: 'background-color 0.3s',
            '&:hover': {
              bgcolor: 'error.main',
            },
          }}
        >
          Auf RA ansehen
        </Link>
      </Box>
    </Card>
  );
};

export default EventCard;
EOF

# Loader.js
cat > src/components/Loader.js << 'EOF'
import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const Loader = () => {
  return (
    <Box className="loader" sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
      <CircularProgress color="error" />
    </Box>
  );
};

export default Loader;
EOF

# Message.js
cat > src/components/Message.js << 'EOF'
import React from 'react';
import { Alert } from '@mui/material';

const Message = ({ text, type }) => {
  if (!text) return null;

  return (
    <Alert
      severity={type === 'success' ? 'success' : 'error'}
      sx={{
        mb: 3,
        bgcolor: type === 'success' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)',
        color: type === 'success' ? '#2ecc71' : '#e74c3c'
      }}
    >
      {text}
    </Alert>
  );
};

export default Message;
EOF

# Pagination.js
cat > src/components/Pagination.js << 'EOF'
import React from 'react';
import { Box, Button } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const Pagination = ({ currentPage, hasMorePages, onPageChange }) => {
  const maxVisiblePages = 5;
  const totalPages = Math.max(currentPage, 5); // Mindestens 5 Seiten anzeigen

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Array mit allen anzuzeigenden Seitenzahlen erstellen
  const pages = [];

  // Erste Seite
  if (startPage > 1) {
    pages.push({ label: '1', page: 1 });
    if (startPage > 2) {
      pages.push({ label: '...', page: null, disabled: true });
    }
  }

  // Mittlere Seiten
  for (let i = startPage; i <= endPage; i++) {
    pages.push({ label: i.toString(), page: i, active: i === currentPage });
  }

  // Letzte Seite
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push({ label: '...', page: null, disabled: true });
    }
    pages.push({ label: totalPages.toString(), page: totalPages });
  }

  // "Weiter"-Button
  if (hasMorePages) {
    pages.push({ label: <NavigateNextIcon />, page: currentPage + 1, isNext: true });
  }

  return (
    <Box
      className="pagination"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 1,
        mt: 3
      }}
    >
      {pages.map((item, index) => (
        <Button
          key={`page-${index}`}
          variant={item.active ? 'contained' : 'outlined'}
          color={item.active ? 'error' : 'secondary'}
          disabled={item.disabled || (item.isNext && !hasMorePages)}
          onClick={() => item.page && onPageChange(item.page)}
          sx={{
            minWidth: 40,
            height: 40,
            p: 0
          }}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );
};

export default Pagination;
EOF

# Services und Utils erstellen
echo -e "${YELLOW}   Erstelle Services und Utils...${NC}"

# API-Service
cat > src/services/api.js << 'EOF'
import axios from 'axios';

/**
 * Holt Events für eine bestimmte Seite
 * @param {string} baseUrl - Die Basis-URL für die Events
 * @param {number} page - Die aktuelle Seitennummer
 * @returns {Promise<Array>} - Array mit Events
 */
export const fetchEvents = async (baseUrl, page = 1) => {
  try {
    // Da wir einen Proxy verwenden, rufen wir unseren eigenen Backend-Server auf
    const response = await axios.get(`/api/events`, {
      params: {
        url: baseUrl,
        page
      }
    });

    // Rückgabe der Events aus der API-Antwort
    return response.data.events || [];
  } catch (error) {
    console.error('Fehler beim Abrufen der Events:', error);

    // In einer Entwicklungsumgebung simulieren wir Daten
    if (process.env.NODE_ENV === 'development') {
      console.log('Verwende simulierte Daten für die Entwicklung');
      return simulateEvents(baseUrl, page);
    }

    throw error;
  }
};

/**
 * Holt alle verfügbaren Events von allen Seiten
 * @param {string} baseUrl - Die Basis-URL für die Events
 * @returns {Promise<Array>} - Array mit allen Events
 */
export const fetchAllEvents = async (baseUrl) => {
  try {
    let allEvents = [];
    let currentPage = 1;
    let hasMorePages = true;
    const maxPages = 20; // Maximale Anzahl an Seiten, um Endlosschleifen zu vermeiden

    // Events von jeder Seite laden, bis keine mehr verfügbar sind
    while (hasMorePages && currentPage <= maxPages) {
      const newEvents = await fetchEvents(baseUrl, currentPage);

      if (newEvents.length === 0 || newEvents.length < 10) {
        hasMorePages = false;
      }

      allEvents = [...allEvents, ...newEvents];
      currentPage++;
    }

    return allEvents;
  } catch (error) {
    console.error('Fehler beim Abrufen aller Events:', error);
    throw error;
  }
};

/**
 * Holt Details für ein bestimmtes Event
 * @param {string} eventId - Die ID des Events
 * @returns {Promise<Object>} - Detailinformationen zum Event
 */
export const fetchEventDetails = async (eventId) => {
  try {
    const response = await axios.get(`/api/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Abrufen der Event-Details für ${eventId}:`, error);
    throw error;
  }
};

/**
 * Simulation von Events für die Entwicklung
 * @param {string} baseUrl - Die Basis-URL für die Events
 * @param {number} page - Die aktuelle Seitennummer
 * @returns {Array} - Array mit simulierten Events
 */
const simulateEvents = (baseUrl, page) => {
  const cleanBaseUrl = baseUrl.replace(/[?&]$/, '');
  console.log(`Simuliere Events für ${cleanBaseUrl}, Seite ${page}`);

  // Basis-Events, die immer zurückgegeben werden
  const events = [
    {
      id: `sim-${page}-1`,
      title: `Simuliertes Event ${page}-1 von ${cleanBaseUrl}`,
      date: new Date(Date.now() + 86400000 * page).toISOString().split('T')[0],
      venue: 'Berghain',
      interestedCount: Math.floor(1000 / page),
      url: `https://de.ra.co/events/sim-${page}-1`,
      genre: ['techno', 'electro'],
      artists: ['DJ Simuliert', 'Fake Artist', 'Test DJ']
    },
    {
      id: `sim-${page}-2`,
      title: `Simuliertes Event ${page}-2 von ${cleanBaseUrl}`,
      date: new Date(Date.now() + 86400000 * (page + 1)).toISOString().split('T')[0],
      venue: 'Watergate',
      interestedCount: Math.floor(800 / page),
      url: `https://de.ra.co/events/sim-${page}-2`,
      genre: ['house', 'disco'],
      artists: ['House Master', 'Deep Producer']
    }
  ];

  // Mehr simulierte Events für Seiten 1-4
  if (page < 5) {
    for (let i = 3; i <= 10; i++) {
      events.push({
        id: `sim-${page}-${i}`,
        title: `Simuliertes Event ${page}-${i} von ${cleanBaseUrl}`,
        date: new Date(Date.now() + 86400000 * (page + i - 1)).toISOString().split('T')[0],
        venue: i % 2 === 0 ? 'RSO.Berlin' : '://about blank',
        interestedCount: Math.floor((1200 - i * 100) / page),
        url: `https://de.ra.co/events/sim-${page}-${i}`,
        genre: i % 2 === 0 ? ['techno'] : ['house', 'ambient'],
        artists: i % 2 === 0 ?
          ['Techno Producer', 'Hard Beats'] :
          ['Ambient Master', 'Chill Vibes', 'Deep Sound']
      });
    }
  }
  // Bei Seite 5 nur weniger Events zurückgeben, um das Ende zu simulieren
  else if (page === 5) {
    events.push({
      id: `sim-${page}-3`,
      title: `Letztes Event ${page}-3 von ${cleanBaseUrl}`,
      date: new Date(Date.now() + 86400000 * (page + 2)).toISOString().split('T')[0],
      venue: 'Tresor',
      interestedCount: Math.floor(500 / page),
      url: `https://de.ra.co/events/sim-${page}-3`,
      genre: ['techno', 'industrial'],
      artists: ['Final DJ', 'Last One']
    });
  }
  // Ab Seite 6 keine Events mehr zurückgeben
  else {
    return [];
  }

  return events;
};
EOF

# Export Utils
cat > src/utils/exportUtils.js << 'EOF'
/**
 * Exportiert die Events als JSON-Datei
 * @param {Array} events - Array mit Event-Objekten
 */
export const exportAsJSON = (events) => {
  if (!events || events.length === 0) return;

  // JSON formatieren
  const json = JSON.stringify(events, null, 2);

  // Blob erstellen und Download initiieren
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  downloadFile(url, `ra_events_berlin_${getCurrentDate()}.json`);
};

/**
 * Exportiert die Events als CSV-Datei
 * @param {Array} events - Array mit Event-Objekten
 */
export const exportAsCSV = (events) => {
  if (!events || events.length === 0) return;

  // CSV-Header
  let csv = 'ID,Titel,Datum,Venue,Interessierte,URL,Genres,Startzeit,Endzeit,Künstler\n';

  // Daten zeilenweise hinzufügen
  events.forEach(event => {
    const row = [
      event.id,
      `"${event.title.replace(/"/g, '""')}"`, // Anführungszeichen escapen
      event.date,
      `"${event.venue.replace(/"/g, '""')}"`,
      event.interestedCount,
      event.url,
      event.genre ? `"${event.genre.join(', ')}"` : '',
      event.startTime || '',
      event.endTime || '',
      event.artists ? `"${event.artists.join(', ')}"` : ''
    ];

    csv += row.join(',') + '\n';
  });

  // Blob erstellen und Download initiieren
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  downloadFile(url, `ra_events_berlin_${getCurrentDate()}.csv`);
};

/**
 * Initiiert den Download einer Datei
 * @param {string} url - Die URL zum Blob
 * @param {string} filename - Der Dateiname
 */
const downloadFile = (url, filename) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Gibt das aktuelle Datum im Format YYYY-MM-DD zurück
 * @returns {string} - Das formatierte Datum
 */
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};
EOF

# Event Utils
cat > src/utils/eventUtils.js << 'EOF'
/**
 * Parst ein Datum im RA-Format
 * @param {string} dateString - Das zu parsende Datum (z.B. "Thu, 1 May")
 * @returns {string} - Das formatierte Datum im Format YYYY-MM-DD oder null bei Fehler
 */
export const parseRADate = (dateString) => {
  if (!dateString) return null;

  try {
    // Aktuelles Jahr verwenden
    const year = new Date().getFullYear();

    // Wochentag entfernen, falls vorhanden
    const datePart = dateString.includes(',') ? dateString.split(',')[1].trim() : dateString.trim();

    // Mit aktuellem Jahr parsen
    const parsedDate = new Date(`${datePart} ${year}`);

    // ISO-String zurückgeben (YYYY-MM-DD)
    return parsedDate.toISOString().split('T')[0];
  } catch (error) {
    console.error('Fehler beim Parsen des Datums:', error);
    return null;
  }
};

/**
 * Formatiert ein Datum für die Anzeige
 * @param {string} dateString - Das zu formatierende Datum im Format YYYY-MM-DD
 * @returns {string} - Das formatierte Datum für die Anzeige
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Fehler beim Formatieren des Datums:', error);
    return dateString;
  }
};

/**
 * Filtert Events basierend auf verschiedenen Kriterien
 * @param {Array} events - Die zu filternden Events
 * @param {Object} filters - Die anzuwendenden Filter
 * @returns {Array} - Die gefilterten Events
 */
export const filterEvents = (events, filters) => {
  if (!events || events.length === 0) return [];

  let filteredEvents = [...events];

  // Datumsfilter anwenden
  if (filters.date !== 'all') {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (filters.date) {
      case 'today':
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.toDateString() === today.toDateString();
        });
        break;
      case 'tomorrow':
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.toDateString() === tomorrow.toDateString();
        });
        break;
      case 'weekend':
        // Freitag bis Sonntag
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          const day = eventDate.getDay();
          return day >= 5 || day === 0; // Freitag, Samstag oder Sonntag
        });
        break;
      case 'week':
        // Nächste 7 Tage
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= today && eventDate <= nextWeek;
        });
        break;
      default:
        break;
    }
  }

  // Genre-Filter anwenden
  if (filters.genre !== 'all') {
    filteredEvents = filteredEvents.filter(event =>
      event.genre && event.genre.includes(filters.genre)
    );
  }

  // Venue-Filter anwenden
  if (filters.venue !== 'all') {
    filteredEvents = filteredEvents.filter(event =>
      event.venue === filters.venue
    );
  }

  // Suchfilter anwenden
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredEvents = filteredEvents.filter(event => {
      return (
        event.title.toLowerCase().includes(searchTerm) ||
        event.venue.toLowerCase().includes(searchTerm) ||
        (event.artists && event.artists.some(artist =>
          artist.toLowerCase().includes(searchTerm)
        ))
      );
    });
  }

  return filteredEvents;
};

/**
 * Extrahiert eindeutige Venues aus einer Event-Liste
 * @param {Array} events - Die Event-Liste
 * @returns {Array} - Eindeutige Venues
 */
export const extractUniqueVenues = (events) => {
  if (!events || events.length === 0) return [];

  const venues = new Set();

  events.forEach(event => {
    if (event.venue) {
      venues.add(event.venue);
    }
  });

  return Array.from(venues).sort();
};
EOF

# README für Frontend
cat > README.md << 'EOF'
# RA Events Crawler - React Frontend

Frontend für den RA Events Crawler mit React und Material UI. Bietet eine moderne Benutzeroberfläche zum Anzeigen, Filtern und Exportieren von Events.

## Installation

```bash
npm install
```

## Starten

```bash
npm start
```

Die App läuft dann auf http://localhost:3000 und kommuniziert mit dem Backend-Server auf Port 5022.

## Features

- Responsive Design mit Material UI
- Filtermöglichkeiten nach Datum, Genre und Venue
- Export als JSON oder CSV
- Anpassbare Basis-URL für verschiedene RA-Regionen
EOF

# Zurück zum Hauptverzeichnis
cd ../..

# README für das Hauptverzeichnis erstellen
echo -e "${BLUE}4. Erstelle README.md im Hauptverzeichnis...${NC}"
cat > README.md << 'EOF'
# RA Events Crawler

Ein moderner Web-Crawler für Resident Advisor Events, entwickelt mit React, Material UI und Node.js/Express.

## Struktur

Das Projekt besteht aus zwei Hauptteilen:

- **Backend**: Ein Node.js/Express-Server, der als Proxy fungiert und Events von Resident Advisor crawlt.
- **Frontend**: Eine React-Anwendung mit Material UI für die Benutzeroberfläche.

## Installation und Start

### Voraussetzungen

- Node.js (v14 oder höher)
- npm (v6 oder höher)

### Backend

```bash
cd backend
npm install
npm start
```

Der Backend-Server läuft dann auf http://localhost:5022

### Frontend

```bash
cd frontend
npm install
npm start
```

Die React-App läuft dann auf http://localhost:3000

## Features

- Crawlt Events von Resident Advisor Berlin und anderen Städten
- Filtert Events nach Datum, Genre und Venue
- Unterstützt Pagination und "Alles laden" Funktion
- Exportiert Daten als JSON oder CSV
- Reagiert auf Mobilgeräte (Responsive Design)
- Material Design Oberfläche mit dem Farbschema #2C2E3B

## Beispiel-URLs

Du kannst verschiedene RA-Regionen und Kategorien crawlen:

- Berlin: `https://de.ra.co/events/de/berlin`
- Hamburg: `https://de.ra.co/events/de/hamburg`
- München: `https://de.ra.co/events/de/munich`
- Köln: `https://de.ra.co/events/de/cologne`
- Bestimmtes Genre: `https://de.ra.co/events/de/berlin?filters=genres.techno`
- Bestimmter Zeitraum: `https://de.ra.co/events/de/berlin?week=2025-05-01`

## Hinweise

- Bitte beachte die Nutzungsbedingungen von Resident Advisor
- Übermäßige Anfragen können zu IP-Bans führen
- Das Crawling sollte mit angemessenen Pausen zwischen den Anfragen erfolgen

## Lizenz

MIT
EOF

# Ausführungsrechte für das Backend setzen
chmod +x backend/server.js

echo -e "${GREEN}===== Installation abgeschlossen! =====${NC}"
echo ""
echo -e "${BLUE}Projektstruktur erfolgreich in 'event-crawler' erstellt.${NC}"
echo ""
echo -e "${YELLOW}So startest du die Anwendung:${NC}"
echo ""
echo -e "1. Backend starten:"
echo -e "   cd event-crawler/backend"
echo -e "   npm install"
echo -e "   npm start"
echo ""
echo -e "2. Frontend starten (in einem neuen Terminal):"
echo -e "   cd event-crawler/frontend"
echo -e "   npm install"
echo -e "   npm start"
echo ""
echo -e "Die Anwendung ist dann unter http://localhost:3000 erreichbar."
echo -e "Das Backend läuft auf http://localhost:5022."
echo ""
echo -e "${GREEN}Viel Spaß mit dem RA Events Crawler!${NC}"