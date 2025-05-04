/**
 * API-Service für Bartender App mit echter MongoDB-Anbindung
 */
import axios from 'axios';

// Basis URL für API-Anfragen
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5024/api';

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
    return { 
      revenue: { value: "12.450 €", trend: 5.2, trendDescription: "vs. letzter Monat" },
      profit: { value: "4.230 €", trend: 3.8, trendDescription: "vs. letzter Monat" },
      customers: { value: "485", trend: -2.3, trendDescription: "vs. letzter Monat" },
      avgOrder: { value: "25,60 €", trend: 1.5, trendDescription: "vs. letzter Monat" }
    };
  },
  getSalesData: async () => {
    console.warn('Dashboard-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return {
      labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
      datasets: [
        {
          label: 'Umsatz',
          data: [12, 19, 13, 15, 22, 27],
          borderColor: 'rgba(53, 162, 235, 0.8)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        }
      ]
    };
  },
  getTopSellingDrinks: async () => {
    console.warn('Dashboard-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return [
      { id: 1, name: 'Mojito', amount: 125, revenue: 1062.5 },
      { id: 2, name: 'Gin Tonic', amount: 98, revenue: 735 },
      { id: 3, name: 'Cuba Libre', amount: 87, revenue: 652.5 },
      { id: 4, name: 'Aperol Spritz', amount: 76, revenue: 532 },
      { id: 5, name: 'Moscow Mule', amount: 65, revenue: 552.5 }
    ];
  },
  getExpensesData: async (period = 'monthly') => {
    console.warn('Dashboard-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    
    // Beispieldaten für verschiedene Zeiträume
    const data = {
      monthly: [
        { name: 'Miete', value: 1200, percent: 0.30 },
        { name: 'Personal', value: 1600, percent: 0.40 },
        { name: 'Einkauf', value: 800, percent: 0.20 },
        { name: 'Marketing', value: 200, percent: 0.05 },
        { name: 'Sonstiges', value: 200, percent: 0.05 }
      ],
      quarterly: [
        { name: 'Miete', value: 3600, percent: 0.32 },
        { name: 'Personal', value: 4200, percent: 0.38 },
        { name: 'Einkauf', value: 2400, percent: 0.22 },
        { name: 'Marketing', value: 550, percent: 0.05 },
        { name: 'Sonstiges', value: 350, percent: 0.03 }
      ],
      yearly: [
        { name: 'Miete', value: 14400, percent: 0.33 },
        { name: 'Personal', value: 16500, percent: 0.37 },
        { name: 'Einkauf', value: 9800, percent: 0.22 },
        { name: 'Marketing', value: 2200, percent: 0.05 },
        { name: 'Sonstiges', value: 1500, percent: 0.03 }
      ]
    };
    
    // Wenn ein bestimmter Zeitraum angefordert wird, geben wir nur diesen zurück
    if (period in data) {
      return data[period];
    }
    
    // Andernfalls geben wir alle Daten zurück
    return data;
  }
};

// Placeholder für Inventar-API
export const inventoryApi = {
  getAll: async () => {
    console.warn('Inventar-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return [];
  },
  getById: async (id) => {
    console.warn('Inventar-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return {};
  },
  create: async (data) => {
    console.warn('Inventar-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return data;
  },
  update: async (id, data) => {
    console.warn('Inventar-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return data;
  },
  delete: async (id) => {
    console.warn('Inventar-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return { success: true };
  },
  getLowStock: async () => {
    console.warn('Inventar-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return [
      { id: 1, name: 'Rum', category: 'spirits', quantity: 2, minQuantity: 5, unit: 'Flaschen' },
      { id: 2, name: 'Gin', category: 'spirits', quantity: 1, minQuantity: 4, unit: 'Flaschen' },
      { id: 3, name: 'Tonic Water', category: 'softDrinks', quantity: 8, minQuantity: 24, unit: 'Flaschen' }
    ];
  }
};

// Placeholder für Lieferanten-API
export const suppliersApi = {
  getAll: async () => {
    console.warn('Lieferanten-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return [];
  },
  getById: async (id) => {
    console.warn('Lieferanten-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return {};
  },
  create: async (data) => {
    console.warn('Lieferanten-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return data;
  },
  update: async (id, data) => {
    console.warn('Lieferanten-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return data;
  },
  delete: async (id) => {
    console.warn('Lieferanten-API noch nicht implementiert, wird später durch echte MongoDB-Endpunkte ersetzt.');
    return { success: true };
  }
};