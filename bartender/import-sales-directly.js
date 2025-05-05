/**
 * Direkte Verkaufsimport-Tool
 * 
 * Dieses Skript importiert Verkäufe direkt in die MongoDB-Datenbank,
 * ohne den normalen Server-Import-Prozess zu durchlaufen.
 */

const mongoose = require('mongoose');
const Sale = require('./server/models/Sale');
const Drink = require('./server/models/Drink');
const Staff = require('./server/models/Staff');

// CSV-Daten für den Import
const CSV_DATA = `Datum,Getränk,Menge,Preis,Zahlungsart,Mitarbeiter,Notizen
05.05.2025 11:59,Wein,1,5,Bargeld,Martin Pfeffer,
05.05.2025 12:03,Wein,1,5,Bargeld,Martin Pfeffer,`;

// Verbindung zur MongoDB herstellen
async function connectToMongoDB() {
  try {
    const mongoURI = 'mongodb://mongoAdmin:%23QGwODkgI7fx@localhost:27017/bartender?authSource=admin';
    await mongoose.connect(mongoURI);
    console.log('MongoDB verbunden!');
    return true;
  } catch (error) {
    console.error('Fehler bei der MongoDB-Verbindung:', error);
    return false;
  }
}

// CSV-Daten in JSON umwandeln
function parseCSV(csvData) {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');
  
  // Spaltenpositionen finden
  const dateIdx = headers.findIndex(h => h.toLowerCase().includes('datum'));
  const drinkIdx = headers.findIndex(h => h.toLowerCase().includes('getränk'));
  const qtyIdx = headers.findIndex(h => h.toLowerCase().includes('menge'));
  const priceIdx = headers.findIndex(h => h.toLowerCase().includes('preis'));
  const paymentIdx = headers.findIndex(h => h.toLowerCase().includes('zahlungsart'));
  const staffIdx = headers.findIndex(h => h.toLowerCase().includes('mitarbeiter'));
  const notesIdx = headers.findIndex(h => h.toLowerCase().includes('notizen'));
  
  // Validierung der Spalten
  if ([dateIdx, drinkIdx, qtyIdx, priceIdx].includes(-1)) {
    throw new Error(`Missing required columns! Found: Date(${dateIdx}), Drink(${drinkIdx}), Quantity(${qtyIdx}), Price(${priceIdx})`);
  }
  
  console.log(`Spalten gefunden: Datum(${dateIdx}), Getränk(${drinkIdx}), Menge(${qtyIdx}), Preis(${priceIdx}), Zahlungsart(${paymentIdx}), Mitarbeiter(${staffIdx}), Notizen(${notesIdx})`);
  
  // Datenzeilen verarbeiten
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Leere Zeilen überspringen
    
    const values = lines[i].split(',');
    
    // Datum parsen
    let date;
    const dateStr = values[dateIdx];
    if (dateStr.includes('.')) {
      // Deutsches Format (DD.MM.YYYY)
      const parts = dateStr.split(' ');
      const datePart = parts[0];
      const timePart = parts.length > 1 ? parts[1] : '00:00';
      
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
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) {
      console.warn(`Warnung: Ungültiges Datum in Zeile ${i+1}: ${dateStr}`);
      date = new Date(); // Fallback auf aktuelle Zeit
    }
    
    // Sonstige Werte
    const drinkName = values[drinkIdx];
    const quantity = parseFloat(values[qtyIdx]) || 1;
    const price = parseFloat(values[priceIdx]) || 0;
    const payment = paymentIdx >= 0 ? values[paymentIdx] : 'Bargeld';
    const staffName = staffIdx >= 0 ? values[staffIdx] : '';
    const notes = notesIdx >= 0 ? values[notesIdx] : '';
    
    // In Ergebnisarray einfügen
    result.push({
      date,
      drinkName,
      quantity,
      price,
      payment,
      staffName,
      notes
    });
  }
  
  return result;
}

// Verkäufe in die Datenbank importieren
async function importSales(salesData) {
  try {
    // Getränke und Mitarbeiter laden
    const drinks = await Drink.find();
    const staffMembers = await Staff.find();
    
    console.log(`Gefunden: ${drinks.length} Getränke, ${staffMembers.length} Mitarbeiter`);
    
    // Verkäufe importieren
    const importedSales = [];
    
    for (const sale of salesData) {
      // Getränk suchen
      const drink = drinks.find(d => 
        d.name.toLowerCase() === sale.drinkName.toLowerCase()
      );
      
      if (!drink) {
        console.warn(`Warnung: Getränk "${sale.drinkName}" nicht gefunden`);
        continue; // Ohne Getränk kein Verkauf
      }
      
      // Mitarbeiter suchen
      let staffId = undefined;
      if (sale.staffName) {
        const staff = staffMembers.find(s => 
          s.name.toLowerCase().includes(sale.staffName.toLowerCase())
        );
        
        if (staff) {
          staffId = staff._id;
          console.log(`Mitarbeiter "${sale.staffName}" gefunden: ${staffId}`);
        } else {
          console.warn(`Warnung: Mitarbeiter "${sale.staffName}" nicht gefunden`);
        }
      }
      
      // Verkauf erstellen
      const saleObj = {
        date: sale.date,
        items: [{
          drinkId: drink._id,
          name: sale.drinkName,
          quantity: sale.quantity,
          pricePerUnit: sale.price
        }],
        total: sale.quantity * sale.price,
        paymentMethod: sale.payment.toLowerCase().includes('karte') ? 'card' : 'cash',
        notes: sale.notes
      };
      
      if (staffId) {
        saleObj.staffId = staffId;
      }
      
      try {
        // In Datenbank speichern
        const newSale = new Sale(saleObj);
        const savedSale = await newSale.save();
        console.log(`Verkauf ${savedSale._id} gespeichert: ${sale.drinkName} (${sale.quantity}x)`);
        importedSales.push(savedSale);
      } catch (err) {
        console.error(`Fehler beim Speichern des Verkaufs für ${sale.drinkName}:`, err.message);
      }
    }
    
    return importedSales;
  } catch (error) {
    console.error('Fehler beim Importieren:', error);
    throw error;
  }
}

// Hauptfunktion
async function main() {
  try {
    // Mit MongoDB verbinden
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Abbruch: Verbindung zur MongoDB fehlgeschlagen');
      return;
    }
    
    // CSV parsen
    console.log('Verarbeite CSV-Daten...');
    const salesData = parseCSV(CSV_DATA);
    console.log(`${salesData.length} Verkäufe aus CSV extrahiert`);
    
    // In Datenbank importieren
    console.log('Importiere Verkäufe in die Datenbank...');
    const importedSales = await importSales(salesData);
    
    // Ergebnis anzeigen
    console.log(`\nImport abgeschlossen: ${importedSales.length} von ${salesData.length} Verkäufen erfolgreich importiert!`);
    
    // Verbindung schließen
    await mongoose.connection.close();
    console.log('MongoDB-Verbindung geschlossen');
    
  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
    
    // Verbindung schließen, falls offen
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB-Verbindung geschlossen');
    }
  }
}

// Programm ausführen
main();