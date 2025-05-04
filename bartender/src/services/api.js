/**
 * API-Service für Bartender App mit echter MongoDB-Anbindung
 */
import axios from 'axios';

// Basis URL für API-Anfragen
const API_URL = process.env.REACT_APP_API_URL || '/api';

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
      const response = await api.post('/sales', saleData);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Verkaufs:', error);
      throw error;
    }
  },
  
  update: async (id, saleData) => {
    try {
      const response = await api.put(`/sales/${id}`, saleData);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Verkaufs mit ID ${id}:`, error);
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

// Placeholder für Dashboard-API (kann später implementiert werden)
export const dashboardApi = {
  // Methoden für Dashboard werden später implementiert
  getStats: async () => {
    console.warn('Dashboard-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return { revenue: 0, customers: 0, orders: 0, avg: 0 };
  },
  getSalesData: async () => {
    console.warn('Dashboard-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return [];
  }
};