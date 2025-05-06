/**
 * Bar Data Löschen Skript
 * Dieses Skript fragt nach einer E-Mail-Adresse, sucht den zugehörigen Benutzer,
 * und löscht alle Daten für diese Bar.
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

// Bestätigung für das Löschen einholen
const confirmDataDeletion = () => {
  return new Promise((resolve) => {
    rl.question('⚠️ WARNUNG: Sollen wirklich ALLE Daten für diese Bar gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden! (j/n): ', (answer) => {
      resolve(answer.toLowerCase() === 'j' || answer.toLowerCase() === 'ja');
    });
  });
};

// Löschen der Getränke einer Bar
const deleteDrinks = async (barId) => {
  try {
    const result = await Drink.deleteMany({ bar: barId });
    return result.deletedCount;
  } catch (error) {
    console.error('Fehler beim Löschen der Getränke:', error);
    throw error;
  }
};

// Löschen des Personals einer Bar
const deleteStaff = async (barId) => {
  try {
    const result = await Staff.deleteMany({ bar: barId });
    return result.deletedCount;
  } catch (error) {
    console.error('Fehler beim Löschen des Personals:', error);
    throw error;
  }
};

// Löschen der Lieferanten einer Bar
const deleteSuppliers = async (barId) => {
  try {
    const result = await Supplier.deleteMany({ bar: barId });
    return result.deletedCount;
  } catch (error) {
    console.error('Fehler beim Löschen der Lieferanten:', error);
    throw error;
  }
};

// Löschen des Inventars einer Bar
const deleteInventory = async (barId) => {
  try {
    const result = await Inventory.deleteMany({ bar: barId });
    return result.deletedCount;
  } catch (error) {
    console.error('Fehler beim Löschen des Inventars:', error);
    throw error;
  }
};

// Löschen der Ausgaben einer Bar
const deleteExpenses = async (barId) => {
  try {
    const result = await Expense.deleteMany({ bar: barId });
    return result.deletedCount;
  } catch (error) {
    console.error('Fehler beim Löschen der Ausgaben:', error);
    throw error;
  }
};

// Löschen der Einnahmen einer Bar
const deleteIncome = async (barId) => {
  try {
    const result = await Income.deleteMany({ bar: barId });
    return result.deletedCount;
  } catch (error) {
    console.error('Fehler beim Löschen der Einnahmen:', error);
    throw error;
  }
};

// Löschen der Verkäufe einer Bar
const deleteSales = async (barId) => {
  try {
    const result = await Sale.deleteMany({ bar: barId });
    return result.deletedCount;
  } catch (error) {
    console.error('Fehler beim Löschen der Verkäufe:', error);
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
    
    // Prüfen, ob der Benutzer eine Bar hat
    if (!user.bar) {
      console.error('Dieser Benutzer hat keine zugewiesene Bar. Keine Daten zu löschen.');
      rl.close();
      process.exit(1);
    }
    
    console.log(`Bar gefunden: ${user.bar.name}`);
    
    // Bestätigung für das Löschen einholen
    const confirm = await confirmDataDeletion();
    
    if (!confirm) {
      console.log('Vorgang abgebrochen. Es wurden keine Daten gelöscht.');
      rl.close();
      process.exit(0);
    }
    
    // Referenz auf die Bar-ID
    const barId = user.bar._id;
    
    // Daten löschen mit Fehlerbehandlung für jeden Schritt
    let deletedCounts = {
      drinks: 0,
      staff: 0,
      suppliers: 0,
      inventory: 0,
      expenses: 0,
      income: 0,
      sales: 0
    };
    let successCount = 0;
    
    try {
      deletedCounts.sales = await deleteSales(barId);
      successCount++;
      console.log(`✅ Verkäufe erfolgreich gelöscht: ${deletedCounts.sales}`);
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Verkäufe:', error.message);
    }
    
    try {
      deletedCounts.inventory = await deleteInventory(barId);
      successCount++;
      console.log(`✅ Inventareinträge erfolgreich gelöscht: ${deletedCounts.inventory}`);
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Inventars:', error.message);
    }
    
    try {
      deletedCounts.expenses = await deleteExpenses(barId);
      successCount++;
      console.log(`✅ Ausgaben erfolgreich gelöscht: ${deletedCounts.expenses}`);
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Ausgaben:', error.message);
    }
    
    try {
      deletedCounts.income = await deleteIncome(barId);
      successCount++;
      console.log(`✅ Einnahmen erfolgreich gelöscht: ${deletedCounts.income}`);
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Einnahmen:', error.message);
    }
    
    try {
      deletedCounts.suppliers = await deleteSuppliers(barId);
      successCount++;
      console.log(`✅ Lieferanten erfolgreich gelöscht: ${deletedCounts.suppliers}`);
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Lieferanten:', error.message);
    }
    
    try {
      deletedCounts.staff = await deleteStaff(barId);
      successCount++;
      console.log(`✅ Personal erfolgreich gelöscht: ${deletedCounts.staff}`);
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Personals:', error.message);
    }
    
    try {
      deletedCounts.drinks = await deleteDrinks(barId);
      successCount++;
      console.log(`✅ Getränke erfolgreich gelöscht: ${deletedCounts.drinks}`);
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Getränke:', error.message);
    }
    
    if (successCount === 0) {
      console.error('⛔ Es wurden keine Daten gelöscht. Bitte überprüfe die Fehler und versuche es erneut.');
    } else if (successCount < 7) {
      console.log(`⚠️ Einige Daten wurden erfolgreich gelöscht (${successCount}/7 Kategorien)`);
    } else {
      console.log('✅ Alle Daten wurden erfolgreich gelöscht!');
    }
    
    const totalDeleted = Object.values(deletedCounts).reduce((sum, val) => sum + val, 0);
    
    console.log(`
    Zusammenfassung:
    - ${deletedCounts.drinks} Getränke gelöscht
    - ${deletedCounts.staff} Mitarbeiter gelöscht
    - ${deletedCounts.suppliers} Lieferanten gelöscht
    - ${deletedCounts.inventory} Inventareinträge gelöscht
    - ${deletedCounts.expenses} Ausgaben gelöscht
    - ${deletedCounts.income} Einnahmen gelöscht
    - ${deletedCounts.sales} Verkäufe gelöscht
    ---------------------------
    Insgesamt ${totalDeleted} Einträge gelöscht
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