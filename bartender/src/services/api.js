/**
 * API-Service für Bartender App
 * 
 * In einer echten Anwendung würden hier die API-Aufrufe stehen.
 * Für die Entwicklung nutzen wir Mock-Daten.
 */
import { drinks, staff, finances, dashboardData, inventory, suppliers } from './mockData';

// Hilfsfunktion für simulierte API-Verzögerung
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simuliert einen API Aufruf mit Verzögerung
const simulateApiCall = async (data, error = false) => {
  // Zufällige Verzögerung zwischen 300-800ms für realistischere API-Aufrufe
  await delay(Math.floor(Math.random() * 500) + 300);
  
  if (error) {
    throw new Error('API-Fehler: ' + error);
  }
  
  return data;
};

// API für Getränke
export const drinksApi = {
  getAll: async () => {
    return simulateApiCall(drinks);
  },
  
  getById: async (id) => {
    const drink = drinks.find(d => d.id === id);
    return simulateApiCall(drink, !drink && 'Getränk nicht gefunden');
  },
  
  create: async (drinkData) => {
    const newDrink = {
      ...drinkData,
      id: 'drink' + (drinks.length + 1),
    };
    
    drinks.push(newDrink);
    return simulateApiCall(newDrink);
  },
  
  update: async (id, drinkData) => {
    const index = drinks.findIndex(d => d.id === id);
    if (index === -1) {
      return simulateApiCall(null, 'Getränk nicht gefunden');
    }
    
    const updatedDrink = { ...drinks[index], ...drinkData };
    drinks[index] = updatedDrink;
    
    return simulateApiCall(updatedDrink);
  },
  
  delete: async (id) => {
    const index = drinks.findIndex(d => d.id === id);
    if (index === -1) {
      return simulateApiCall(null, 'Getränk nicht gefunden');
    }
    
    drinks.splice(index, 1);
    return simulateApiCall({ success: true });
  },
  
  getPopular: async () => {
    const popularDrinks = drinks.filter(d => d.popular);
    return simulateApiCall(popularDrinks);
  },
};

// API für Personal
export const staffApi = {
  getAll: async () => {
    return simulateApiCall(staff);
  },
  
  getById: async (id) => {
    const member = staff.find(s => s.id === id);
    return simulateApiCall(member, !member && 'Mitarbeiter nicht gefunden');
  },
  
  create: async (staffData) => {
    const newStaff = {
      ...staffData,
      id: 'staff' + (staff.length + 1),
    };
    
    staff.push(newStaff);
    return simulateApiCall(newStaff);
  },
  
  update: async (id, staffData) => {
    const index = staff.findIndex(s => s.id === id);
    if (index === -1) {
      return simulateApiCall(null, 'Mitarbeiter nicht gefunden');
    }
    
    const updatedStaff = { ...staff[index], ...staffData };
    staff[index] = updatedStaff;
    
    return simulateApiCall(updatedStaff);
  },
  
  delete: async (id) => {
    const index = staff.findIndex(s => s.id === id);
    if (index === -1) {
      return simulateApiCall(null, 'Mitarbeiter nicht gefunden');
    }
    
    staff.splice(index, 1);
    return simulateApiCall({ success: true });
  },
};

