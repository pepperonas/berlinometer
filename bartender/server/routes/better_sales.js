const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Drink = require('../models/Drink');
const Staff = require('../models/Staff');
const mongoose = require('mongoose');
const { PAYMENT_METHODS } = require('../utils/constants');
const { handleCSVImport } = require('./fixed_import');

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
      
      // Wenn staffId populated wurde und ein Objekt ist, konvertiere es in einen String
      if (saleObj.staffId && typeof saleObj.staffId === 'object' && saleObj.staffId._id) {
        // Wir behalten den Namen, aber speichern die ID als String
        const staffName = saleObj.staffId.name;
        saleObj.staffId = saleObj.staffId._id.toString();
        saleObj.staffName = staffName; // Optional: Mitarbeiternamen als separate Eigenschaft
      }
      
      // Auch für die Artikel (items) sicherstellen, dass drinkId ein String ist
      if (Array.isArray(saleObj.items)) {
        saleObj.items = saleObj.items.map(item => {
          if (item.drinkId && typeof item.drinkId === 'object' && item.drinkId._id) {
            const drinkName = item.drinkId.name;
            item.drinkId = item.drinkId._id.toString();
            // Falls der Name nicht im Item gespeichert ist, aber in der drinkId
            if (!item.name && drinkName) {
              item.name = drinkName;
            }
          }
          return item;
        });
      }
      
      return saleObj;
    });
    
    res.json(formattedSales);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/sales/import
// @desc    Verkäufe aus Datei importieren
// @access  Private
router.post('/import', async (req, res) => {
  try {
    const { format, data } = req.body;
    
    if (!format || !data) {
      return res.status(400).json({ message: 'Format und Daten erforderlich' });
    }
    
    let importedSales = [];
    console.log(`Importing data in ${format} format, size: ${data.length} bytes`);
    
    // Import nach Format
    switch (format.toLowerCase()) {
      case 'csv':
        importedSales = await handleCSVImport(data);
        break;
        
      case 'json':
        // JSON-Import (wie bisher)
        try {
          const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
          
          if (Array.isArray(jsonData)) {
            for (const saleData of jsonData) {
              const newSale = new Sale(saleData);
              const savedSale = await newSale.save();
              importedSales.push(savedSale);
            }
          } else {
            const newSale = new Sale(jsonData);
            const savedSale = await newSale.save();
            importedSales.push(savedSale);
          }
        } catch (err) {
          console.error('JSON import error:', err);
          return res.status(400).json({ message: 'Ungültiges JSON-Format' });
        }
        break;
        
      default:
        return res.status(400).json({ message: `Nicht unterstütztes Format: ${format}` });
    }
    
    // Verkäufe für die Antwort formatieren
    const formattedSales = importedSales.map(sale => {
      if (typeof sale.toObject === 'function') {
        const saleObj = sale.toObject();
        saleObj.id = saleObj._id.toString();
        return saleObj;
      } else {
        // Falls bereits ein normales Objekt
        return {
          ...sale,
          id: sale._id?.toString() || sale.id
        };
      }
    });
    
    console.log(`Imported ${formattedSales.length} sales successfully`);
    res.json(formattedSales);
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ 
      message: `Import error: ${err.message}`,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
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
    
    // Format the results just like in the main GET route
    const formattedSales = sales.map(sale => {
      const saleObj = sale.toObject();
      
      // Add string ID 
      saleObj.id = saleObj._id.toString();
      
      // Fix staffId if it's an object
      if (saleObj.staffId && typeof saleObj.staffId === 'object' && saleObj.staffId._id) {
        const staffName = saleObj.staffId.name;
        saleObj.staffId = saleObj.staffId._id.toString();
        saleObj.staffName = staffName;
      }
      
      // Fix item drinkIds
      if (Array.isArray(saleObj.items)) {
        saleObj.items = saleObj.items.map(item => {
          if (item.drinkId && typeof item.drinkId === 'object' && item.drinkId._id) {
            const drinkName = item.drinkId.name;
            item.drinkId = item.drinkId._id.toString();
            if (!item.name && drinkName) {
              item.name = drinkName;
            }
          }
          return item;
        });
      }
      
      return saleObj;
    });
    
    res.json(formattedSales);
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
    
    // Format the sale like we do in other routes
    const saleObj = sale.toObject();
    
    // Format IDs as strings
    saleObj.id = saleObj._id.toString();
    
    // Fix staffId if it's an object
    if (saleObj.staffId && typeof saleObj.staffId === 'object' && saleObj.staffId._id) {
      const staffName = saleObj.staffId.name;
      saleObj.staffId = saleObj.staffId._id.toString();
      saleObj.staffName = staffName;
    }
    
    // Fix item drinkIds
    if (Array.isArray(saleObj.items)) {
      saleObj.items = saleObj.items.map(item => {
        if (item.drinkId && typeof item.drinkId === 'object' && item.drinkId._id) {
          const drinkName = item.drinkId.name;
          item.drinkId = item.drinkId._id.toString();
          if (!item.name && drinkName) {
            item.name = drinkName;
          }
        }
        return item;
      });
    }
    
    res.json(saleObj);
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
    console.log('Preparing sale data:', JSON.stringify(req.body, null, 2));
    
    // Pflichtfelder prüfen
    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mindestens ein Artikel erforderlich' 
      });
    }
    
    // Artikel validieren
    for (let i = 0; i < req.body.items.length; i++) {
      const item = req.body.items[i];
      
      if (!item.name) {
        return res.status(400).json({ 
          success: false, 
          error: `Artikel ${i+1} benötigt einen Namen` 
        });
      }
      
      // Prüfen, ob drinkId eine gültige ObjectId ist
      if (item.drinkId && !mongoose.Types.ObjectId.isValid(item.drinkId)) {
        return res.status(400).json({ 
          success: false, 
          error: `Artikel ${i+1} hat eine ungültige Getränk-ID` 
        });
      }
      
      // Numerische Werte validieren
      if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) < 1) {
        return res.status(400).json({ 
          success: false, 
          error: `Artikel ${i+1} benötigt eine gültige Menge` 
        });
      }
      
      if (item.pricePerUnit === undefined || isNaN(Number(item.pricePerUnit))) {
        return res.status(400).json({ 
          success: false, 
          error: `Artikel ${i+1} benötigt einen gültigen Preis` 
        });
      }
      
      // Numerische Werte konvertieren
      req.body.items[i].quantity = Number(item.quantity);
      req.body.items[i].pricePerUnit = Number(item.pricePerUnit);
    }
    
    // Gesamtsumme berechnen oder prüfen
    const total = req.body.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    if (req.body.total === undefined || isNaN(Number(req.body.total))) {
      req.body.total = total;
    } else {
      req.body.total = Number(req.body.total);
    }
    
    // Datum konvertieren falls vorhanden
    if (req.body.date) {
      try {
        req.body.date = new Date(req.body.date);
        if (isNaN(req.body.date.getTime())) {
          req.body.date = new Date();
        }
      } catch (e) {
        req.body.date = new Date();
      }
    }
    
    console.log('Sale data prepared successfully');
    next();
  } catch (error) {
    console.error('Error preparing sale data:', error);
    return res.status(400).json({ 
      success: false, 
      error: 'Ungültiges Datenformat' 
    });
  }
};

