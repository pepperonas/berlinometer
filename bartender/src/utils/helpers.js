/**
 * Hilfsfunktionen für die Bartender App
 */

/**
 * Formatiert einen Betrag als Euro-Währungsstring
 * @param {number} amount - Der zu formatierende Betrag
 * @return {string} Formatierter Betrag mit €-Symbol
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

/**
 * Berechnet den Gesamtbetrag aus einer Liste von Objekten
 * @param {Array} items - Liste von Objekten mit einem Preis- oder Betragsfeld
 * @param {string} field - Name des Felds, das den Betrag enthält
 * @return {number} Summe aller Beträge
 */
export const calculateTotal = (items, field = 'price') => {
  if (!items || !items.length) return 0;
  return items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
};

/**
 * Filtert eine Liste nach einem Suchbegriff
 * @param {Array} items - Die zu filternde Liste
 * @param {string} searchTerm - Der Suchbegriff
 * @param {Array} fields - Die Felder, in denen gesucht werden soll
 * @return {Array} Die gefilterte Liste
 */
export const filterBySearchTerm = (items, searchTerm, fields) => {
  if (!searchTerm) return items;
  
  const term = searchTerm.toLowerCase();
  
  return items.filter(item => {
    return fields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(term);
      }
      return false;
    });
  });
};

/**
 * Gruppiert Daten nach einem bestimmten Feld
 * @param {Array} items - Die zu gruppierenden Daten
 * @param {string} field - Das Feld, nach dem gruppiert werden soll
 * @return {Object} Ein Objekt mit den gruppierten Daten
 */
export const groupBy = (items, field) => {
  return items.reduce((result, item) => {
    const key = item[field];
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {});
};

/**
 * Generiert ein eindeutiges ID
 * @return {string} Eine eindeutige ID
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Sortiert ein Array von Objekten nach einem bestimmten Feld
 * @param {Array} items - Das zu sortierende Array
 * @param {string} field - Das Feld, nach dem sortiert werden soll
 * @param {boolean} ascending - Die Sortierrichtung (aufsteigend/absteigend)
 * @return {Array} Das sortierte Array
 */
export const sortByField = (items, field, ascending = true) => {
  return [...items].sort((a, b) => {
    const valueA = a[field];
    const valueB = b[field];
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return ascending 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    return ascending 
      ? valueA - valueB 
      : valueB - valueA;
  });
};