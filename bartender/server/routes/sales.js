const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Drink = require('../models/Drink');
const mongoose = require('mongoose');
const { PAYMENT_METHODS } = require('../utils/constants');

// @route   GET /api/sales
// @desc    Alle Verkäufe erhalten
// @access  Private
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find()
      .sort({ date: -1 })
      .populate('staffId', 'name')
      .populate('items.drinkId', 'name');
    
    console.log(`Retrieved ${sales.length} sales from database`);
    
    // Transformiere die MongoDB-Dokumente in JSON-Format mit korrekt formatierten IDs
    const formattedSales = sales.map(sale => {
      const saleObj = sale.toObject();
      // Stelle sicher, dass _id als string vorhanden ist und füge eine id-Eigenschaft hinzu
      saleObj.id = saleObj._id.toString();
      return saleObj;
    });
    
    res.json(formattedSales);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/sales/date/:start/:end
// @desc    Verkäufe nach Datumsbereich erhalten
// @access  Private
router.get('/date/:start/:end', async (req, res) => {
  try {
    const startDate = new Date(req.params.start);
    const endDate = new Date(req.params.end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Ungültige Datumsangaben' });
    }
    
    const sales = await Sale.find({
      date: { $gte: startDate, $lte: endDate }
    })
      .sort({ date: -1 })
      .populate('staffId', 'name')
      .populate('items.drinkId', 'name');
    
    res.json(sales);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/sales/:id
// @desc    Einzelnen Verkauf erhalten
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('staffId', 'name')
      .populate('items.drinkId', 'name');
    
    if (!sale) {
      return res.status(404).json({ message: 'Verkauf nicht gefunden' });
    }
    
    res.json(sale);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Verkauf nicht gefunden' });
    }
    
    res.status(500).send('Server Error');
  }
});

// Middleware zur Validierung und Konvertierung von Verkaufsdaten
const prepareSaleData = (req, res, next) => {
  try {
    console.log('Empfangene Verkaufsdaten:', JSON.stringify(req.body, null, 2));
    
    // Prüfen, ob ein Request-Body vorhanden ist
    if (!req.body) {
      return res.status(400).json({ 
        success: false, 
        error: 'Keine Daten gesendet' 
      });
    }
    
    // Pflichtfelder überprüfen und sicherstellen, dass Items ein Array ist
    if (!req.body.items) {
      req.body.items = [];
    } else if (!Array.isArray(req.body.items)) {
      req.body.items = [];
    }
    
    // Prüfen, ob das Array leer ist
    if (req.body.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mindestens ein Artikel muss angegeben werden' 
      });
    }
    
    // Datum konvertieren falls vorhanden
    if (req.body.date) {
      try {
        req.body.date = new Date(req.body.date);
        if (isNaN(req.body.date.getTime())) {
          console.log('Ungültiges Datum, setze auf aktuelles Datum');
          req.body.date = new Date();
        }
      } catch (error) {
        console.log('Fehler beim Parsen des Datums:', error);
        req.body.date = new Date();
      }
    }
    
    // Artikel validieren und konvertieren
    for (let i = 0; i < req.body.items.length; i++) {
      const item = req.body.items[i];
      
      // Überprüfen und konvertieren der drinkId
      if (!item.drinkId || item.drinkId === '') {
        return res.status(400).json({ 
          success: false, 
          error: `Artikel ${i+1} benötigt eine gültige Getränk-ID` 
        });
      }
      
      // ObjectId validieren oder konvertieren
      try {
        console.log(`Validiere drinkId für Artikel ${i+1}:`, item.drinkId);
        
        // Prüfen, ob die ID ein gültiges ObjectId-Format hat
        if (!mongoose.Types.ObjectId.isValid(item.drinkId)) {
          console.error(`Ungültige drinkId für Artikel ${i+1}:`, item.drinkId);
          return res.status(400).json({ 
            success: false, 
            error: `Artikel ${i+1} hat eine ungültige Getränk-ID (Format)` 
          });
        }
        
        // Optional: Prüfen, ob das Getränk tatsächlich existiert (asynchrone Prüfung)
        // const drink = await Drink.findById(item.drinkId);
        // if (!drink) {
        //   return res.status(400).json({ 
        //     success: false, 
        //     error: `Das Getränk mit ID ${item.drinkId} für Artikel ${i+1} existiert nicht` 
        //   });
        // }
      } catch (error) {
        console.error('Fehler bei der Validierung der drinkId:', error, item.drinkId);
        return res.status(400).json({ 
          success: false, 
          error: `Artikel ${i+1} hat eine ungültige Getränk-ID (ID: ${item.drinkId})` 
        });
      }
      
      // Name des Artikels prüfen
      if (!item.name) {
        return res.status(400).json({ 
          success: false, 
          error: `Artikel ${i+1} benötigt einen Namen` 
        });
      }
      
      // Menge und Preis prüfen und konvertieren
      if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) < 1) {
        return res.status(400).json({ 
          success: false, 
          error: `Artikel ${i+1} benötigt eine gültige Menge (>= 1)` 
        });
      }
      
      if (item.pricePerUnit === undefined || item.pricePerUnit === null || isNaN(Number(item.pricePerUnit))) {
        return res.status(400).json({ 
          success: false, 
          error: `Artikel ${i+1} benötigt einen gültigen Preis` 
        });
      }
      
      // Numerische Werte konvertieren
      req.body.items[i].quantity = Number(item.quantity);
      req.body.items[i].pricePerUnit = Number(item.pricePerUnit);
    }
    
    // Gesamtsumme berechnen (optional)
    const total = req.body.items.reduce((sum, item) => {
      return sum + (item.quantity * item.pricePerUnit);
    }, 0);
    
    // Setzen der berechneten Gesamtsumme, falls nicht vorhanden oder ungültig
    if (req.body.total === undefined || req.body.total === null || isNaN(Number(req.body.total))) {
      req.body.total = total;
    } else {
      req.body.total = Number(req.body.total);
    }
    
    console.log('Aufbereitete Verkaufsdaten:', JSON.stringify(req.body, null, 2));
    next();
  } catch (error) {
    console.error('Fehler bei der Verkaufsdatenverarbeitung:', error);
    return res.status(400).json({ 
      success: false, 
      error: 'Ungültiges Datenformat' 
    });
  }
};

