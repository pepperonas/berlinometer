/**
 * Verbesserter Sales Import Handler
 * Kann in die bestehende sales.js importiert werden
 */

const Drink = require('../models/Drink');
const Staff = require('../models/Staff');
const Sale = require('../models/Sale');

/**
 * Verbesserte CSV-Import-Funktion für Verkäufe
 */
async function handleCSVImport(csvData) {
  console.log(`CSV import started, parsing ${csvData.length} bytes`);
  
  try {
    // CSV in Zeilen splitten
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Invalid CSV format: needs at least header and one data row');
    }
    
    // Header parsen und wichtige Spalten identifizieren
    const header = lines[0].split(',');
    console.log('CSV Header:', header);
    
    const dateIdx = header.findIndex(h => h.toLowerCase().includes('datum'));
    const drinkIdx = header.findIndex(h => h.toLowerCase().includes('getränk'));
    const qtyIdx = header.findIndex(h => h.toLowerCase().includes('menge'));
    const priceIdx = header.findIndex(h => h.toLowerCase().includes('preis'));
    const paymentIdx = header.findIndex(h => h.toLowerCase().includes('zahlungsart'));
    const staffIdx = header.findIndex(h => h.toLowerCase().includes('mitarbeiter'));
    const notesIdx = header.findIndex(h => h.toLowerCase().includes('notizen'));
    
    // Prüfen, ob Pflichtfelder vorhanden sind
    if (dateIdx === -1 || drinkIdx === -1 || qtyIdx === -1 || priceIdx === -1) {
      const missingFields = [];
      if (dateIdx === -1) missingFields.push('Datum');
      if (drinkIdx === -1) missingFields.push('Getränk');
      if (qtyIdx === -1) missingFields.push('Menge');
      if (priceIdx === -1) missingFields.push('Preis');
      
      throw new Error(`CSV format invalid: missing required columns (${missingFields.join(', ')})`);
    }
    
    // Alle Getränke und Mitarbeiter im Voraus laden
    console.log('Loading drinks and staff from database...');
    const drinks = await Drink.find();
    const staffMembers = await Staff.find();
    console.log(`Loaded ${drinks.length} drinks and ${staffMembers.length} staff members`);
    
    // Verkäufe importieren
    const importedSales = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Leere Zeilen ignorieren
      
      const values = line.split(',');
      
      // Daten extrahieren
      const dateStr = values[dateIdx];
      const drinkName = values[drinkIdx];
      const quantity = parseFloat(values[qtyIdx]) || 1;
      const price = parseFloat(values[priceIdx]) || 0;
      const payment = paymentIdx >= 0 ? values[paymentIdx] : 'Bargeld';
      const staffName = staffIdx >= 0 ? values[staffIdx] : '';
      const notes = notesIdx >= 0 ? values[notesIdx] : '';
      
      console.log(`Processing row ${i}: ${drinkName}, qty=${quantity}, price=${price}, staff=${staffName}`);
      
      // Datum konvertieren
      let date;
      try {
        if (dateStr.includes('.')) {
          // Deutsches Format (DD.MM.YYYY HH:MM)
          const parts = dateStr.split(' ');
          const datePart = parts[0];
          const timePart = parts.length > 1 ? parts[1] : '00:00';
          
          const [day, month, year] = datePart.split('.');
          const [hours, minutes] = timePart.split(':');
          
          // Stelle sicher, dass alle Teile numerisch sind
          const y = parseInt(year);
          const m = parseInt(month) - 1; // Monate sind 0-basiert in JavaScript
          const d = parseInt(day);
          const h = parseInt(hours || 0);
          const min = parseInt(minutes || 0);
          
          date = new Date(y, m, d, h, min);
          if (isNaN(date.getTime())) throw new Error('Invalid date parts');
        } else {
          // ISO oder anderes Format
          date = new Date(dateStr);
          if (isNaN(date.getTime())) throw new Error('Invalid date format');
        }
      } catch (err) {
        console.warn(`Warning: Could not parse date "${dateStr}", using current date. Error: ${err.message}`);
        date = new Date(); // Fallback auf aktuelles Datum
      }
      
      // Getränk finden
      const drink = drinks.find(d => d.name.toLowerCase() === drinkName.toLowerCase());
      if (!drink) {
        console.warn(`Warning: Drink "${drinkName}" not found in database - skipping this sale`);
        continue; // Ohne Getränk kein Verkauf
      }
      
      // Mitarbeiter suchen (optional)
      let staffId = null;
      if (staffName) {
        const staff = staffMembers.find(s => s.name.toLowerCase().includes(staffName.toLowerCase()));
        if (staff) {
          staffId = staff._id;
          console.log(`Found staff "${staffName}" with ID ${staffId}`);
        } else {
          console.warn(`Warning: Staff "${staffName}" not found in database`);
        }
      }
      
      // Verkauf erstellen
      const saleData = {
        date: date,
        items: [{
          drinkId: drink._id,
          name: drinkName,
          quantity: quantity,
          pricePerUnit: price
        }],
        total: quantity * price,
        paymentMethod: payment.toLowerCase().includes('karte') ? 'card' : 'cash',
        notes: notes
      };
      
      // Mitarbeiter hinzufügen, falls gefunden
      if (staffId) {
        saleData.staffId = staffId;
      }
      
      try {
        // Speichern
        const newSale = new Sale(saleData);
        const savedSale = await newSale.save();
        console.log(`Success: Saved sale ${savedSale._id} for ${drinkName}`);
        
        // Formatiertes Objekt für die Antwort
        const returnSale = savedSale.toObject();
        returnSale.id = returnSale._id.toString();
        importedSales.push(returnSale);
      } catch (saveErr) {
        console.error(`Error saving sale for ${drinkName}:`, saveErr);
      }
    }
    
    console.log(`CSV import complete: ${importedSales.length} sales imported`);
    return importedSales;
  } catch (error) {
    console.error('CSV import error:', error);
    throw error;
  }
}

module.exports = { handleCSVImport };