// @route   POST /api/sales
// @desc    Verkauf erstellen
// @access  Private
router.post('/', prepareSaleData, async (req, res) => {
  try {
    const newSale = new Sale(req.body);
    
    // Lagerbestand aktualisieren für jedes Getränk
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
    console.log('Sale created successfully:', sale._id);
    
    // ID formatieren für die Antwort
    const saleObj = sale.toObject();
    saleObj.id = saleObj._id.toString();
    
    res.json(saleObj);
  } catch (err) {
    console.error('Error creating sale:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false, 
        error: messages.join(', ') 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Server Error' 
    });
  }
});

// @route   PUT /api/sales/:id
// @desc    Verkauf aktualisieren
// @access  Private
router.put('/:id', prepareSaleData, async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!sale) {
      return res.status(404).json({ message: 'Verkauf nicht gefunden' });
    }
    
    // ID formatieren für die Antwort
    const saleObj = sale.toObject();
    saleObj.id = saleObj._id.toString();
    
    res.json(saleObj);
  } catch (err) {
    console.error('Error updating sale:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false, 
        error: messages.join(', ') 
      });
    }
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Verkauf nicht gefunden' });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Server Error' 
    });
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
    res.json({ success: true, message: 'Verkauf entfernt', id: req.params.id });
  } catch (err) {
    console.error('Error deleting sale:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Verkauf nicht gefunden' });
    }
    
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Server Error' 
    });
  }
});

module.exports = router;