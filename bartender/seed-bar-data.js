/**
 * Bar Seed Skript
 * Dieses Skript fragt nach einer E-Mail-Adresse, sucht den zugehörigen Benutzer,
 * und erstellt Dummy-Daten für die Bar dieses Benutzers.
 */
const mongoose = require('mongoose');
const readline = require('readline');
const { DRINK_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } = require('./server/utils/constants');

// MongoDB Verbindung herstellen
const connectDB = async () => {
  try {
    const mongoURI = 'mongodb://mongoAdmin:%23QGwODkgI7fx@localhost:27017/bartender?authSource=admin';
    
    console.log('Verbinde mit MongoDB...');
    
    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5
    };
    
    const conn = await mongoose.connect(mongoURI, options);
    console.log(`MongoDB verbunden: ${conn.connection.host}`);
    
    return conn;
  } catch (err) {
    console.error(`Fehler bei der MongoDB-Verbindung: ${err.message}`);
    process.exit(1);
  }
};

// Modelle laden
const User = require('./server/models/User');
const Bar = require('./server/models/Bar');
const Drink = require('./server/models/Drink');
const Staff = require('./server/models/Staff');
const Supplier = require('./server/models/Supplier');
const Inventory = require('./server/models/Inventory');
const Sale = require('./server/models/Sale');
const Expense = require('./server/models/Expense');
const Income = require('./server/models/Income');

// Konsolen-Interface einrichten
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// E-Mail abfragen
const askForEmail = () => {
  return new Promise((resolve) => {
    rl.question('Bitte gib die E-Mail-Adresse des Benutzers ein: ', (email) => {
      resolve(email.trim());
    });
  });
};

// Confirm Data Creation
const confirmDataCreation = () => {
  return new Promise((resolve) => {
    rl.question('Sollen Dummy-Daten für diese Bar erstellt werden? (j/n): ', (answer) => {
      resolve(answer.toLowerCase() === 'j' || answer.toLowerCase() === 'ja');
    });
  });
};

// Mock-Daten für Getränke
const createMockDrinks = async (barId) => {
  const drinks = [
    {
      name: 'Mojito',
      category: 'cocktails',
      price: 8.50,
      cost: 2.35,
      ingredients: [{ name: 'Rum' }, { name: 'Minze' }, { name: 'Limette' }, { name: 'Zucker' }, { name: 'Soda' }],
      isActive: true,
      stock: 0,
      popular: true,
      bar: barId
    },
    {
      name: 'Bier vom Fass',
      category: 'beer',
      price: 3.80,
      cost: 1.20,
      ingredients: [{ name: 'Bier' }],
      isActive: true,
      stock: 48,
      popular: true,
      bar: barId
    },
    {
      name: 'Hauswein Rot',
      category: 'wine',
      price: 4.50,
      cost: 1.80,
      ingredients: [{ name: 'Rotwein' }],
      isActive: true,
      stock: 24,
      popular: true,
      bar: barId
    },
    {
      name: 'Gin Tonic',
      category: 'cocktails',
      price: 7.50,
      cost: 2.10,
      ingredients: [{ name: 'Gin' }, { name: 'Tonic Water' }, { name: 'Limette' }],
      isActive: true,
      stock: 0,
      popular: true,
      bar: barId
    },
    {
      name: 'Cola',
      category: 'softDrinks',
      price: 2.80,
      cost: 0.60,
      ingredients: [{ name: 'Cola' }],
      isActive: true,
      stock: 120,
      popular: true,
      bar: barId
    },
    {
      name: 'Whiskey',
      category: 'spirits',
      price: 6.50,
      cost: 2.20,
      ingredients: [{ name: 'Whiskey' }],
      isActive: true,
      stock: 18,
      popular: false,
      bar: barId
    },
    {
      name: 'Aperol Spritz',
      category: 'cocktails',
      price: 6.90,
      cost: 1.90,
      ingredients: [{ name: 'Aperol' }, { name: 'Prosecco' }, { name: 'Soda' }],
      isActive: true,
      stock: 0,
      popular: true,
      bar: barId
    },
    {
      name: 'Mineralwasser',
      category: 'softDrinks',
      price: 2.50,
      cost: 0.40,
      ingredients: [{ name: 'Mineralwasser' }],
      isActive: true,
      stock: 150,
      popular: false,
      bar: barId
    }
  ];

  console.log('Erstelle Getränke...');
  try {
    const createdDrinks = await Drink.create(drinks);
    console.log(`${createdDrinks.length} Getränke erstellt.`);
    return createdDrinks;
  } catch (error) {
    console.error('Fehler beim Erstellen der Getränke:', error);
    throw error;
  }
};

