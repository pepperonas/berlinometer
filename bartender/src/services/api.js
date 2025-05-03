/**
 * API-Service für Bartender App
 * 
 * In einer echten Anwendung würden hier die API-Aufrufe stehen.
 * Für die Entwicklung nutzen wir Mock-Daten.
 */
import { drinks, staff, finances, dashboardData, inventory, suppliers, sales, posFormats } from './mockData';

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
  
  create: async (itemData) => {
    const newItem = {
      ...itemData,
      id: 'inv' + (inventory.length + 1),
    };
    
    inventory.push(newItem);
    return simulateApiCall(newItem);
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

// API für Verkäufe
export const salesApi = {
  getAll: async () => {
    return simulateApiCall(sales);
  },
  
  getByDate: async (startDate, endDate) => {
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
    });
    return simulateApiCall(filteredSales);
  },
  
  getById: async (id) => {
    const sale = sales.find(s => s.id === id);
    return simulateApiCall(sale, !sale && 'Verkauf nicht gefunden');
  },
  
  create: async (saleData) => {
    // Berechne die Gesamtsumme, wenn nicht angegeben
    if (!saleData.total) {
      saleData.total = saleData.items.reduce(
        (sum, item) => sum + (item.quantity * item.pricePerUnit), 0
      );
    }
    
    const newSale = {
      ...saleData,
      id: 'sale' + (sales.length + 1),
      date: saleData.date || new Date().toISOString(),
    };
    
    sales.push(newSale);
    
    // Aktualisiere Lagerbestand für verkaufte Getränke, die im Lager geführt werden
    for (const item of newSale.items) {
      const drink = drinks.find(d => d.id === item.drinkId);
      if (drink && drink.stock > 0) {
        drink.stock = Math.max(0, drink.stock - item.quantity);
      }
    }
    
    return simulateApiCall(newSale);
  },
  
  update: async (id, saleData) => {
    const index = sales.findIndex(s => s.id === id);
    if (index === -1) {
      return simulateApiCall(null, 'Verkauf nicht gefunden');
    }
    
    // Berechne die Gesamtsumme neu, wenn Items aktualisiert wurden
    if (saleData.items) {
      saleData.total = saleData.items.reduce(
        (sum, item) => sum + (item.quantity * item.pricePerUnit), 0
      );
    }
    
    const updatedSale = { ...sales[index], ...saleData };
    sales[index] = updatedSale;
    
    return simulateApiCall(updatedSale);
  },
  
  delete: async (id) => {
    const index = sales.findIndex(s => s.id === id);
    if (index === -1) {
      return simulateApiCall(null, 'Verkauf nicht gefunden');
    }
    
    sales.splice(index, 1);
    return simulateApiCall({ success: true });
  },
  
  // Import von Kassensystem-Daten
  importFromPOS: async (fileData, format) => {
    try {
      let importedSales = [];
      
      // Verarbeitung je nach Format
      switch (format) {
        case 'csv':
          // CSV-Verarbeitung
          const lines = fileData.trim().split('\n');
          const headers = lines[0].split(',');
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const saleItem = {};
            
            headers.forEach((header, index) => {
              if (header === 'datum' || header === 'date') {
                saleItem.date = values[index];
              } else if (header === 'produkt' || header === 'product' || header === 'name') {
                saleItem.name = values[index];
              } else if (header === 'menge' || header === 'quantity') {
                saleItem.quantity = parseFloat(values[index]);
              } else if (header === 'preis' || header === 'price') {
                saleItem.pricePerUnit = parseFloat(values[index]);
              }
            });
            
            // Gruppiere nach Datum
            const existingSale = importedSales.find(s => s.date === saleItem.date);
            if (existingSale) {
              existingSale.items.push({
                name: saleItem.name,
                quantity: saleItem.quantity,
                pricePerUnit: saleItem.pricePerUnit,
                drinkId: findDrinkIdByName(saleItem.name)
              });
            } else {
              importedSales.push({
                date: saleItem.date,
                items: [{
                  name: saleItem.name,
                  quantity: saleItem.quantity,
                  pricePerUnit: saleItem.pricePerUnit,
                  drinkId: findDrinkIdByName(saleItem.name)
                }],
                paymentMethod: 'cash', // Standard: Bargeld
                staffId: 'staff1', // Standard: Erster Mitarbeiter
                notes: 'Importiert aus Kassensystem'
              });
            }
          }
          break;
          
        case 'json':
          // JSON-Verarbeitung
          const jsonData = JSON.parse(fileData);
          
          if (Array.isArray(jsonData)) {
            // Format: [{ date, items: [{ name, quantity, price }] }]
            importedSales = jsonData.map(sale => ({
              date: sale.date,
              items: sale.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                pricePerUnit: item.price,
                drinkId: findDrinkIdByName(item.name)
              })),
              paymentMethod: sale.paymentMethod || 'cash',
              staffId: sale.staffId || 'staff1',
              notes: sale.notes || 'Importiert aus Kassensystem'
            }));
          } else {
            // Format: { date, items: [{ name, quantity, price }] }
            importedSales = [{
              date: jsonData.date,
              items: jsonData.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                pricePerUnit: item.price,
                drinkId: findDrinkIdByName(item.name)
              })),
              paymentMethod: jsonData.paymentMethod || 'cash',
              staffId: jsonData.staffId || 'staff1',
              notes: jsonData.notes || 'Importiert aus Kassensystem'
            }];
          }
          break;
          
        case 'excel':
          // Excel-Format würde in einer realen App eine externe Bibliothek 
          // wie ExcelJS oder SheetJS verwenden
          return simulateApiCall(null, 'Excel-Import noch nicht implementiert');
          
        default:
          return simulateApiCall(null, 'Unbekanntes Dateiformat');
      }
      
      // Berechne Gesamtsummen für jeden Import
      importedSales.forEach(sale => {
        sale.total = sale.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
      });
      
      // Speichere alle importierten Verkäufe
      const createdSales = [];
      for (const saleData of importedSales) {
        const newSale = await salesApi.create(saleData);
        createdSales.push(newSale);
      }
      
      return simulateApiCall(createdSales);
    } catch (error) {
      return simulateApiCall(null, 'Fehler beim Import: ' + error.message);
    }
  }
};

// Hilfsfunktion, um Getränke-ID anhand des Namens zu finden
function findDrinkIdByName(name) {
  const drink = drinks.find(d => 
    d.name.toLowerCase() === name.toLowerCase() ||
    d.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(d.name.toLowerCase())
  );
  return drink ? drink.id : null;
}