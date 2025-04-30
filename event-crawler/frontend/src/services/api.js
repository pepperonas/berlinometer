import axios from 'axios';

/**
 * Holt Events für eine bestimmte Seite
 * @param {string} baseUrl - Die Basis-URL für die Events
 * @param {number} page - Die aktuelle Seitennummer
 * @returns {Promise<Array>} - Array mit Events
 */
export const fetchEvents = async (baseUrl, page = 1) => {
  try {
    console.log(`Versuche Events von Backend abzurufen: ${baseUrl}, Seite ${page}`);

    // Da wir einen Proxy verwenden, rufen wir unseren eigenen Backend-Server auf
    // Der Proxy ist in package.json konfiguriert "proxy": "http://localhost:5022"
    const response = await axios.get('/api/events', {
      params: {
        url: baseUrl,
        page
      }
    });

    console.log(`Backend-Antwort erhalten, ${response.data.events?.length || 0} Events`);

    // Wenn wir Events bekommen haben, geben wir sie zurück
    if (response.data.events && response.data.events.length > 0) {
      return response.data.events;
    } else {
      console.warn('Keine Events vom Backend erhalten, verwende simulierte Daten');
      return simulateEvents(baseUrl, page);
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Events vom Backend:', error.message);
    console.error('Verwende simulierte Daten stattdessen');

    // Bei einem Fehler simulieren wir Events
    return simulateEvents(baseUrl, page);
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