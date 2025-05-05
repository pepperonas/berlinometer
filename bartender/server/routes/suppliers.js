const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { protect } = require('../middleware/auth');

// @route   GET /api/suppliers
// @desc    Alle Lieferanten abrufen
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/suppliers/:id
// @desc    Einzelnen Lieferanten abrufen
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Lieferant nicht gefunden' });
    }
    
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Lieferant nicht gefunden' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/suppliers
// @desc    Neuen Lieferanten erstellen
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    console.log('Creating new supplier with data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({ success: false, error: 'Name ist ein Pflichtfeld' });
    }
    
    // Handle the categories array properly
    if (req.body.categories && !Array.isArray(req.body.categories)) {
      if (typeof req.body.categories === 'string') {
        // If it's a single string, convert to array
        req.body.categories = [req.body.categories];
      } else {
        // Otherwise initialize as empty array
        req.body.categories = [];
      }
    }
    
    // Validate email format if provided
    if (req.body.email && typeof req.body.email === 'string') {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ success: false, error: 'Ungültiges E-Mail-Format' });
      }
    }
    
    const newSupplier = new Supplier(req.body);
    const supplier = await newSupplier.save();
    console.log('Supplier created successfully:', supplier._id);
    res.json(supplier);
  } catch (err) {
    console.error('Error creating supplier:', err);
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

// @route   PUT /api/suppliers/:id
// @desc    Lieferanten aktualisieren
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    console.log('Updating supplier with ID:', req.params.id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    // Handle the categories array properly
    if (req.body.categories && !Array.isArray(req.body.categories)) {
      if (typeof req.body.categories === 'string') {
        // If it's a single string, convert to array
        req.body.categories = [req.body.categories];
      } else {
        // Otherwise initialize as empty array
        req.body.categories = [];
      }
    }
    
    // Validate email format if provided
    if (req.body.email && typeof req.body.email === 'string') {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ success: false, error: 'Ungültiges E-Mail-Format' });
      }
    }
    
    // Set updated timestamp
    req.body.updatedAt = new Date();
    
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true,           // Return the modified document
        runValidators: true, // Run the schema validators 
        context: 'query'     // Allow access to query in pre hooks
      }
    );
    
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Lieferant nicht gefunden' });
    }
    
    console.log('Supplier updated successfully:', supplier._id);
    res.json(supplier);
  } catch (err) {
    console.error('Error updating supplier:', err);
    
    if (err.kind === 'ObjectId' || err.name === 'CastError') {
      return res.status(404).json({ success: false, error: 'Lieferant nicht gefunden oder ungültige ID' });
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

// @route   DELETE /api/suppliers/:id
// @desc    Lieferanten löschen
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Lieferant nicht gefunden' });
    }
    
    await supplier.deleteOne();
    res.json({ message: 'Lieferant entfernt' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Lieferant nicht gefunden' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;