// Mock-Daten für Personal
const createMockStaff = async (barId) => {
  const staff = [
    {
      name: 'Max Mustermann',
      position: 'Barkeeper',
      role: 'bartender',
      hourlyRate: 15.50,
      hoursPerWeek: 30,
      startDate: '2021-05-15',
      phone: '+49 123 456789',
      email: 'max@example.com',
      isActive: true,
      bar: barId
    },
    {
      name: 'Lisa Schmidt',
      position: 'Managerin',
      role: 'manager',
      hourlyRate: 22.00,
      hoursPerWeek: 40,
      startDate: '2020-02-10',
      phone: '+49 123 456788',
      email: 'lisa@example.com',
      isActive: true,
      bar: barId
    },
    {
      name: 'Tom Müller',
      position: 'Kellner',
      role: 'waiter',
      hourlyRate: 14.00,
      hoursPerWeek: 25,
      startDate: '2022-01-05',
      phone: '+49 123 456787',
      email: 'tom@example.com',
      isActive: true,
      bar: barId
    },
    {
      name: 'Julia Wagner',
      position: 'Barkeeperin',
      role: 'bartender',
      hourlyRate: 16.00,
      hoursPerWeek: 35,
      startDate: '2021-11-10',
      phone: '+49 123 456786',
      email: 'julia@example.com',
      isActive: true,
      bar: barId
    },
    {
      name: 'Simon Koch',
      position: 'Küchenchef',
      role: 'chef',
      hourlyRate: 18.50,
      hoursPerWeek: 40,
      startDate: '2022-03-01',
      phone: '+49 123 456785',
      email: 'simon@example.com',
      isActive: true,
      bar: barId
    }
  ];

  console.log('Erstelle Personal...');
  try {
    const createdStaff = await Staff.create(staff);
    console.log(`${createdStaff.length} Mitarbeiter erstellt.`);
    return createdStaff;
  } catch (error) {
    console.error('Fehler beim Erstellen des Personals:', error);
    throw error;
  }
};

// Mock-Daten für Lieferanten
const createMockSuppliers = async (barId) => {
  const suppliers = [
    {
      name: 'Getränke Schmidt',
      contactPerson: 'Michael Schmidt',
      phone: '+49 123 456789',
      email: 'info@getraenke-schmidt.de',
      address: {
        street: 'Industriestraße 12',
        city: 'Berlin',
        postalCode: '10115',
        country: 'Deutschland'
      },
      notes: 'Liefert Dienstag und Freitag',
      categories: ['spirit', 'wine', 'beer'],
      bar: barId
    },
    {
      name: 'Brauerei Müller',
      contactPerson: 'Christina Müller',
      phone: '+49 123 456790',
      email: 'bestellung@brauerei-mueller.de',
      address: {
        street: 'Brauereiweg 5',
        city: 'Hamburg',
        postalCode: '20095',
        country: 'Deutschland'
      },
      notes: 'Mindestbestellwert 200€',
      categories: ['beer'],
      bar: barId
    },
    {
      name: 'Weinhandel Meyer',
      contactPerson: 'Robert Meyer',
      phone: '+49 123 456791',
      email: 'kontakt@weinhandel-meyer.de',
      address: {
        street: 'Weinbergstr. 8',
        city: 'Köln',
        postalCode: '50667',
        country: 'Deutschland'
      },
      notes: 'Spezialangebote jeden 1. des Monats',
      categories: ['wine'],
      bar: barId
    },
    {
      name: 'Großhandel König',
      contactPerson: 'Sabine König',
      phone: '+49 123 456792',
      email: 'service@grosshandel-koenig.de',
      address: {
        street: 'Handelsplatz 22',
        city: 'München',
        postalCode: '80331',
        country: 'Deutschland'
      },
      notes: 'Liefert auch Samstags (Aufpreis)',
      categories: ['mixer', 'fruit', 'other'],
      bar: barId
    }
  ];

  console.log('Erstelle Lieferanten...');
  try {
    const createdSuppliers = await Supplier.create(suppliers);
    console.log(`${createdSuppliers.length} Lieferanten erstellt.`);
    return createdSuppliers;
  } catch (error) {
    console.error('Fehler beim Erstellen der Lieferanten:', error);
    throw error;
  }
};

