const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { protect } = require('../middleware/auth');

// @route   GET /api/inventory
// @desc    Alle Inventareinträge abrufen
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({ name: 1 });
    res.json(inventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/inventory/low-stock
// @desc    Artikel mit niedrigem Bestand abrufen
// @access  Private
router.get('/low-stock', protect, async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lt: ["$quantity", "$minQuantity"] }
    }).sort({ quantity: 1 });
    
    res.json(lowStockItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/inventory/:id
// @desc    Einzelnen Inventareintrag abrufen
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Artikel nicht gefunden' });
    }
    
    res.json(item);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Artikel nicht gefunden' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/inventory
// @desc    Neuen Inventareintrag erstellen
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    console.log('Creating new inventory item with data:', JSON.stringify(req.body, null, 2));
    console.log('Update data contains supplier?', req.body.hasOwnProperty('supplier'));
    console.log('Update data supplier value:', req.body.supplier);
    console.log('Update data contains lastOrderDate?', req.body.hasOwnProperty('lastOrderDate'));
    console.log('Update data lastOrderDate value:', req.body.lastOrderDate);
    
    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({ success: false, error: 'Name ist ein Pflichtfeld' });
    }
    
    if (!req.body.unit) {
      return res.status(400).json({ success: false, error: 'Einheit ist ein Pflichtfeld' });
    }
    
    if (req.body.costPerUnit === undefined || req.body.costPerUnit === null) {
      return res.status(400).json({ success: false, error: 'Kosten pro Einheit ist ein Pflichtfeld' });
    }
    
    // Make sure supplier is properly handled
    if (!req.body.supplier || (typeof req.body.supplier === 'string' && req.body.supplier.trim() === '')) {
      console.log('Setting supplier to null for new inventory');
      // If supplier is empty, null, or undefined, set it to null explicitly
      req.body.supplier = null;
    }
    
    // Ensure lastOrderDate is in the correct format
    if (req.body.lastOrderDate) {
      console.log('Original lastOrderDate for create:', req.body.lastOrderDate);
      // Make sure it's a valid date string
      if (isNaN(Date.parse(req.body.lastOrderDate))) {
        console.log('Invalid date for create, setting to today');
        req.body.lastOrderDate = new Date().toISOString();
      }
    } else {
      console.log('No lastOrderDate provided for create, setting to today');
      req.body.lastOrderDate = new Date().toISOString();
    }

    // Create an explicit data object to ensure all fields are included
    const itemData = {
      name: req.body.name,
      category: req.body.category,
      quantity: req.body.quantity,
      unit: req.body.unit,
      minQuantity: req.body.minQuantity,
      costPerUnit: req.body.costPerUnit || 0,
      lastOrderDate: req.body.lastOrderDate,
      supplier: req.body.supplier
    };
    
    console.log("Final lastOrderDate being saved for create:", itemData.lastOrderDate);
    
    console.log('Final item data for creation:', JSON.stringify(itemData, null, 2));
    
    const newItem = new Inventory(itemData);
    const item = await newItem.save();
    console.log('Inventory item created successfully:', item._id);
    console.log('Created item data:', JSON.stringify(item.toObject(), null, 2));
    res.json(item);
  } catch (err) {
    console.error('Error creating inventory item:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Ungültiges Datenformat. Bitte überprüfen Sie die Angaben.' });
    }
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Inventareintrag aktualisieren
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    console.log('Updating inventory item with ID:', req.params.id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    console.log('Update data contains supplier?', req.body.hasOwnProperty('supplier'));
    console.log('Update data supplier value:', req.body.supplier);
    console.log('Update data contains lastOrderDate?', req.body.hasOwnProperty('lastOrderDate'));
    console.log('Update data lastOrderDate value:', req.body.lastOrderDate);
    
    // Make sure supplier is properly handled
    if (!req.body.supplier || (typeof req.body.supplier === 'string' && req.body.supplier.trim() === '')) {
      console.log('Setting supplier to null');
      // If supplier is empty, null, or undefined, set it to null explicitly
      req.body.supplier = null;
    }
    
    // Ensure lastOrderDate is in the correct format
    if (req.body.lastOrderDate) {
      console.log('Original lastOrderDate:', req.body.lastOrderDate);
      // Make sure it's a valid date string
      if (isNaN(Date.parse(req.body.lastOrderDate))) {
        console.log('Invalid date, setting to today');
        req.body.lastOrderDate = new Date().toISOString();
      }
    }
    
    // Create an explicit update object to ensure all fields are included
    const updateData = {
      name: req.body.name,
      category: req.body.category,
      quantity: req.body.quantity,
      unit: req.body.unit,
      minQuantity: req.body.minQuantity,
      costPerUnit: req.body.costPerUnit || 0,
      lastOrderDate: req.body.lastOrderDate || new Date(),
      supplier: req.body.supplier,
    };
    
    console.log("Final lastOrderDate being saved:", updateData.lastOrderDate);
    
    console.log('Final update data:', JSON.stringify(updateData, null, 2));
    
    const item = await Inventory.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { 
        new: true,           // Return the modified document
        runValidators: true, // Run the schema validators
        context: 'query',    // Allow access to query in pre hooks
        upsert: false,       // Don't create if not exists
        setDefaultsOnInsert: true // Apply defaults if upserting
      }
    );
    
    if (!item) {
      return res.status(404).json({ success: false, error: 'Artikel nicht gefunden' });
    }
    
    console.log('Inventory item updated successfully:', item._id);
    console.log('Updated item data:', JSON.stringify(item, null, 2));
    res.json(item);
  } catch (err) {
    console.error('Error updating inventory item:', err);
    
    if (err.kind === 'ObjectId' || err.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Artikel nicht gefunden oder ungültige ID' });
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Inventareintrag löschen
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    console.log('Deleting inventory item with ID:', req.params.id);
    
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ success: false, error: 'Artikel nicht gefunden' });
    }
    
    await item.deleteOne();
    console.log('Inventory item deleted successfully:', req.params.id);
    res.json({ success: true, message: 'Artikel erfolgreich entfernt' });
  } catch (err) {
    console.error('Error deleting inventory item:', err);
    
    if (err.kind === 'ObjectId' || err.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Artikel nicht gefunden oder ungültige ID' });
    }
    
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

module.exports = router;