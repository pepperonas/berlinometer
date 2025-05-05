/**
 * Setup-Skript für Finanzen-Module (direkte Ausführung)
 * 
 * Dieses Skript erstellt MongoDB-Collections für Finanzen
 * und fügt Beispieldaten ein, wenn diese noch nicht vorhanden sind.
 * Es verwendet die Datenbankverbindung aus der Hauptanwendung.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');
const { EXPENSE_CATEGORIES, INCOME_CATEGORIES } = require('../utils/constants');

console.log('Starte Einrichtung der Finanz-Tabellen...');

// Import models after ensuring they exist
let Expense, Income;
try {
  Expense = require('../models/Expense');
  Income = require('../models/Income');
} catch (err) {
  console.error('Fehler beim Laden der Modelle:', err);
  process.exit(1);
}

// Hilfsfunktion zum sicheren Abrufen von Collections
const safeGetCollection = async (collectionName) => {
  try {
    const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();
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
      return true;
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
    return true;
  } catch (err) {
    console.error('Fehler beim Erstellen der Beispiel-Ausgaben:', err);
    return false;
  }
};

// Erstelle Beispiel-Einnahmen
const createSampleIncome = async () => {
  try {
    // Prüfen, ob bereits Einnahmen existieren
    const incomeCount = await Income.countDocuments();
    if (incomeCount > 0) {
      console.log(`Collection "incomes" hat bereits ${incomeCount} Dokumente. Überspringe Beispiel-Erstellung.`);
      return true;
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
    return true;
  } catch (err) {
    console.error('Fehler beim Erstellen der Beispiel-Einnahmen:', err);
    return false;
  }
};

// Zeige Sammlungsinformationen an
const showCollectionInfo = async () => {
  try {
    const expenseCount = await Expense.countDocuments();
    const incomeCount = await Income.countDocuments();
    
    console.log('\n=== Finanzen Collections Status ===');
    console.log(`Ausgaben: ${expenseCount} Einträge`);
    console.log(`Einnahmen: ${incomeCount} Einträge`);
    
    if (expenseCount > 0) {
      const expenses = await Expense.find().sort({ date: -1 }).limit(3);
      console.log(`\nNeueste Ausgaben Beispiele (${Math.min(3, expenses.length)} von ${expenseCount}):`);
      expenses.forEach((expense, index) => {
        console.log(`\nAusgabe ${index + 1}:`);
        console.log(`Kategorie: ${EXPENSE_CATEGORIES.find(c => c.id === expense.category)?.name || expense.category}`);
        console.log(`Betrag: ${expense.amount.toFixed(2)} €`);
        console.log(`Datum: ${expense.date.toLocaleDateString('de-DE')}`);
        console.log(`Beschreibung: ${expense.description}`);
      });
    }
    
    if (incomeCount > 0) {
      const income = await Income.find().sort({ date: -1 }).limit(3);
      console.log(`\nNeueste Einnahmen Beispiele (${Math.min(3, income.length)} von ${incomeCount}):`);
      income.forEach((inc, index) => {
        console.log(`\nEinnahme ${index + 1}:`);
        console.log(`Kategorie: ${INCOME_CATEGORIES.find(c => c.id === inc.category)?.name || inc.category}`);
        console.log(`Betrag: ${inc.amount.toFixed(2)} €`);
        console.log(`Datum: ${inc.date.toLocaleDateString('de-DE')}`);
        console.log(`Beschreibung: ${inc.description}`);
      });
    }
    
    return true;
  } catch (err) {
    console.error('Fehler beim Anzeigen der Collections-Informationen:', err);
    return false;
  }
};

// Setup-Funktion
const setupFinancesDB = async () => {
  try {
    // Verbindung zur Datenbank herstellen
    await connectDB();
    console.log('MongoDB verbunden');
    
    // Collections erstellen, falls nicht vorhanden
    const expensesExists = await safeGetCollection('expenses');
    const incomesExists = await safeGetCollection('incomes');
    
    console.log(`Collection "expenses" existiert: ${expensesExists}`);
    console.log(`Collection "incomes" existiert: ${incomesExists}`);
    
    // Beispieldaten erstellen
    await createSampleExpenses();
    await createSampleIncome();
    
    // Informationen anzeigen
    await showCollectionInfo();
    
    console.log('\nFinanzen-Datenbank erfolgreich eingerichtet!');
    console.log('Bitte starten Sie den Server neu, um die Änderungen zu übernehmen.');
    
    // Verbindung schließen
    await mongoose.connection.close();
    console.log('Datenbankverbindung geschlossen');
    
  } catch (err) {
    console.error('Fehler beim Einrichten der Finanz-Tabellen:', err);
  }
};

// Skript ausführen
setupFinancesDB();