// Mock-Daten für Inventar
const createMockInventory = async (barId, suppliers) => {
  // Supplier IDs abrufen
  const getraenkeSchmidtId = suppliers.find(s => s.name === 'Getränke Schmidt')._id;
  const brauereiMuellerId = suppliers.find(s => s.name === 'Brauerei Müller')._id;
  const weinhandelMeyerId = suppliers.find(s => s.name === 'Weinhandel Meyer')._id;
  const grosshandelKoenigId = suppliers.find(s => s.name === 'Großhandel König')._id;

  // Gültige Einheiten: 'Flaschen', 'Kisten', 'Kästen', 'kg', 'liter', 'Stück', 'other'
  const inventory = [
    {
      name: 'Rum',
      category: 'spirits',
      quantity: 25,
      unit: 'Flaschen',
      minQuantity: 5,
      costPerUnit: 15.99,
      lastOrderDate: new Date('2023-03-15'),
      supplier: getraenkeSchmidtId,
      bar: barId
    },
    {
      name: 'Bier Fass',
      category: 'beer',
      quantity: 12,
      unit: 'Stück', // Geändert von 'Fässer' zu 'Stück'
      minQuantity: 3,
      costPerUnit: 87.50,
      lastOrderDate: new Date('2023-04-01'),
      supplier: brauereiMuellerId,
      bar: barId
    },
    {
      name: 'Rotwein',
      category: 'wine',
      quantity: 36,
      unit: 'Flaschen',
      minQuantity: 10,
      costPerUnit: 8.50,
      lastOrderDate: new Date('2023-03-25'),
      supplier: weinhandelMeyerId,
      bar: barId
    },
    {
      name: 'Gin',
      category: 'spirits',
      quantity: 18,
      unit: 'Flaschen',
      minQuantity: 4,
      costPerUnit: 22.99,
      lastOrderDate: new Date('2023-03-20'),
      supplier: getraenkeSchmidtId,
      bar: barId
    },
    {
      name: 'Cola',
      category: 'softDrinks',
      quantity: 120,
      unit: 'Flaschen',
      minQuantity: 30,
      costPerUnit: 0.89,
      lastOrderDate: new Date('2023-04-05'),
      supplier: grosshandelKoenigId,
      bar: barId
    }
  ];

  console.log('Erstelle Inventar...');
  try {
    const createdInventory = await Inventory.create(inventory);
    console.log(`${createdInventory.length} Inventareinträge erstellt.`);
    return createdInventory;
  } catch (error) {
    console.error('Fehler beim Erstellen des Inventars:', error);
    throw error;
  }
};

// Mock-Daten für Ausgaben
const createMockExpenses = async (barId) => {
  const expenses = [
    {
      category: 'rent',
      amount: 2500.00,
      date: new Date('2023-04-01'),
      description: 'Monatsmiete April',
      recurring: true,
      bar: barId
    },
    {
      category: 'utilities',
      amount: 850.00,
      date: new Date('2023-04-05'),
      description: 'Strom, Wasser, Heizung',
      recurring: true,
      bar: barId
    },
    {
      category: 'inventory',
      amount: 1200.00,
      date: new Date('2023-04-08'),
      description: 'Getränkelieferung',
      recurring: false,
      bar: barId
    },
    {
      category: 'salaries',
      amount: 8500.00,
      date: new Date('2023-04-15'),
      description: 'Gehälter April',
      recurring: true,
      bar: barId
    },
    {
      category: 'marketing',
      amount: 350.00,
      date: new Date('2023-04-12'),
      description: 'Social Media Werbung',
      recurring: true,
      bar: barId
    },
    {
      category: 'maintenance',
      amount: 180.00,
      date: new Date('2023-04-22'),
      description: 'Reparatur Kühlschrank',
      recurring: false,
      bar: barId
    }
  ];

  console.log('Erstelle Ausgaben...');
  try {
    const createdExpenses = await Expense.create(expenses);
    console.log(`${createdExpenses.length} Ausgaben erstellt.`);
    return createdExpenses;
  } catch (error) {
    console.error('Fehler beim Erstellen der Ausgaben:', error);
    throw error;
  }
};

// Mock-Daten für Einnahmen
const createMockIncome = async (barId) => {
  const income = [
    {
      category: 'bar',
      amount: 12500.00,
      date: new Date('2023-04-30'),
      description: 'Bareinnahmen April',
      bar: barId
    },
    {
      category: 'food',
      amount: 8700.00,
      date: new Date('2023-04-30'),
      description: 'Essensverkäufe April',
      bar: barId
    },
    {
      category: 'events',
      amount: 1800.00,
      date: new Date('2023-04-15'),
      description: 'Live-Musik Event',
      bar: barId
    },
    {
      category: 'bar',
      amount: 3200.00,
      date: new Date('2023-04-16'),
      description: 'Samstagseinnahmen',
      bar: barId
    }
  ];

  console.log('Erstelle Einnahmen...');
  try {
    const createdIncome = await Income.create(income);
    console.log(`${createdIncome.length} Einnahmen erstellt.`);
    return createdIncome;
  } catch (error) {
    console.error('Fehler beim Erstellen der Einnahmen:', error);
    throw error;
  }
};