// Fehlerbehandlungs-Middleware für Mongoose-Fehler
const handleMongooseErrors = (err, req, res, next) => {
  console.error('Mongoose-Fehler:', err);
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ 
      success: false, 
      error: messages.join(', ') 
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      success: false, 
      error: 'Ungültiges Datenformat. Bitte überprüfen Sie die Angaben.' 
    });
  }
  
  return res.status(500).json({ 
    success: false, 
    error: err.message || 'Server-Fehler' 
  });
};

// @route   POST /api/sales
// @desc    Verkauf erstellen
// @access  Private
router.post('/', prepareSaleData, async (req, res, next) => {
  try {
    // Verkauf erstellen
    const newSale = new Sale(req.body);
    
    // Optional: Lagerbestand aktualisieren
    for (const item of newSale.items) {
      if (item.drinkId) {
        const drink = await Drink.findById(item.drinkId);
        if (drink && drink.stock > 0) {
          drink.stock = Math.max(0, drink.stock - item.quantity);
          await drink.save();
        }
      }
    }
    
    const sale = await newSale.save();
    console.log('Verkauf erfolgreich erstellt:', sale._id);
    res.json(sale);
  } catch (err) {
    next(err); // Weiterleitung an die Fehlerbehandlungs-Middleware
  }
});

