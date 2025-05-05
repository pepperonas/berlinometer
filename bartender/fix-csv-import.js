/**
 * CSV-Import-Reparaturtool
 * 
 * Dieses Skript importiert eine CSV-Datei direkt in die Datenbank,
 * ohne den Server-Import zu verwenden.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Modelle importieren
const Sale = require('./server/models/Sale');
const Drink = require('./server/models/Drink');
const Staff = require('./server/models/Staff');

// MongoDB-Verbindung herstellen
const connectDB = async () => {
  try {
    // Die URI aus der Umgebungsvariable oder der config verwenden
    // Falls die Verbindungsdetails direkt bekannt sind, können sie hier eingefügt werden
    const mongoURI = process.env.MONGO_URI || 'mongodb://mongoAdmin:%23QGwODkgI7fx@localhost:27017/bartender?authSource=admin';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB verbunden');
    return true;
  } catch (err) {
    console.error('Fehler bei MongoDB-Verbindung:', err.message);
    process.exit(1);
  }
};

// CSV-Datei verarbeiten
const processCSV = async (csvContent) => {
  try {
    // Zeilen aufteilen
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      console.error('Fehler: CSV-Datei hat nicht genügend Zeilen');
      return false;
    }
    
    // Header und Indizes finden
    const header = lines[0].split(',');
    const dateIndex = header.findIndex(col => col.toLowerCase().includes('datum'));
    const drinkIndex = header.findIndex(col => col.toLowerCase().includes('getränk') || col.toLowerCase().includes('produkt'));
    const quantityIndex = header.findIndex(col => col.toLowerCase().includes('menge'));
    const priceIndex = header.findIndex(col => col.toLowerCase().includes('preis'));
    const paymentIndex = header.findIndex(col => col.toLowerCase().includes('zahlungsart') || col.toLowerCase().includes('zahlung'));
    const staffIndex = header.findIndex(col => col.toLowerCase().includes('mitarbeiter') || col.toLowerCase().includes('personal'));
    const notesIndex = header.findIndex(col => col.toLowerCase().includes('notizen') || col.toLowerCase().includes('bemerkung'));
    
    // Checks
    if (dateIndex === -1 || drinkIndex === -1 || quantityIndex === -1 || priceIndex === -1) {
      console.error('Fehler: Erforderliche Spalten fehlen in der CSV-Datei');
      console.log('Gefundene Indizes:');
      console.log(`Datum: ${dateIndex}, Getränk: ${drinkIndex}, Menge: ${quantityIndex}, Preis: ${priceIndex}`);
      console.log(`Zahlung: ${paymentIndex}, Mitarbeiter: ${staffIndex}, Notizen: ${notesIndex}`);
      return false;
    }
    
    // Getränke und Mitarbeiter laden
    const drinks = await Drink.find();
    const staff = await Staff.find();
    
    console.log(`Gefunden: ${drinks.length} Getränke und ${staff.length} Mitarbeiter`);
    
    // Daten verarbeiten
    const sales = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',');
      
      // Daten extrahieren
      const dateStr = values[dateIndex];
      const drinkName = values[drinkIndex];
      const quantity = parseFloat(values[quantityIndex]) || 1;
      const price = parseFloat(values[priceIndex]) || 0;
      const payment = paymentIndex !== -1 ? values[paymentIndex] : 'Bargeld';
      const staffName = staffIndex !== -1 ? values[staffIndex] : '';
      const notes = notesIndex !== -1 ? values[notesIndex] : '';
      
      // Datum parsen
      let date;
      try {
        if (dateStr.includes('.')) {
          // Deutsches Format
          const dateParts = dateStr.split(' ');
          const [day, month, year] = dateParts[0].split('.');
          
          // Zeit extrahieren, falls vorhanden
          let hours = 0, minutes = 0;
          if (dateParts.length > 1 && dateParts[1].includes(':')) {
            [hours, minutes] = dateParts[1].split(':').map(Number);
          }
          
          date = new Date(+year, +month - 1, +day, hours, minutes);
        } else {
          // Anderes Format
          date = new Date(dateStr);
        }
        
        if (isNaN(date.getTime())) {
          console.warn(`Ungültiges Datum in Zeile ${i}: ${dateStr}, verwende aktuelles Datum`);
          date = new Date();
        }
      } catch (e) {
        console.warn(`Fehler beim Parsen des Datums in Zeile ${i}: ${e.message}`);
        date = new Date();
      }
      
      // Getränk finden
      const drink = drinks.find(d => d.name.toLowerCase() === drinkName.toLowerCase());
      let drinkId = null;
      
      if (drink) {
        drinkId = drink._id;
        console.log(`Getränk '${drinkName}' gefunden, ID: ${drinkId}`);
      } else {
        console.warn(`Warnung: Getränk '${drinkName}' nicht gefunden`);
      }
      
      // Mitarbeiter finden
      let staffId = null;
      if (staffName) {
        const member = staff.find(s => s.name.toLowerCase().includes(staffName.toLowerCase()));
        if (member) {
          staffId = member._id;
          console.log(`Mitarbeiter '${staffName}' gefunden, ID: ${staffId}`);
        } else {
          console.warn(`Warnung: Mitarbeiter '${staffName}' nicht gefunden`);
        }
      }
      
      // Verkaufsobjekt erstellen
      const saleData = {
        date: date,
        items: [{
          drinkId: drinkId,
          name: drinkName,
          quantity: quantity,
          pricePerUnit: price
        }],
        total: quantity * price,
        paymentMethod: payment.toLowerCase().includes('karte') ? 'card' : 'cash',
        notes: notes
      };
      
      if (staffId) {
        saleData.staffId = staffId;
      }
      
      sales.push(saleData);
    }
    
    console.log(`CSV erfolgreich verarbeitet: ${sales.length} Verkäufe vorbereitet`);
    return sales;
  } catch (err) {
    console.error('Fehler bei der CSV-Verarbeitung:', err);
    return false;
  }
};

// Verkäufe in die Datenbank einfügen
const importSales = async (sales) => {
  const results = [];
  
  for (const sale of sales) {
    try {
      const newSale = new Sale(sale);
      const savedSale = await newSale.save();
      console.log(`Verkauf für ${sale.items[0].name} gespeichert, ID: ${savedSale._id}`);
      results.push(savedSale);
    } catch (err) {
      console.error(`Fehler beim Speichern des Verkaufs für ${sale.items[0].name}:`, err.message);
    }
  }
  
  console.log(`${results.length} von ${sales.length} Verkäufen erfolgreich importiert`);
  return results;
};

// Hauptfunktion
const main = async () => {
  // CSV-Daten hier einfügen
  const csvContent = `Datum,Getränk,Menge,Preis,Zahlungsart,Mitarbeiter,Notizen
05.05.2025 11:59,Wein,1,5,Bargeld,Martin Pfeffer,
05.05.2025 12:03,Wein,1,5,Bargeld,Martin Pfeffer,`;
  
  try {
    // Mit der Datenbank verbinden
    await connectDB();
    
    // CSV verarbeiten
    const sales = await processCSV(csvContent);
    
    if (!sales || sales.length === 0) {
      console.error('Keine Verkäufe zum Importieren gefunden');
      await mongoose.connection.close();
      return;
    }
    
    // Verkäufe importieren
    const importedSales = await importSales(sales);
    
    // Verbindung schließen
    await mongoose.connection.close();
    console.log('CSV-Import abgeschlossen');
  } catch (err) {
    console.error('Unerwarteter Fehler:', err);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
  }
};

// Programm ausführen
main();