// API für Finanzen
export const financesApi = {
  // Ausgaben
  getExpenses: async () => {
    return simulateApiCall(finances.expenses);
  },
  
  addExpense: async (expenseData) => {
    const newExpense = {
      ...expenseData,
      id: 'exp' + (finances.expenses.length + 1),
    };
    
    finances.expenses.push(newExpense);
    return simulateApiCall(newExpense);
  },
  
  updateExpense: async (id, expenseData) => {
    const index = finances.expenses.findIndex(e => e.id === id);
    if (index === -1) {
      return simulateApiCall(null, 'Ausgabe nicht gefunden');
    }
    
    const updatedExpense = { ...finances.expenses[index], ...expenseData };
    finances.expenses[index] = updatedExpense;
    
    return simulateApiCall(updatedExpense);
  },
  
  deleteExpense: async (id) => {
    const index = finances.expenses.findIndex(e => e.id === id);
    if (index === -1) {
      return simulateApiCall(null, 'Ausgabe nicht gefunden');
    }
    
    finances.expenses.splice(index, 1);
    return simulateApiCall({ success: true });
  },
  
  // Einnahmen
  getIncome: async () => {
    return simulateApiCall(finances.income);
  },
  
  addIncome: async (incomeData) => {
    const newIncome = {
      ...incomeData,
      id: 'inc' + (finances.income.length + 1),
    };
    
    finances.income.push(newIncome);
    return simulateApiCall(newIncome);
  },
  
  updateIncome: async (id, incomeData) => {
    const index = finances.income.findIndex(i => i.id === id);
    if (index === -1) {
      return simulateApiCall(null, 'Einnahme nicht gefunden');
    }
    
    const updatedIncome = { ...finances.income[index], ...incomeData };
    finances.income[index] = updatedIncome;
    
    return simulateApiCall(updatedIncome);
  },
  
  deleteIncome: async (id) => {
    const index = finances.income.findIndex(i => i.id === id);
    if (index === -1) {
      return simulateApiCall(null, 'Einnahme nicht gefunden');
    }
    
    finances.income.splice(index, 1);
    return simulateApiCall({ success: true });
  },
  
  // Finanzbericht
  getFinancialReport: async (period) => {
    // Simuliert einen Finanzbericht
    await delay(1000);
    
    const totalIncome = finances.income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = finances.expenses.reduce((sum, item) => sum + item.amount, 0);
    
    return {
      period,
      income: {
        total: totalIncome,
        byCategory: {
          bar: finances.income.filter(i => i.category === 'bar').reduce((sum, item) => sum + item.amount, 0),
          food: finances.income.filter(i => i.category === 'food').reduce((sum, item) => sum + item.amount, 0),
          events: finances.income.filter(i => i.category === 'events').reduce((sum, item) => sum + item.amount, 0),
        }
      },
      expenses: {
        total: totalExpenses,
        byCategory: finances.expenses.reduce((result, item) => {
          if (!result[item.category]) {
            result[item.category] = 0;
          }
          result[item.category] += item.amount;
          return result;
        }, {})
      },
      profit: totalIncome - totalExpenses,
      profitMargin: (totalIncome - totalExpenses) / totalIncome * 100,
    };
  },
};

// API für Dashboard
export const dashboardApi = {
  getStats: async () => {
    return simulateApiCall(dashboardData.stats);
  },
  
  getSalesData: async (period = 'weekly') => {
    return simulateApiCall(dashboardData.salesChart[period]);
  },
  
  getTopSellingDrinks: async () => {
    return simulateApiCall(dashboardData.topSellingDrinks);
  },
  
  getExpensesData: async (period = 'monthly') => {
    return simulateApiCall(dashboardData.expensesChart[period]);
  },
};

// API für Inventar
export const inventoryApi = {
  getAll: async () => {
    return simulateApiCall(inventory);
  },
  
  getById: async (id) => {
    const item = inventory.find(i => i.id === id);
    return simulateApiCall(item, !item && 'Inventarposition nicht gefunden');
  },
  
  update: async (id, itemData) => {
    const index = inventory.findIndex(i => i.id === id);
    if (index === -1) {
      return simulateApiCall(null, 'Inventarposition nicht gefunden');
    }
    
    const updatedItem = { ...inventory[index], ...itemData };
    inventory[index] = updatedItem;
    
    return simulateApiCall(updatedItem);
  },
  
  getLowStock: async () => {
    const lowStock = inventory.filter(item => item.quantity <= item.minQuantity);
    return simulateApiCall(lowStock);
  },
};

// API für Lieferanten
export const suppliersApi = {
  getAll: async () => {
    return simulateApiCall(suppliers);
  },
  
  getById: async (id) => {
    const supplier = suppliers.find(s => s.id === id);
    return simulateApiCall(supplier, !supplier && 'Lieferant nicht gefunden');
  },
  
  create: async (supplierData) => {
    const newSupplier = {
      ...supplierData,
      id: 'sup' + (suppliers.length + 1),
    };
    
    suppliers.push(newSupplier);
    return simulateApiCall(newSupplier);
  },
  
  update: async (id, supplierData) => {
    const index = suppliers.findIndex(s => s.id === id);
    if (index === -1) {
      return simulateApiCall(null, 'Lieferant nicht gefunden');
    }
    
    const updatedSupplier = { ...suppliers[index], ...supplierData };
    suppliers[index] = updatedSupplier;
    
    return simulateApiCall(updatedSupplier);
  },
  
  delete: async (id) => {
    const index = suppliers.findIndex(s => s.id === id);
    if (index === -1) {
      return simulateApiCall(null, 'Lieferant nicht gefunden');
    }
    
    suppliers.splice(index, 1);
    return simulateApiCall({ success: true });
  },
};