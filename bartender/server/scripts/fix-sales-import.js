/**
 * Fix-Skript für den CSV-Import von Verkäufen
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');
const Drink = require('../models/Drink');
const Sale = require('../models/Sale');
const Staff = require('../models/Staff');

// Beispiel-CSV-Daten zum Testen
const csvData = `Datum,Getränk,Menge,Preis,Zahlungsart,Mitarbeiter,Notizen
05.05.2025 11:59,Wein,1,5,Bargeld,Martin Pfeffer,
05.05.2025 12:03,Wein,1,5,Bargeld,Martin Pfeffer,`;

// Hauptfunktion zum Testen und Beheben des CSV-Imports
const main = async () => {
  try {
    // Mit Datenbank verbinden
    await connectDB();
    console.log('MongoDB verbunden');
    
    // Vorhandene Getränke abrufen
    const drinks = await Drink.find().sort({ name: 1 });
    console.log(`${drinks.length} Getränke in der Datenbank gefunden`);
    drinks.forEach(drink => {
      console.log(`- ${drink.name} (ID: ${drink._id}, Preis: ${drink.price})`);
    });
    
    // Vorhandene Mitarbeiter abrufen
    const staffMembers = await Staff.find().sort({ name: 1 });
    console.log(`${staffMembers.length} Mitarbeiter in der Datenbank gefunden`);
    staffMembers.forEach(staff => {
      console.log(`- ${staff.name} (ID: ${staff._id})`);
    });
    
    console.log('\n=== CSV-Importtest ===');
    console.log('CSV-Daten:', csvData);
    
    // CSV-Daten manuell parsen
    const lines = csvData.trim().split('\n');
    console.log(`${lines.length} Zeilen gefunden (inkl. Header)`);
    
    if (lines.length < 2) {
      console.error('Fehler: CSV muss mindestens Header + 1 Datenzeile enthalten');
      return;
    }
    
    // Header parsen
    const header = lines[0].split(',');
    console.log('Header:', header);
    
    // Indizes wichtiger Felder finden
    const dateIndex = header.findIndex(col => col.toLowerCase().includes('datum'));
    const drinkIndex = header.findIndex(col => col.toLowerCase().includes('getränk') || col.toLowerCase().includes('produkt'));
    const quantityIndex = header.findIndex(col => col.toLowerCase().includes('menge'));
    const priceIndex = header.findIndex(col => col.toLowerCase().includes('preis'));
    const paymentIndex = header.findIndex(col => col.toLowerCase().includes('zahlungsart') || col.toLowerCase().includes('zahlung'));
    const staffIndex = header.findIndex(col => col.toLowerCase().includes('mitarbeiter') || col.toLowerCase().includes('personal'));
    const notesIndex = header.findIndex(col => col.toLowerCase().includes('notizen') || col.toLowerCase().includes('bemerkung'));
    
    console.log('Gefundene Indizes:');
    console.log(`- Datum: ${dateIndex}`);
    console.log(`- Getränk: ${drinkIndex}`);
    console.log(`- Menge: ${quantityIndex}`);
    console.log(`- Preis: ${priceIndex}`);
    console.log(`- Zahlungsart: ${paymentIndex}`);
    console.log(`- Mitarbeiter: ${staffIndex}`);
    console.log(`- Notizen: ${notesIndex}`);
    
    // Verkäufe vorbereiten
    const salesRecords = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Leere Zeilen überspringen
      
      const values = lines[i].split(',');
      if (values.length < Math.max(dateIndex, drinkIndex, quantityIndex, priceIndex) + 1) {
        console.warn(`Warnung: Zeile ${i} hat nicht genügend Felder`);
        continue;
      }
      
      // Werte extrahieren
      const dateStr = values[dateIndex];
      const drinkName = values[drinkIndex];
      const quantity = parseFloat(values[quantityIndex]) || 1;
      const price = parseFloat(values[priceIndex]) || 0;
      const payment = paymentIndex !== -1 && values[paymentIndex] ? values[paymentIndex] : 'Bargeld';
      const staffName = staffIndex !== -1 && values[staffIndex] ? values[staffIndex] : '';
      const notes = notesIndex !== -1 && values[notesIndex] ? values[notesIndex] : '';
      
      console.log(`Zeile ${i} Werte:`);
      console.log(`- Datum: ${dateStr}`);
      console.log(`- Getränk: ${drinkName}`);
      console.log(`- Menge: ${quantity}`);
      console.log(`- Preis: ${price}`);
      console.log(`- Zahlung: ${payment}`);
      console.log(`- Mitarbeiter: ${staffName}`);
      console.log(`- Notizen: ${notes}`);
      
      // Datum parsen
      let date;
      try {
        if (dateStr.includes('.')) {
          // Deutsches Format (dd.mm.yyyy oder dd.mm.yyyy HH:MM)
          const dateTimeParts = dateStr.split(' ');
          const datePart = dateTimeParts[0];
          const timePart = dateTimeParts.length > 1 ? dateTimeParts[1] : '00:00';
          
          const [day, month, year] = datePart.split('.');
          const [hours, minutes] = timePart.split(':');
          
          date = new Date(
            parseInt(year), 
            parseInt(month) - 1, 
            parseInt(day),
            parseInt(hours || 0),
            parseInt(minutes || 0)
          );
        } else {
          // ISO- oder amerikanisches Format
          date = new Date(dateStr);
        }
        
        if (isNaN(date.getTime())) {
          console.warn(`Warnung: Ungültiges Datum '${dateStr}', verwende aktuelles Datum`);
          date = new Date();
        }
      } catch (e) {
        console.warn(`Fehler beim Parsen des Datums '${dateStr}': ${e.message}`);
        date = new Date();
      }
      
      console.log(`Geparstes Datum: ${date.toISOString()}`);
      
      // Getränk in der Datenbank suchen
      const drink = drinks.find(d => 
        d.name.toLowerCase() === drinkName.toLowerCase()
      );
      
      if (!drink) {
        console.warn(`Warnung: Getränk '${drinkName}' nicht in der Datenbank gefunden`);
      } else {
        console.log(`Getränk '${drinkName}' gefunden, ID: ${drink._id}`);
      }
      
      // Mitarbeiter in der Datenbank suchen
      let staffId = null;
      if (staffName) {
        const staff = staffMembers.find(s => 
          s.name.toLowerCase().includes(staffName.toLowerCase())
        );
        
        if (staff) {
          staffId = staff._id;
          console.log(`Mitarbeiter '${staffName}' gefunden, ID: ${staffId}`);
        } else {
          console.warn(`Warnung: Mitarbeiter '${staffName}' nicht in der Datenbank gefunden`);
        }
      }
      
      // Zahlungsmethode bestimmen
      const paymentMethod = payment.toLowerCase().includes('karte') ? 'card' : 'cash';
      
      // Verkaufsdatensatz erstellen
      const saleRecord = {
        date: date,
        items: [{
          drinkId: drink ? drink._id : undefined,
          name: drinkName,
          quantity: quantity,
          pricePerUnit: price
        }],
        total: quantity * price,
        paymentMethod: paymentMethod,
        staffId: staffId,
        notes: notes
      };
      
      // Zum Array hinzufügen
      salesRecords.push(saleRecord);
    }
    
    console.log(`\n${salesRecords.length} Verkaufsdatensätze vorbereitet`);
    
    // Verkäufe in die Datenbank einfügen
    console.log('\n=== Verkäufe in die Datenbank einfügen ===');
    const importedSales = [];
    
    for (const saleData of salesRecords) {
      try {
        // Verkauf speichern
        console.log(`Speichere Verkauf: ${JSON.stringify(saleData, null, 2)}`);
        
        // Prüfen, ob drinkId eine gültige MongoDB-ID ist
        if (saleData.items[0].drinkId) {
          const isValidId = mongoose.Types.ObjectId.isValid(saleData.items[0].drinkId);
          console.log(`Ist drinkId ${saleData.items[0].drinkId} eine gültige ObjectId? ${isValidId}`);
          
          if (!isValidId) {
            console.warn('Warnung: Ungültige drinkId, wird entfernt');
            delete saleData.items[0].drinkId;
          }
        } else {
          console.warn('Warnung: Keine drinkId vorhanden');
        }
        
        // Verkauf speichern
        const newSale = new Sale(saleData);
        const savedSale = await newSale.save();
        importedSales.push(savedSale);
        console.log(`Verkauf erfolgreich gespeichert, ID: ${savedSale._id}`);
      } catch (error) {
        console.error(`Fehler beim Speichern des Verkaufs:`, error);
      }
    }
    
    console.log(`\n${importedSales.length} von ${salesRecords.length} Verkäufen erfolgreich importiert`);
    
    // Verbindung schließen
    await mongoose.connection.close();
    console.log('Datenbankverbindung geschlossen');
    
  } catch (error) {
    console.error('Fehler im Hauptprogramm:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
  }
};

// Programm ausführen
main();