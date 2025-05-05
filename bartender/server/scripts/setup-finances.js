/**
 * Setup-Skript für Finanzen-Module
 * 
 * Prüft, ob die Collections "expenses" und "income" existieren
 * Erstellt sie, falls sie nicht existieren
 * Fügt Beispieldatensätze hinzu, falls gewünscht
 */

const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const { EXPENSE_CATEGORIES, INCOME_CATEGORIES } = require('../utils/constants');

// MongoDB-Verbindung herstellen
const connectDB = async () => {
  try {
    // Direkte Verbindungs-URI mit Authentifizierung
    const mongoURI = 'mongodb://mongoAdmin:%23QGwODkgI7fx@localhost:27017/bartender?authSource=admin';

    console.log('Verbindung zur MongoDB herstellen...');

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
    console.error(`Fehler bei der Verbindung zur MongoDB: ${err.message}`);
    process.exit(1);
  }
};

// Prüfe, ob eine Collection existiert
const collectionExists = async (db, collectionName) => {
  try {
    const collections = await db.listCollections({ name: collectionName }).toArray();
    return collections.length > 0;
  } catch (err) {
    console.error(`Fehler beim Prüfen der Collection "${collectionName}":`, err);
    return false;
  }
};

// Erstelle Beispiel-Ausgaben
const createSampleExpenses = async () => {
  try {
    // Prüfen, ob bereits Ausgaben existieren
    const expenseCount = await Expense.countDocuments();
    if (expenseCount > 0) {
      console.log(`Collection "expenses" hat bereits ${expenseCount} Dokumente. Überspringe Beispiel-Erstellung.`);
      return;
    }

    console.log('Erstelle Beispiel-Ausgaben...');

    // Erstelle verschiedene Beispiel-Ausgaben aus unterschiedlichen Kategorien
    const sampleExpenses = [
      {
        category: 'rent',
        amount: 1500,
        date: new Date(2023, 10, 1), // 1. November 2023
        description: 'Monatsmiete November',
        recurring: true
      },
      {
        category: 'utilities',
        amount: 350,
        date: new Date(2023, 10, 5), // 5. November 2023
        description: 'Strom und Wasser',
        recurring: true
      },
      {
        category: 'inventory',
        amount: 750,
        date: new Date(2023, 10, 10), // 10. November 2023
        description: 'Neue Gläser und Barequipment',
        recurring: false
      },
      {
        category: 'salaries',
        amount: 3200,
        date: new Date(2023, 10, 15), // 15. November 2023
        description: 'Gehälter Personal November',
        recurring: true
      },
      {
        category: 'marketing',
        amount: 200,
        date: new Date(2023, 10, 20), // 20. November 2023
        description: 'Social Media Werbung',
        recurring: false
      }
    ];

    // In die Datenbank einfügen
    await Expense.insertMany(sampleExpenses);
    console.log(`${sampleExpenses.length} Beispiel-Ausgaben erfolgreich erstellt.`);
  } catch (err) {
    console.error('Fehler beim Erstellen der Beispiel-Ausgaben:', err);
  }
};

// Erstelle Beispiel-Einnahmen
const createSampleIncome = async () => {
  try {
    // Prüfen, ob bereits Einnahmen existieren
    const incomeCount = await Income.countDocuments();
    if (incomeCount > 0) {
      console.log(`Collection "incomes" hat bereits ${incomeCount} Dokumente. Überspringe Beispiel-Erstellung.`);
      return;
    }

    console.log('Erstelle Beispiel-Einnahmen...');

    // Erstelle verschiedene Beispiel-Einnahmen aus unterschiedlichen Kategorien
    const sampleIncome = [
      {
        category: 'bar',
        amount: 2800,
        date: new Date(2023, 10, 30), // 30. November 2023
        description: 'Bar-Einnahmen November'
      },
      {
        category: 'food',
        amount: 1200,
        date: new Date(2023, 10, 30), // 30. November 2023
        description: 'Essen-Verkäufe November'
      },
      {
        category: 'events',
        amount: 800,
        date: new Date(2023, 10, 25), // 25. November 2023
        description: 'Firmenfeier Schmidt GmbH'
      },
      {
        category: 'merchandise',
        amount: 150,
        date: new Date(2023, 10, 28), // 28. November 2023
        description: 'T-Shirt und Gläser Verkauf'
      },
      {
        category: 'gifts',
        amount: 300,
        date: new Date(2023, 10, 15), // 15. November 2023
        description: 'Gutschein-Verkäufe'
      }
    ];

    // In die Datenbank einfügen
    await Income.insertMany(sampleIncome);
    console.log(`${sampleIncome.length} Beispiel-Einnahmen erfolgreich erstellt.`);
  } catch (err) {
    console.error('Fehler beim Erstellen der Beispiel-Einnahmen:', err);
  }
};

// Hauptfunktion
const main = async () => {
  let connection = null;
  
  try {
    // Verbinde mit MongoDB
    connection = await connectDB();
    const db = connection.connection.db;
    
    // Prüfe, ob die Collections existieren
    const expensesExists = await collectionExists(db, 'expenses');
    const incomeExists = await collectionExists(db, 'incomes');
    
    console.log(`Collection "expenses" existiert: ${expensesExists}`);
    console.log(`Collection "incomes" existiert: ${incomeExists}`);
    
    // Erstelle Beispieldaten
    await createSampleExpenses();
    await createSampleIncome();
    
    // Prüfe die erstellten Collections
    console.log('\n=== Finanzen Collections Status ===');
    
    const expenses = await Expense.find().sort({ date: -1 }).limit(3);
    console.log(`Ausgaben: ${expenses.length} Beispiele angezeigt (${await Expense.countDocuments()} insgesamt)`);
    expenses.forEach((expense, index) => {
      console.log(`\nAusgabe ${index + 1}:`);
      console.log(`Kategorie: ${EXPENSE_CATEGORIES.find(c => c.id === expense.category)?.name || expense.category}`);
      console.log(`Betrag: ${expense.amount.toFixed(2)} €`);
      console.log(`Datum: ${expense.date.toLocaleDateString('de-DE')}`);
      console.log(`Beschreibung: ${expense.description}`);
    });
    
    const income = await Income.find().sort({ date: -1 }).limit(3);
    console.log(`\nEinnahmen: ${income.length} Beispiele angezeigt (${await Income.countDocuments()} insgesamt)`);
    income.forEach((inc, index) => {
      console.log(`\nEinnahme ${index + 1}:`);
      console.log(`Kategorie: ${INCOME_CATEGORIES.find(c => c.id === inc.category)?.name || inc.category}`);
      console.log(`Betrag: ${inc.amount.toFixed(2)} €`);
      console.log(`Datum: ${inc.date.toLocaleDateString('de-DE')}`);
      console.log(`Beschreibung: ${inc.description}`);
    });
    
    console.log('\nFinanzen-Setup erfolgreich abgeschlossen!');
  } catch (err) {
    console.error('Fehler beim Finanzen-Setup:', err);
  } finally {
    // Verbindung schließen
    if (connection) {
      await mongoose.connection.close();
      console.log('Datenbankverbindung geschlossen');
    }
  }
};

// Führe das Hauptprogramm aus
main().catch(console.error);