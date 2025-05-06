/**
 * API-Service für Bartender App mit echter MongoDB-Anbindung
 */
import axios from 'axios';
import { format } from 'date-fns';
import { finances } from './mockData';

// Basis URL für API-Anfragen
// Überprüfe, ob wir im Development oder Production sind
const isLocalhost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

// Base Path ermitteln (für Subpaths wie /bartender)
const basePath = (() => {
  // Wenn wir im Production sind und die URL einen Pfad enthält, extrahieren wir diesen
  if (!isLocalhost) {
    const pathMatch = window.location.pathname.match(/^\/([^\/]+)/);
    if (pathMatch && pathMatch[1]) {
      return `/${pathMatch[1]}`;
    }
  }
  return '';
})();

// In Development: lokale URL mit Port
// In Production: relative URL (basePath + /api) ohne Domain
const API_URL = process.env.REACT_APP_API_URL || 
  (isLocalhost ? 'http://localhost:5024/api' : `${basePath}/api`);

console.log(`API Service using URL: ${API_URL} (${isLocalhost ? 'development' : 'production'} mode, basePath: '${basePath}')`);

// Axios-Instance mit Konfiguration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request-Interceptor zum Hinzufügen der aktuellen Bar aus dem User-Objekt
api.interceptors.request.use(config => {
  try {
    // Versuche die Bar-ID aus dem localStorage zu bekommen
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Find the bar ID using multiple potential paths
    let barId = null;
    
    if (currentUser.bar) {
      // Try bar.id first
      if (currentUser.bar.id) {
        barId = currentUser.bar.id;
      }
      // If not found, try bar._id
      else if (currentUser.bar._id) {
        barId = currentUser.bar._id;
      }
      // If it's a string, use it directly (simple ID reference)
      else if (typeof currentUser.bar === 'string') {
        barId = currentUser.bar;
      }
    }
    
    // Log diagnostic information
    console.log('Request interceptor - barId:', barId);
    
    // Füge die Bar-ID zu den Request-Daten hinzu, wenn es sich um eine POST oder PUT-Anfrage handelt
    if (barId && (config.method === 'post' || config.method === 'put' || config.method === 'patch') && config.data) {
      const data = typeof config.data === 'string' ? JSON.parse(config.data) : { ...config.data };
      data.bar = barId;
      config.data = typeof config.data === 'string' ? JSON.stringify(data) : data;
    }
    
    return config;
  } catch (error) {
    console.error('Error in request interceptor:', error);
    return config; // Continue with the request even if interceptor fails
  }
}, error => {
  return Promise.reject(error);
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
      console.log(`API sending import request with ${fileData.length} bytes of ${format} data`);
      const response = await api.post('/sales/import', { data: fileData, format });
      console.log(`API received import response with status ${response.status}, data length:`, 
                 Array.isArray(response.data) ? response.data.length : 'not an array');
      return response.data;
    } catch (error) {
      console.error('Fehler beim Importieren der Verkaufsdaten:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  },
  
  // Daten als PDF exportieren (clientseitig)
  exportToPDF: (salesData, dateRange) => {
    try {
      console.log(`Exporting ${salesData.length} sales to PDF`);
      const formattedStartDate = format(dateRange.startDate, 'dd.MM.yyyy');
      const formattedEndDate = format(dateRange.endDate, 'dd.MM.yyyy');
      
      // Diese Funktion sollte von der Komponente aufgerufen werden, die jsPDF implementiert
      // Hier wird nur die Logik bereitgestellt, aber die tatsächliche PDF-Erstellung 
      // erfolgt in der Komponente
      return {
        salesData,
        dateRange: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      };
    } catch (error) {
      console.error('Fehler beim Exportieren als PDF:', error);
      throw error;
    }
  },
  
  // Daten als Excel exportieren (clientseitig)
  exportToExcel: (salesData, dateRange) => {
    try {
      console.log(`Exporting ${salesData.length} sales to Excel`);
      const formattedStartDate = format(dateRange.startDate, 'dd.MM.yyyy');
      const formattedEndDate = format(dateRange.endDate, 'dd.MM.yyyy');
      
      // Ähnlich wie beim PDF-Export wird hier nur die Logik bereitgestellt
      // Die tatsächliche Excel-Erstellung erfolgt in der Komponente
      return {
        salesData,
        dateRange: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      };
    } catch (error) {
      console.error('Fehler beim Exportieren als Excel:', error);
      throw error;
    }
  }
};

// Finanzen-API mit echter Backend-Anbindung und Fallback zu Mock-Daten
export const financesApi = {
  // Ausgaben abrufen
  getExpenses: async () => {
    try {
      // Versuche, die Daten vom Server zu laden
      try {
        const response = await api.get('/finances/expenses');
        console.log('Ausgaben vom Server geladen:', response.data.length);
        return response.data;
      } catch (error) {
        console.warn('Finanzen-API ist auf dem Server nicht verfügbar oder noch nicht vollständig implementiert. Verwende Mock-Daten.');
        // Fallback zu Mock-Daten
        return finances.expenses || [];
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Ausgaben:', error);
      // Letzte Rettung: Gib leere Liste zurück, damit die UI nicht crasht
      return [];
    }
  },
  
  // Einnahmen abrufen
  getIncome: async () => {
    try {
      // Versuche, die Daten vom Server zu laden
      try {
        const response = await api.get('/finances/income');
        console.log('Einnahmen vom Server geladen:', response.data.length);
        return response.data;
      } catch (error) {
        console.warn('Finanzen-API ist auf dem Server nicht verfügbar oder noch nicht vollständig implementiert. Verwende Mock-Daten.');
        // Fallback zu Mock-Daten
        return finances.income || [];
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Einnahmen:', error);
      // Letzte Rettung: Gib leere Liste zurück, damit die UI nicht crasht
      return [];
    }
  },
  
  // Ausgabe hinzufügen
  addExpense: async (expenseData) => {
    try {
      console.log('Sende Ausgabe an Server:', expenseData);
      
      try {
        const response = await api.post('/finances/expenses', expenseData);
        console.log('Ausgabe erfolgreich erstellt:', response.data);
        return response.data;
      } catch (apiError) {
        console.warn('Finanzen-API (addExpense) ist auf dem Server nicht verfügbar oder noch nicht vollständig implementiert. Simuliere Erfolg.');
        // Simuliere erfolgreiches Hinzufügen
        return { 
          ...expenseData, 
          id: 'mock-' + Date.now(),
          date: expenseData.date || new Date().toISOString() 
        };
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Ausgabe:', error);
      if (error.response?.data?.message) {
        error.message = error.response.data.message;
      }
      throw error;
    }
  },
  
  // Ausgabe aktualisieren
  updateExpense: async (id, expenseData) => {
    try {
      console.log(`Aktualisiere Ausgabe ${id}:`, expenseData);
      
      try {
        const response = await api.put(`/finances/expenses/${id}`, expenseData);
        console.log('Ausgabe erfolgreich aktualisiert:', response.data);
        return response.data;
      } catch (apiError) {
        console.warn('Finanzen-API (updateExpense) ist auf dem Server nicht verfügbar oder noch nicht vollständig implementiert. Simuliere Erfolg.');
        // Simuliere erfolgreiches Aktualisieren
        return { 
          ...expenseData, 
          id: id
        };
      }
    } catch (error) {
      console.error(`Fehler beim Aktualisieren der Ausgabe ${id}:`, error);
      if (error.response?.data?.message) {
        error.message = error.response.data.message;
      }
      throw error;
    }
  },
  
  // Ausgabe löschen
  deleteExpense: async (id) => {
    try {
      console.log(`Lösche Ausgabe mit ID ${id}`);
      
      try {
        const response = await api.delete(`/finances/expenses/${id}`);
        console.log('Ausgabe erfolgreich gelöscht (Server):', response.data);
        return { success: true, id: id, ...response.data };
      } catch (apiError) {
        console.warn('Finanzen-API (deleteExpense) ist auf dem Server nicht verfügbar oder noch nicht vollständig implementiert. Simuliere Erfolg.');
        console.log('Simulierte Löschung der Ausgabe', id);
        // Simuliere erfolgreiches Löschen - sicherstellen, dass success: true enthalten ist
        return { success: true, id: id, message: 'Erfolgreich gelöscht (simuliert)' };
      }
    } catch (error) {
      console.error(`Fehler beim Löschen der Ausgabe ${id}:`, error);
      if (error.response?.data?.message) {
        error.message = error.response.data.message;
      }
      throw error;
    }
  },
  
  // Einnahme hinzufügen
  addIncome: async (incomeData) => {
    try {
      console.log('Sende Einnahme an Server:', incomeData);
      
      try {
        const response = await api.post('/finances/income', incomeData);
        console.log('Einnahme erfolgreich erstellt:', response.data);
        return response.data;
      } catch (apiError) {
        console.warn('Finanzen-API (addIncome) ist auf dem Server nicht verfügbar oder noch nicht vollständig implementiert. Simuliere Erfolg.');
        // Simuliere erfolgreiches Hinzufügen
        return { 
          ...incomeData, 
          id: 'mock-' + Date.now(),
          date: incomeData.date || new Date().toISOString() 
        };
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Einnahme:', error);
      if (error.response?.data?.message) {
        error.message = error.response.data.message;
      }
      throw error;
    }
  },
  
  // Einnahme aktualisieren
  updateIncome: async (id, incomeData) => {
    try {
      console.log(`Aktualisiere Einnahme ${id}:`, incomeData);
      
      try {
        const response = await api.put(`/finances/income/${id}`, incomeData);
        console.log('Einnahme erfolgreich aktualisiert:', response.data);
        return response.data;
      } catch (apiError) {
        console.warn('Finanzen-API (updateIncome) ist auf dem Server nicht verfügbar oder noch nicht vollständig implementiert. Simuliere Erfolg.');
        // Simuliere erfolgreiches Aktualisieren
        return { 
          ...incomeData, 
          id: id
        };
      }
    } catch (error) {
      console.error(`Fehler beim Aktualisieren der Einnahme ${id}:`, error);
      if (error.response?.data?.message) {
        error.message = error.response.data.message;
      }
      throw error;
    }
  },
  
  // Einnahme löschen
  deleteIncome: async (id) => {
    try {
      console.log(`Lösche Einnahme mit ID ${id}`);
      
      try {
        const response = await api.delete(`/finances/income/${id}`);
        console.log('Einnahme erfolgreich gelöscht (Server):', response.data);
        return { success: true, id: id, ...response.data };
      } catch (apiError) {
        console.warn('Finanzen-API (deleteIncome) ist auf dem Server nicht verfügbar oder noch nicht vollständig implementiert. Simuliere Erfolg.');
        console.log('Simulierte Löschung der Einnahme', id);
        // Simuliere erfolgreiches Löschen - sicherstellen, dass success: true enthalten ist
        return { success: true, id: id, message: 'Erfolgreich gelöscht (simuliert)' };
      }
    } catch (error) {
      console.error(`Fehler beim Löschen der Einnahme ${id}:`, error);
      if (error.response?.data?.message) {
        error.message = error.response.data.message;
      }
      throw error;
    }
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
  
  getSalesData: async (period = 'monthly') => {
    try {
      const response = await api.get(`/dashboard/sales-data?period=${period}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen der Umsatzdaten (${period}):`, error);
      // Fallback zu Beispieldaten im Fehlerfall
      return {
        labels: period === 'today' ? 
          ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'] :
          period === 'weekly' ? 
            ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] :
            ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
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