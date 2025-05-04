const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Drink = require('../models/Drink');
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

// @route   POST /api/sales
// @desc    Verkauf erstellen
// @access  Private
router.post('/', async (req, res) => {
  try {
    const newSale = new Sale(req.body);
    
    // Gesamtsumme berechnen, falls nicht angegeben
    if (!newSale.total) {
      newSale.total = newSale.calculateTotal();
    }
    
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
    res.json(sale);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/sales/:id
// @desc    Verkauf aktualisieren
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
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
    
    switch (format) {
      case 'csv':
        // CSV-Verarbeitung
        // Hier würde die logische Umwandlung von CSV zu Sale-Objekten erfolgen
        break;
        
      case 'json':
        // JSON-Verarbeitung
        try {
          const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
          
          if (Array.isArray(jsonData)) {
            for (const saleData of jsonData) {
              // Konvertiere JSON in Sale-Objekt und speichere
              const newSale = new Sale(saleData);
              const savedSale = await newSale.save();
              importedSales.push(savedSale);
            }
          } else {
            // Einzelnes Verkaufsobjekt
            const newSale = new Sale(jsonData);
            const savedSale = await newSale.save();
            importedSales.push(savedSale);
          }
        } catch (parseErr) {
          return res.status(400).json({ message: 'Ungültiges JSON-Format' });
        }
        break;
        
      default:
        return res.status(400).json({ message: 'Nicht unterstütztes Format' });
    }
    
    res.json(importedSales);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;