// Mock-Daten für Verkäufe (arbeitet auch mit teilweise vorhandenen Daten)
const createMockSales = async (barId, drinks, staff) => {
  console.log('Erstelle Verkäufe...');
  try {
    // Standard-Getränkedaten, falls keine vorhandenen Getränke verfügbar sind
    const defaultDrinks = [
      { name: 'Bier', price: 3.80 },
      { name: 'Cocktail', price: 8.50 },
      { name: 'Wein', price: 4.50 },
      { name: 'Softdrink', price: 2.80 },
      { name: 'Wasser', price: 2.00 }
    ];
    
    // Speichere die Getränke-IDs und Name/Preis-Informationen
    const availableDrinks = [];
    
    // Wenn echte Getränke vorhanden sind, verwende deren IDs
    if (drinks && drinks.length > 0) {
      drinks.forEach(drink => {
        availableDrinks.push({
          id: drink._id,
          name: drink.name,
          price: drink.price
        });
      });
      console.log(`Verwende ${availableDrinks.length} existierende Getränke für Verkäufe`);
    } 
    // Ansonsten erstelle Stub-Einträge ohne IDs (nur mit Namen und Preisen)
    else {
      defaultDrinks.forEach((drink, index) => {
        availableDrinks.push({
          name: drink.name,
          price: drink.price
        });
      });
      console.log(`Verwende ${availableDrinks.length} Standard-Getränke für Verkäufe (ohne echte Getränke-IDs)`);
    }
    
    // Finde verfügbare Mitarbeiter oder erstelle Dummy-Daten
    let staffIds = [];
    if (staff && staff.length > 0) {
      staffIds = staff.map(s => s._id);
      console.log(`Verwende ${staffIds.length} existierende Mitarbeiter für Verkäufe`);
    }
    
    // Erstelle 10 Beispielverkäufe über einen Zeitraum von 5 Tagen
    const sales = [];
    const today = new Date();
    
    // Generiere Verkäufe für die letzten 5 Tage
    for (let day = 0; day < 5; day++) {
      // 2 Verkäufe pro Tag
      for (let i = 0; i < 2; i++) {
        // Zeitpunkt zwischen 12:00 und 23:00 Uhr
        const hour = 12 + Math.floor(Math.random() * 11);
        const minute = Math.floor(Math.random() * 60);
        
        // Datum berechnen (heute - 'day' Tage)
        const date = new Date(today);
        date.setDate(date.getDate() - day);
        date.setHours(hour, minute, 0, 0);
        
        // 1-3 Getränke pro Verkauf
        const numItems = 1 + Math.floor(Math.random() * 3);
        const items = [];
        let total = 0;
        
        // Getränke für diesen Verkauf auswählen
        for (let j = 0; j < numItems; j++) {
          // Zufälliges Getränk auswählen
          const drinkIndex = Math.floor(Math.random() * availableDrinks.length);
          const drink = availableDrinks[drinkIndex];
          
          // Zufällige Menge (1-5)
          const quantity = 1 + Math.floor(Math.random() * 5);
          const price = drink.price;
          
          // Getränk zum Verkauf hinzufügen
          const item = {
            name: drink.name,
            quantity: quantity,
            pricePerUnit: price
          };
          
          // Wenn eine Getränk-ID verfügbar ist, füge sie hinzu
          if (drink.id) {
            item.drinkId = drink.id;
          }
          
          items.push(item);
          total += quantity * price;
        }
        
        // Zahlung: entweder bar oder Karte
        const paymentMethod = Math.random() > 0.5 ? 'cash' : 'card';
        
        // Verkauf erstellen
        const sale = {
          date: date,
          items: items,
          total: parseFloat(total.toFixed(2)),
          paymentMethod: paymentMethod,
          notes: '',
          bar: barId
        };
        
        // Wenn Mitarbeiter verfügbar, füge einen zufälligen hinzu
        if (staffIds.length > 0) {
          const staffIndex = Math.floor(Math.random() * staffIds.length);
          sale.staffId = staffIds[staffIndex];
        }
        
        sales.push(sale);
      }
    }
    
    // Verkäufe in der Datenbank speichern
    const createdSales = await Sale.create(sales);
    console.log(`${createdSales.length} Verkäufe erstellt.`);
    return createdSales;
  } catch (error) {
    console.error('Fehler beim Erstellen der Verkäufe:', error);
    throw error;
  }
};