// @route   POST /api/sales/import
// @desc    Verkäufe aus Kassensystem importieren
// @access  Private
router.post('/import', async (req, res) => {
  try {
    const { format, data } = req.body;
    
    if (!format || !data) {
      return res.status(400).json({ message: 'Format und Daten erforderlich' });
    }
    
    let importedSales = [];
    console.log(`Importing data in ${format} format, data length: ${data.length} characters`);
    
    switch (format) {
      case 'csv':
        try {
          // CSV-Verarbeitung
          const lines = data.trim().split('\n');
          // Überprüfen, ob überhaupt Zeilen vorhanden sind
          if (lines.length < 2) {
            return res.status(400).json({ message: 'Ungültiges CSV-Format: Mindestens Header + 1 Datenzeile erforderlich' });
          }
          
          // Header parsen
          const header = lines[0].split(',');
          console.log('CSV Header:', header);
          
          // Indizes wichtiger Felder finden
          const dateIndex = header.findIndex(col => col.toLowerCase().includes('datum'));
          const drinkIndex = header.findIndex(col => col.toLowerCase().includes('getränk') || col.toLowerCase().includes('produkt'));
          const quantityIndex = header.findIndex(col => col.toLowerCase().includes('menge'));
          const priceIndex = header.findIndex(col => col.toLowerCase().includes('preis'));
          const paymentIndex = header.findIndex(col => col.toLowerCase().includes('zahlungsart') || col.toLowerCase().includes('zahlung'));
          const staffIndex = header.findIndex(col => col.toLowerCase().includes('mitarbeiter') || col.toLowerCase().includes('personal'));
          const notesIndex = header.findIndex(col => col.toLowerCase().includes('notizen') || col.toLowerCase().includes('bemerkung'));
          
          // Überprüfen, ob die wichtigsten Felder vorhanden sind
          if (dateIndex === -1 || drinkIndex === -1 || quantityIndex === -1 || priceIndex === -1) {
            return res.status(400).json({ 
              message: 'Ungültiges CSV-Format: Mindestens Datum, Getränk, Menge und Preis sind erforderlich',
              missingFields: [
                dateIndex === -1 ? 'Datum' : null,
                drinkIndex === -1 ? 'Getränk/Produkt' : null,
                quantityIndex === -1 ? 'Menge' : null,
                priceIndex === -1 ? 'Preis' : null
              ].filter(Boolean)
            });
          }
          
          // In this updated approach, we'll create a unique key for each sale
          // instead of grouping by date, to ensure we create individual sales records
          // This better matches the expected UI behavior
          const salesRecords = [];
          
          // Daten verarbeiten (ab der zweiten Zeile, nach dem Header)
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // Leere Zeilen überspringen
            
            const values = lines[i].split(',');
            
            // Werte extrahieren
            const dateStr = values[dateIndex];
            const drinkName = values[drinkIndex];
            const quantity = parseFloat(values[quantityIndex]) || 1;
            const price = parseFloat(values[priceIndex]) || 0;
            const payment = paymentIndex !== -1 ? values[paymentIndex] : 'cash';
            const staffName = staffIndex !== -1 ? values[staffIndex] : '';
            const notes = notesIndex !== -1 ? values[notesIndex] : '';
            
            // Datum parsen
            let date;
            try {
              // Verschiedene Datumsformate behandeln
              if (dateStr.includes('.')) {
                // Deutsches Format (dd.mm.yyyy)
                const [day, month, year] = dateStr.split('.');
                date = new Date(year, month - 1, day);
              } else {
                // ISO-Format oder amerikanisches Format
                date = new Date(dateStr);
              }
              
              if (isNaN(date.getTime())) {
                console.warn(`Ungültiges Datumsformat in Zeile ${i + 1}: ${dateStr}`);
                date = new Date(); // Fallback auf aktuelles Datum
              }
            } catch (e) {
              console.warn(`Fehler beim Parsen des Datums in Zeile ${i + 1}: ${e.message}`);
              date = new Date(); // Fallback auf aktuelles Datum
            }
            
            // Creating a new sale record for each row
            const saleRecord = {
              date: date.toISOString(),
              items: [{
                name: drinkName,
                quantity,
                pricePerUnit: price
              }],
              paymentMethod: payment.toLowerCase().includes('karte') ? 'card' : 'cash',
              staffId: '',
              notes: notes
            };
            
            // Add this record to our list of sales to create
            console.log(`Prepared sale record for ${drinkName}, qty: ${quantity}, price: ${price}`);
            salesRecords.push(saleRecord);
          }
          
          // Replace salesByDate with salesRecords in the following code
          const salesByDate = {}; 
          // Assign each record a unique key
          salesRecords.forEach((record, index) => {
            const uniqueKey = `sale_${index}`;
            salesByDate[uniqueKey] = record;
            console.log(`Assigned key ${uniqueKey} to sale with ${record.items.length} items`);
          });
          
          // Verkäufe erstellen
          for (const dateKey of Object.keys(salesByDate)) {
            const saleData = salesByDate[dateKey];
            
            // Gesamtsumme berechnen
            saleData.total = saleData.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
            
            console.log(`Creating sale for date ${dateKey} with ${saleData.items.length} items, total: ${saleData.total}`);
            
            // Suche nach passenden Getränken in der Datenbank um DrinkIds zu setzen
            for (let i = 0; i < saleData.items.length; i++) {
              const item = saleData.items[i];
              try {
                // Suche nach Getränk anhand des Namens
                const drink = await Drink.findOne({ 
                  name: { $regex: new RegExp(item.name, 'i') } 
                });
                
                if (drink) {
                  item.drinkId = drink._id;
                  console.log(`Found drink ID ${drink._id} for ${item.name}`);
                } else {
                  // Fallback: Erstelle ein neues Getränk
                  const newDrink = new Drink({
                    name: item.name,
                    category: 'other',
                    price: item.pricePerUnit,
                    cost: item.pricePerUnit * 0.4, // Schätzung: 40% Kosten
                    ingredients: [item.name],
                    isActive: true
                  });
                  
                  try {
                    const savedDrink = await newDrink.save();
                    item.drinkId = savedDrink._id;
                    console.log(`Created new drink with ID ${savedDrink._id} for ${item.name}`);
                  } catch (drinkErr) {
                    console.error(`Error creating drink for ${item.name}:`, drinkErr);
                    // Wenn das Erstellen fehlschlägt, trotzdem fortfahren
                  }
                }
              } catch (searchErr) {
                console.error(`Error searching for drink ${item.name}:`, searchErr);
              }
            }
            
            // Verkauf speichern
            try {
              const newSale = new Sale(saleData);
              const savedSale = await newSale.save();
              importedSales.push(savedSale);
            } catch (saleErr) {
              console.error(`Error saving sale for ${dateKey}:`, saleErr);
            }
          }
        } catch (csvErr) {
          console.error('CSV processing error:', csvErr);
          return res.status(400).json({ message: `Fehler bei der CSV-Verarbeitung: ${csvErr.message}` });
        }
        break;
        
      case 'json':
        // JSON-Verarbeitung
        try {
          const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
          console.log('Parsed JSON data:', typeof jsonData, Array.isArray(jsonData) ? jsonData.length : 'not an array');
          
          if (Array.isArray(jsonData)) {
            for (const saleData of jsonData) {
              try {
                // Überprüfen, ob die notwendigen Felder vorhanden sind
                if (!saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
                  console.warn('Skipping sale data without items:', saleData);
                  continue;
                }
                
                // Stelle sicher, dass items DrinkIds haben
                for (let i = 0; i < saleData.items.length; i++) {
                  const item = saleData.items[i];
                  if (!item.drinkId && item.name) {
                    // Suche nach Getränk anhand des Namens
                    try {
                      const drink = await Drink.findOne({ 
                        name: { $regex: new RegExp(item.name, 'i') } 
                      });
                      
                      if (drink) {
                        item.drinkId = drink._id;
                      }
                    } catch (drinkErr) {
                      console.error(`Error finding drink for ${item.name}:`, drinkErr);
                    }
                  }
                }
                
                // Gesamtsumme aktualisieren
                if (!saleData.total || saleData.total <= 0) {
                  saleData.total = saleData.items.reduce((sum, item) => {
                    return sum + ((parseFloat(item.quantity) || 1) * (parseFloat(item.pricePerUnit) || 0));
                  }, 0);
                }
                
                // Speichern
                const newSale = new Sale(saleData);
                const savedSale = await newSale.save();
                importedSales.push(savedSale);
                console.log(`Saved sale with ID ${savedSale._id} containing ${savedSale.items.length} items`);
              } catch (saleErr) {
                console.error('Error saving individual sale:', saleErr);
              }
            }
          } else if (typeof jsonData === 'object' && jsonData !== null) {
            // Einzelnes Verkaufsobjekt
            // Überprüfe, ob ein oder mehrere Items vorhanden sind
            if (!jsonData.items || !Array.isArray(jsonData.items) || jsonData.items.length === 0) {
              return res.status(400).json({ message: 'Ungültiges JSON-Format: Kein items-Array gefunden' });
            }
            
            // Stelle sicher, dass items DrinkIds haben
            for (let i = 0; i < jsonData.items.length; i++) {
              const item = jsonData.items[i];
              if (!item.drinkId && item.name) {
                // Suche nach Getränk anhand des Namens
                try {
                  const drink = await Drink.findOne({ 
                    name: { $regex: new RegExp(item.name, 'i') } 
                  });
                  
                  if (drink) {
                    item.drinkId = drink._id;
                  }
                } catch (drinkErr) {
                  console.error(`Error finding drink for ${item.name}:`, drinkErr);
                }
              }
            }
            
            // Gesamtsumme aktualisieren
            if (!jsonData.total || jsonData.total <= 0) {
              jsonData.total = jsonData.items.reduce((sum, item) => {
                return sum + ((parseFloat(item.quantity) || 1) * (parseFloat(item.pricePerUnit) || 0));
              }, 0);
            }
            
            try {
              const newSale = new Sale(jsonData);
              const savedSale = await newSale.save();
              importedSales.push(savedSale);
              console.log(`Saved single sale with ID ${savedSale._id}`);
            } catch (singleSaleErr) {
              console.error('Error saving single sale object:', singleSaleErr);
              return res.status(400).json({ message: `Fehler beim Speichern: ${singleSaleErr.message}` });
            }
          } else {
            return res.status(400).json({ message: 'Ungültiges JSON-Format: Weder Array noch Objekt' });
          }
        } catch (parseErr) {
          console.error('JSON parsing error:', parseErr);
          return res.status(400).json({ message: `Ungültiges JSON-Format: ${parseErr.message}` });
        }
        break;
        
      default:
        return res.status(400).json({ message: 'Nicht unterstütztes Format' });
    }
    
    // Formatierte Antwort erstellen
    const formattedSales = importedSales.map(sale => {
      const saleObj = sale.toObject();
      saleObj.id = saleObj._id.toString();
      return saleObj;
    });
    
    console.log(`Successfully imported ${importedSales.length} sales with IDs: ${importedSales.map(s => s._id).join(', ')}`);
    
    // Return the correct list of imported sales
    if (importedSales.length === 0) {
      console.warn('No sales were imported - this is probably an error');
    }
    
    res.json(formattedSales);
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ message: `Server-Fehler beim Import: ${err.message}` });
  }
});

// @route   PUT /api/sales/:id
// @desc    Verkauf aktualisieren
// @access  Private
router.put('/:id', prepareSaleData, async (req, res, next) => {
  try {
    const sale = await Sale.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true,           // Gibt das aktualisierte Dokument zurück
        runValidators: true, // Führt die Schema-Validierungen aus
        context: 'query'     // Erlaubt den Zugriff auf die Abfrage in Pre-Hooks
      }
    );
    
    if (!sale) {
      return res.status(404).json({ 
        success: false, 
        error: 'Verkauf nicht gefunden' 
      });
    }
    
    console.log('Verkauf erfolgreich aktualisiert:', sale._id);
    res.json(sale);
  } catch (err) {
    next(err); // Weiterleitung an die Fehlerbehandlungs-Middleware
  }
});

// @route   DELETE /api/sales/:id
// @desc    Verkauf löschen
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ message: 'Verkauf nicht gefunden' });
    }
    
    await sale.deleteOne();
    res.json({ message: 'Verkauf entfernt' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Verkauf nicht gefunden' });
    }
    
    res.status(500).send('Server Error');
  }
});

// Fehlerbehandlungs-Middleware registrieren
router.use(handleMongooseErrors);

module.exports = router;