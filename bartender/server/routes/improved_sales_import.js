const csv = require('csvtojson');
const Sale = require('../models/Sale');
const Drink = require('../models/Drink');
const Staff = require('../models/Staff');

/**
 * Verbesserte CSV-Import-Funktion für Verkäufe
 * Diese Funktion kann in die bestehende Route eingebaut werden
 */
async function importSalesFromCSV(csvData) {
  try {
    // Falls noch kein CSV-Parser vorhanden ist, diesen mit npm install --save csvtojson installieren
    
    // CSV in JSON konvertieren
    const jsonArray = await csv({
      noheader: false,
      headers: ['date', 'drink', 'quantity', 'price', 'payment', 'staff', 'notes']
    }).fromString(csvData);
    
    console.log(`Converted CSV to ${jsonArray.length} JSON records`);
    
    // Alle Getränke und Mitarbeiter vorab laden für schnellere Suche
    const allDrinks = await Drink.find();
    const allStaff = await Staff.find();
    
    console.log(`Found ${allDrinks.length} drinks and ${allStaff.length} staff members in database`);
    
    // Verkäufe verarbeiten und speichern
    const importedSales = [];
    
    for (const record of jsonArray) {
      try {
        // Datum parsen
        let date;
        if (record.date.includes('.')) {
          // Deutsches Format (DD.MM.YYYY)
          const parts = record.date.trim().split(' ');
          const datePart = parts[0];
          const timePart = parts.length > 1 ? parts[1] : '00:00';
          
          const [day, month, year] = datePart.split('.');
          const [hours, minutes] = timePart.split(':');
          
          // Jahr prüfen und ggf. korrigieren (2-stellig → 4-stellig)
          let fullYear = year;
          if (year && year.length === 2) {
            fullYear = parseInt(year) < 50 ? '20' + year : '19' + year;
          }
          
          date = new Date(
            parseInt(fullYear), 
            parseInt(month) - 1, 
            parseInt(day),
            parseInt(hours || 0),
            parseInt(minutes || 0)
          );
        } else {
          date = new Date(record.date);
        }
        
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date format: ${record.date}, using current date`);
          date = new Date();
        }
        
        // Getränk finden
        const matchingDrink = allDrinks.find(d => 
          d.name.toLowerCase() === record.drink.toLowerCase()
        );
        
        let drinkId = null;
        if (matchingDrink) {
          drinkId = matchingDrink._id;
          console.log(`Found matching drink: ${record.drink} with ID ${drinkId}`);
        } else {
          console.warn(`No matching drink found for: ${record.drink}`);
        }
        
        // Mitarbeiter finden
        let staffId = null;
        if (record.staff) {
          const matchingStaff = allStaff.find(s => 
            s.name.toLowerCase().includes(record.staff.toLowerCase())
          );
          
          if (matchingStaff) {
            staffId = matchingStaff._id;
            console.log(`Found matching staff: ${record.staff} with ID ${staffId}`);
          } else {
            console.warn(`No matching staff found for: ${record.staff}`);
          }
        }
        
        // Menge und Preis konvertieren
        const quantity = parseFloat(record.quantity) || 1;
        const price = parseFloat(record.price) || 0;
        
        // Zahlungsmethode bestimmen
        const paymentMethod = record.payment?.toLowerCase().includes('karte') ? 'card' : 'cash';
        
        // Verkaufsobjekt erstellen
        const saleData = {
          date: date,
          items: [{
            drinkId: drinkId,
            name: record.drink,
            quantity: quantity,
            pricePerUnit: price
          }],
          total: quantity * price,
          paymentMethod: paymentMethod,
          notes: record.notes || ''
        };
        
        // Mitarbeiter-ID hinzufügen, falls vorhanden
        if (staffId) {
          saleData.staffId = staffId;
        }
        
        // Verkauf in Datenbank speichern
        const newSale = new Sale(saleData);
        const savedSale = await newSale.save();
        
        console.log(`Successfully saved sale for ${record.drink}, ID: ${savedSale._id}`);
        importedSales.push(savedSale);
      } catch (error) {
        console.error(`Error processing record:`, record, error);
      }
    }
    
    console.log(`Imported ${importedSales.length} sales from CSV`);
    return importedSales;
  } catch (error) {
    console.error('Error importing sales from CSV:', error);
    throw error;
  }
}

module.exports = { importSalesFromCSV };