// Hauptfunktion
const main = async () => {
  try {
    // Verbindung zur Datenbank herstellen
    await connectDB();

    // E-Mail abfragen
    const email = await askForEmail();
    
    // Benutzer mit der E-Mail-Adresse suchen
    const user = await User.findOne({ email }).populate('bar');
    
    if (!user) {
      console.error(`Kein Benutzer mit der E-Mail-Adresse ${email} gefunden.`);
      rl.close();
      process.exit(1);
    }
    
    console.log(`Benutzer gefunden: ${user.name}`);
    
    // Prüfen, ob der Benutzer bereits eine Bar hat
    if (!user.bar) {
      console.error('Dieser Benutzer hat keine zugewiesene Bar. Bitte erstelle zuerst eine Bar für diesen Benutzer.');
      rl.close();
      process.exit(1);
    }
    
    console.log(`Bar gefunden: ${user.bar.name}`);
    
    // Bestätigung für das Erstellen von Dummy-Daten einholen
    const confirm = await confirmDataCreation();
    
    if (!confirm) {
      console.log('Vorgang abgebrochen. Es wurden keine Daten erstellt.');
      rl.close();
      process.exit(0);
    }
    
    // Referenz auf die Bar-ID
    const barId = user.bar._id;
    
    // Dummy-Daten erstellen mit Fehlerbehandlung für jeden Schritt
    let drinks = [], staff = [], suppliers = [], inventory = [], expenses = [], income = [], sales = [];
    let successCount = 0;
    
    try {
      drinks = await createMockDrinks(barId);
      successCount++;
      console.log(`✅ Getränke erfolgreich erstellt: ${drinks.length}`);
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Getränke:', error.message);
    }
    
    try {
      staff = await createMockStaff(barId);
      successCount++;
      console.log(`✅ Personal erfolgreich erstellt: ${staff.length}`);
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Personals:', error.message);
    }
    
    try {
      suppliers = await createMockSuppliers(barId);
      successCount++;
      console.log(`✅ Lieferanten erfolgreich erstellt: ${suppliers.length}`);
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Lieferanten:', error.message);
    }
    
    if (suppliers.length > 0) {
      try {
        inventory = await createMockInventory(barId, suppliers);
        successCount++;
        console.log(`✅ Inventareinträge erfolgreich erstellt: ${inventory.length}`);
      } catch (error) {
        console.error('❌ Fehler beim Erstellen des Inventars:', error.message);
      }
    } else {
      console.warn('⚠️ Keine Lieferanten vorhanden, überspringe Inventarerstellung');
    }
    
    try {
      expenses = await createMockExpenses(barId);
      successCount++;
      console.log(`✅ Ausgaben erfolgreich erstellt: ${expenses.length}`);
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Ausgaben:', error.message);
    }
    
    try {
      income = await createMockIncome(barId);
      successCount++;
      console.log(`✅ Einnahmen erfolgreich erstellt: ${income.length}`);
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Einnahmen:', error.message);
    }
    
    // Verkäufe immer erstellen, auch wenn keine Getränke oder Personal existieren
    try {
      sales = await createMockSales(barId, drinks, staff);
      successCount++;
      console.log(`✅ Verkäufe erfolgreich erstellt: ${sales.length}`);
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Verkäufe:', error.message);
    }
    
    if (successCount === 0) {
      console.error('⛔ Keine Dummy-Daten wurden erstellt. Bitte überprüfe die Fehler und versuche es erneut.');
    } else if (successCount < 7) {
      console.log(`⚠️ Einige Dummy-Daten wurden erfolgreich erstellt (${successCount}/7 Kategorien)`);
    } else {
      console.log('✅ Alle Dummy-Daten wurden erfolgreich erstellt!');
    }
    
    console.log(`
    Zusammenfassung:
    - ${drinks.length} Getränke
    - ${staff.length} Mitarbeiter
    - ${suppliers.length} Lieferanten
    - ${inventory.length} Inventareinträge
    - ${expenses.length} Ausgaben
    - ${income.length} Einnahmen
    - ${sales.length} Verkäufe
    `);
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('Ein allgemeiner Fehler ist aufgetreten:', error);
    rl.close();
    process.exit(1);
  }
};

// Skript starten
main();