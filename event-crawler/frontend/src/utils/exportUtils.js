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
