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

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// Debug-Middleware für alle Anfragen
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

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

        // Request mit verbesserten Headers, die einen echten Browser simulieren
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'de,en-US;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Referer': 'https://de.ra.co',
                'Upgrade-Insecure-Requests': '1',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"'
            },
            timeout: 10000
        });

        // HTML-Struktur inspizieren und Selektoren anpassen
        const html = response.data;
        console.log(`HTML erhalten (${html.length} Bytes)`);

        // Speichere HTML zur Inspektion (nur für Debugging)
        /*
        const fs = require('fs');
        fs.writeFileSync('ra_response.html', html);
        console.log('HTML gespeichert in ra_response.html');
        */

        // HTML-Parsing mit Cheerio
        const $ = cheerio.load(html);
        const events = [];

        // Analysiere die HTML-Struktur und aktualisiere die Selektoren
        console.log('Suche nach Events mit folgenden Selektoren:');
        console.log('1. [data-testid="event-listing"] [data-testid="event-listing-column"]');
        console.log('2. li[data-testid="event-card"]');
        console.log('3. article.event-card');

        // Verschiedene mögliche Selektoren ausprobieren
        let eventElements = $('[data-testid="event-listing"] [data-testid="event-listing-column"]');
        console.log(`Gefunden mit Selektor 1: ${eventElements.length} Events`);

        if (eventElements.length === 0) {
            eventElements = $('li[data-testid="event-card"]');
            console.log(`Gefunden mit Selektor 2: ${eventElements.length} Events`);
        }

        if (eventElements.length === 0) {
            eventElements = $('article.event-card');
            console.log(`Gefunden mit Selektor 3: ${eventElements.length} Events`);
        }

        // Wenn keine Events gefunden wurden, versuche weitere Selektoren
        if (eventElements.length === 0) {
            console.log('Keine Event-Elemente gefunden. Versuche allgemeinere Selektoren...');

            // Prüfe, ob wir irgendwelche divs oder lis mit bestimmten Klassen oder Attributen finden können
            ['li', 'article', 'div'].forEach(tag => {
                console.log(`Suche nach ${tag}-Elementen mit event im Namen...`);
                const elements = $(tag).filter(function() {
                    const classNames = $(this).attr('class') || '';
                    return classNames.toLowerCase().includes('event');
                });
                console.log(`Gefunden: ${elements.length} ${tag}-Elemente mit 'event' in class`);

                if (elements.length > 0 && eventElements.length === 0) {
                    eventElements = elements;
                }
            });
        }

        if (eventElements.length === 0) {
            console.log('WARNUNG: Konnte keine Events mit bekannten Selektoren finden');
            // Sende eine Warnung aber keinen Fehler, damit das Frontend funktioniert
            return res.json({
                page: parseInt(page),
                count: 0,
                events: [],
                warning: 'Konnte keine Events finden. Die RA-Website hat sich möglicherweise geändert.'
            });
        }

        // Extrahiere die Events aus den gefundenen Elementen
        eventElements.each((index, element) => {
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

                // Versuche verschiedene Selektoren für Titel
                let title = $element.find('h3').text().trim();
                if (!title) {
                    title = $element.find('[data-pw-test-id="event-title-link"]').text().trim();
                }
                if (!title) {
                    title = $element.find('a[title]').attr('title');
                }

                // Versuche verschiedene Selektoren für Datum
                let date = '';
                const dateElement = $element.find('time');
                if (dateElement.length) {
                    date = dateElement.attr('datetime') || dateElement.text().trim();
                } else {
                    // Suche nach Datums-Text
                    $element.find('span').each((i, span) => {
                        const text = $(span).text().trim();
                        if (text.match(/\d{1,2}\s+[A-Za-z]{3,}/)) {
                            date = text;
                        }
                    });
                }

                // Versuche verschiedene Selektoren für Venue
                let venue = $element.find('[data-testid="venue"]').text().trim();
                if (!venue) {
                    venue = $element.find('[data-pw-test-id="event-venue-link"]').text().trim();
                }
                if (!venue) {
                    // Suche nach Venue-Text
                    $element.find('span').each((i, span) => {
                        const text = $(span).text().trim();
                        if (text && !text.match(/\d{1,2}\s+[A-Za-z]{3,}/) && text.length > 3) {
                            venue = text;
                        }
                    });
                }

                // Versuche verschiedene Selektoren für Interested Count
                let interestedCount = 0;
                const metaElement = $element.find('[data-testid="meta"]');
                if (metaElement.length) {
                    const interestedText = metaElement.text().trim();
                    interestedCount = interestedText.match(/(\d+)/) ? parseInt(interestedText.match(/(\d+)/)[1]) : 0;
                } else {
                    // Suche nach Zahlen in Spans
                    $element.find('span').each((i, span) => {
                        const text = $(span).text().trim();
                        if (text.match(/\d+/) && text.length < 10) {
                            interestedCount = parseInt(text.match(/\d+/)[0]);
                        }
                    });
                }

                // Versuche verschiedene Selektoren für Genre-Tags
                const genreTags = [];
                $element.find('[data-testid="tag"]').each((i, tag) => {
                    genreTags.push($(tag).text().toLowerCase());
                });

                // Nur gültige Events hinzufügen
                if ((eventId || title) && (venue || date)) {
                    events.push({
                        id: eventId || `generated-${index}`,
                        title: title || `Event ${index}`,
                        date: date || new Date().toISOString().split('T')[0],
                        venue: venue || 'Unbekannt',
                        interestedCount,
                        url: eventUrl || `https://de.ra.co/events/unknown-${index}`,
                        genre: genreTags,
                        artists: [] // Würde separate Anfragen erfordern
                    });
                }
            } catch (err) {
                console.error(`Fehler beim Parsen des Events ${index}:`, err);
            }
        });

        console.log(`Erfolgreich ${events.length} Events extrahiert`);

        res.json({
            page: parseInt(page),
            count: events.length,
            events
        });
    } catch (error) {
        console.error('Fehler beim Crawlen:', error.message);
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
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'de,en-US;q=0.9,en;q=0.8',
                'Referer': 'https://de.ra.co'
            },
            timeout: 10000
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

// Test-Endpunkt
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Backend-Server läuft!',
        timestamp: new Date().toISOString()
    });
});

// Server starten
app.listen(PORT, () => {
    console.log(`Backend-Server läuft auf http://localhost:${PORT}`);
    console.log(`API-Endpunkte:`);
    console.log(`  - GET /api/events?url=URL&page=PAGE`);
    console.log(`  - GET /api/events/:id`);
    console.log(`  - GET /api/test (Test-Endpunkt)`);
});