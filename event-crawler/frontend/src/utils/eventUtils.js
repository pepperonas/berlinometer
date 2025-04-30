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
