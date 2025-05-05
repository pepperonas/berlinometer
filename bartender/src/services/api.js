/**
 * API-Service für Bartender App mit echter MongoDB-Anbindung
 */
import axios from 'axios';

// Basis URL für API-Anfragen
// Überprüfe, ob wir im Development oder Production sind
const isLocalhost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

// In Development: lokale URL mit Port
// In Production: relative URL (/api) ohne Domain
const API_URL = process.env.REACT_APP_API_URL || 
  (isLocalhost ? 'http://localhost:5024/api' : '/api');

console.log(`API Service using URL: ${API_URL} (${isLocalhost ? 'development' : 'production'} mode)`);

// Axios-Instance mit Konfiguration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API für Getränke
export const drinksApi = {
  getAll: async () => {
    try {
      const response = await api.get('/drinks');
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Getränke:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/drinks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Getränks mit ID ${id}:`, error);
      throw error;
    }
  },
  
  create: async (drinkData) => {
    try {
      const response = await api.post('/drinks', drinkData);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Getränks:', error);
      throw error;
    }
  },
  
  update: async (id, drinkData) => {
    try {
      const response = await api.put(`/drinks/${id}`, drinkData);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Getränks mit ID ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/drinks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Löschen des Getränks mit ID ${id}:`, error);
      throw error;
    }
  },
  
  getPopular: async () => {
    try {
      const response = await api.get('/drinks/popular/list');
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der beliebten Getränke:', error);
      throw error;
    }
  },
};

// API für Personal
export const staffApi = {
  getAll: async () => {
    try {
      const response = await api.get('/staff');
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen des Personals:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/staff/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Mitarbeiters mit ID ${id}:`, error);
      throw error;
    }
  },
  
  create: async (staffData) => {
    try {
      const response = await api.post('/staff', staffData);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Mitarbeiters:', error);
      throw error;
    }
  },
  
  update: async (id, staffData) => {
    try {
      const response = await api.put(`/staff/${id}`, staffData);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Mitarbeiters mit ID ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/staff/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Löschen des Mitarbeiters mit ID ${id}:`, error);
      throw error;
    }
  },
};

// API für Verkäufe
export const salesApi = {
  getAll: async () => {
    try {
      const response = await api.get('/sales');
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Verkäufe:', error);
      throw error;
    }
  },
  
  getByDate: async (startDate, endDate) => {
    try {
      // Formatiere die Daten für die URL
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate).toISOString();
      
      const response = await api.get(`/sales/date/${start}/${end}`);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Verkäufe nach Datum:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/sales/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Verkaufs mit ID ${id}:`, error);
      throw error;
    }
  },
  
  create: async (saleData) => {
    try {
      console.log('API sendet Verkaufsdaten:', JSON.stringify(saleData, null, 2));
      const response = await api.post('/sales', saleData);
      console.log('API Antwort:', response.data);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Verkaufs:', error);
      console.error('Response data:', error.response?.data);
      // Detaillierte Fehlermeldung zurückgeben, wenn verfügbar
      if (error.response?.data?.error) {
        error.message = error.response.data.error;
      }
      throw error;
    }
  },
  
  update: async (id, saleData) => {
    try {
      console.log(`API aktualisiert Verkauf ${id}:`, JSON.stringify(saleData, null, 2));
      const response = await api.put(`/sales/${id}`, saleData);
      console.log('API Antwort:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Verkaufs mit ID ${id}:`, error);
      console.error('Response data:', error.response?.data);
      // Detaillierte Fehlermeldung zurückgeben, wenn verfügbar
      if (error.response?.data?.error) {
        error.message = error.response.data.error;
      }
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/sales/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Löschen des Verkaufs mit ID ${id}:`, error);
      throw error;
    }
  },
  
  importFromPOS: async (fileData, format) => {
    try {
      const response = await api.post('/sales/import', { data: fileData, format });
      return response.data;
    } catch (error) {
      console.error('Fehler beim Importieren der Verkaufsdaten:', error);
      throw error;
    }
  }
};

// Placeholder für Finanzen-API (kann später implementiert werden)
export const financesApi = {
  // Methoden für Finanzen werden später implementiert
  getExpenses: async () => {
    console.warn('Finanzen-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return [];
  },
  getIncome: async () => {
    console.warn('Finanzen-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return [];
  }
};

// Dashboard-API mit echten Endpunkten
export const dashboardApi = {
  getStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Dashboard-Statistiken:', error);
      // Fallback zu Beispieldaten im Fehlerfall
      return { 
        revenue: { value: "0,00 €", trend: 0, trendDescription: "vs. letzter Monat" },
        profit: { value: "0,00 €", trend: 0, trendDescription: "vs. letzter Monat" },
        customers: { value: "0", trend: 0, trendDescription: "vs. letzter Monat" },
        avgOrder: { value: "0,00 €", trend: 0, trendDescription: "vs. letzter Monat" }
      };
    }
  },
  
  getSalesData: async () => {
    try {
      const response = await api.get('/dashboard/sales-data');
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Umsatzdaten:', error);
      // Fallback zu Beispieldaten im Fehlerfall
      return {
        labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
        datasets: [
          {
            label: 'Umsatz',
            data: [0, 0, 0, 0, 0, 0],
            borderColor: 'rgba(53, 162, 235, 0.8)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          }
        ]
      };
    }
  },
  
  getTopSellingDrinks: async () => {
    try {
      const response = await api.get('/dashboard/top-selling');
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der meistverkauften Getränke:', error);
      // Fallback zu leerer Liste im Fehlerfall
      return [];
    }
  },
  
  getExpensesData: async (period = 'monthly') => {
    try {
      const response = await api.get(`/dashboard/expenses-data?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Ausgabendaten:', error);
      // Fallback zu leerer Liste im Fehlerfall
      return [];
    }
  }
};

// Inventar-API mit echten Endpunkten
export const inventoryApi = {
  getAll: async () => {
    try {
      const response = await api.get('/inventory');
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen aller Inventareinträge:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Inventareintrags mit ID ${id}:`, error);
      return {};
    }
  },
  
  create: async (data) => {
    try {
      const response = await api.post('/inventory', data);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Inventareintrags:', error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      const response = await api.put(`/inventory/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Inventareintrags mit ID ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Löschen des Inventareintrags mit ID ${id}:`, error);
      throw error;
    }
  },
  
  getLowStock: async () => {
    try {
      const response = await api.get('/inventory/low-stock');
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen von Inventareinträgen mit niedrigem Bestand:', error);
      return [];
    }
  }
};

// Lieferanten-API mit echten Endpunkten
export const suppliersApi = {
  getAll: async () => {
    try {
      const response = await api.get('/suppliers');
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen aller Lieferanten:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Lieferanten mit ID ${id}:`, error);
      return {};
    }
  },
  
  create: async (data) => {
    try {
      const response = await api.post('/suppliers', data);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Lieferanten:', error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      const response = await api.put(`/suppliers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Lieferanten mit ID ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Löschen des Lieferanten mit ID ${id}:`, error);
      throw error;
    }
  }
};