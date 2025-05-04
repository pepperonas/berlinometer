/**
 * Seed-Skript zum Befüllen der Datenbank mit Beispieldaten
 * 
 * Verwendung: node server/scripts/seed.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Mock-Daten manuell laden, da ESM-Module im CommonJS-Kontext nicht importiert werden können
const mockDataPath = path.join(__dirname, '../../src/services/mockData.js');
const mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

// ES Modul-Exporte extrahieren
const extractDataFromESModule = (content, exportName) => {
  const regex = new RegExp(`export\\s+const\\s+${exportName}\\s*=\\s*([\\s\\S]*?);\\s*(\\/\\/|export|$)`, 'gm');
  const match = regex.exec(content);
  if (match && match[1]) {
    // Convert ES export to a valid JS object
    return eval(`(${match[1]})`);
  }
  return [];
};

const drinks = extractDataFromESModule(mockDataContent, 'drinks');
const staff = extractDataFromESModule(mockDataContent, 'staff');

// Import der Models
const Drink = require('../models/Drink');
const Staff = require('../models/Staff');

// Verbindung zur Datenbank herstellen
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {});
    console.log('MongoDB verbunden für Seed-Daten');
  } catch (err) {
    console.error(`Fehler bei der Verbindung zur MongoDB: ${err.message}`);
    process.exit(1);
  }
};

// Datenbank mit Beispieldaten befüllen
const seedDatabase = async () => {
  try {
    // Bestehende Daten löschen
    await Drink.deleteMany({});
    await Staff.deleteMany({});
    
    console.log('Bestehende Daten gelöscht');
    
    // Getränke hinzufügen
    const drinkPromises = drinks.map(drink => {
      // MongoDB-ID entfernen (falls vorhanden) und Daten konvertieren
      const { id, ...drinkData } = drink;
      
      // Zutaten als Objekt-Array formatieren
      const formattedIngredients = Array.isArray(drinkData.ingredients) 
        ? drinkData.ingredients.map(ingredient => {
            return typeof ingredient === 'string' 
              ? { name: ingredient } 
              : ingredient;
          })
        : [];
      
      return new Drink({
        ...drinkData,
        ingredients: formattedIngredients
      }).save();
    });
    
    await Promise.all(drinkPromises);
    console.log(`${drinks.length} Getränke hinzugefügt`);
    
    // Personal hinzufügen
    const staffPromises = staff.map(person => {
      // MongoDB-ID entfernen (falls vorhanden) und Daten konvertieren
      const { id, isActive, hourlyRate, hoursPerWeek, ...staffData } = person;
      
      // Datenkonvertierung für MongoDB
      const staffWithUpdates = {
        ...staffData,
        position: person.role, // Position wird aus role übernommen
        active: isActive,      // isActive wird zu active
        salary: hourlyRate * hoursPerWeek * 4 // Monatsgehalt berechnen
      };
      
      return new Staff(staffWithUpdates).save();
    });
    
    await Promise.all(staffPromises);
    console.log(`${staff.length} Mitarbeiter hinzugefügt`);
    
    console.log('Datenbank erfolgreich mit Beispieldaten befüllt');
    process.exit(0);
  } catch (err) {
    console.error(`Fehler beim Seeden der Datenbank: ${err.message}`);
    process.exit(1);
  }
};

// Ausführen des Skripts
connectDB().then(() => {
  seedDatabase();
});