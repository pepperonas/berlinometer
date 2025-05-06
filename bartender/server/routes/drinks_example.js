const express = require('express');
const router = express.Router();
const Drink = require('../models/Drink');
const { protect } = require('../middleware/auth');
const { 
  getList, 
  getOne, 
  createOne, 
  updateOne, 
  deleteOne 
} = require('../middleware/barFilter');

// Middleware für die Validierung der Getränkedaten
const prepareDrinkData = (req, res, next) => {
  try {
    // Logging für Debug-Zwecke
    console.log('Empfangene Getränkedaten:', JSON.stringify(req.body, null, 2));
    
    // Pflichtfelder überprüfen
    if (!req.body.name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name ist ein Pflichtfeld' 
      });
    }
    
    if (req.body.price === undefined || req.body.price === null) {
      return res.status(400).json({ 
        success: false, 
        error: 'Preis ist ein Pflichtfeld' 
      });
    }
    
    // Numerische Werte konvertieren
    if (req.body.price !== undefined) req.body.price = Number(req.body.price);
    if (req.body.cost !== undefined) req.body.cost = Number(req.body.cost);
    if (req.body.alcohol !== undefined) req.body.alcohol = Number(req.body.alcohol);
    if (req.body.stock !== undefined) req.body.stock = Number(req.body.stock);
    
    // Zutaten verarbeiten
    if (req.body.ingredients) {
      // Prüfen, ob es ein Array ist
      if (!Array.isArray(req.body.ingredients)) {
        req.body.ingredients = [];
      } else {
        // Konvertiere in das richtige Format
        req.body.ingredients = req.body.ingredients.map(ingredient => {
          // Wenn bereits ein Objekt mit "name" ist, nicht ändern
          if (typeof ingredient === 'object' && ingredient.name) {
            return ingredient;
          }
          // Andernfalls als Objekt mit "name" umwandeln
          return { name: ingredient };
        });
      }
    }
    
    // Boolean-Werte verarbeiten
    if (req.body.isActive !== undefined) {
      if (typeof req.body.isActive === 'string') {
        // Konvertiere String zu Boolean
        req.body.isActive = req.body.isActive.toLowerCase() === 'true';
      }
    }
    
    // Zeitstempel für Aktualisierungen
    if (req.method === 'PUT') {
      req.body.updatedAt = new Date();
    }
    
    console.log('Aufbereitete Getränkedaten:', JSON.stringify(req.body, null, 2));
    next();
  } catch (error) {
    console.error('Fehler bei der Getränkedatenverarbeitung:', error);
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

// @route   GET /api/drinks
// @desc    Alle Getränke erhalten (mit Bar-Filter)
// @access  Private
router.get('/', protect, getList(Drink, { sort: { name: 1 } }));

// @route   GET /api/drinks/popular/list
// @desc    Beliebte Getränke erhalten (mit Bar-Filter)
// @access  Private
router.get('/popular/list', protect, async (req, res) => {
  try {
    const popularDrinks = await Drink.find({ 
      popular: true,
      bar: req.barId 
    });
    res.json({
      success: true,
      count: popularDrinks.length,
      data: popularDrinks
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Abrufen beliebter Getränke'
    });
  }
});

// @route   GET /api/drinks/:id
// @desc    Einzelnes Getränk erhalten (mit Bar-Filter)
// @access  Private
router.get('/:id', protect, getOne(Drink));

// @route   POST /api/drinks
// @desc    Getränk erstellen (mit Bar-Filter)
// @access  Private
router.post('/', protect, prepareDrinkData, createOne(Drink));

// @route   PUT /api/drinks/:id
// @desc    Getränk aktualisieren (mit Bar-Filter)
// @access  Private
router.put('/:id', protect, prepareDrinkData, updateOne(Drink));

// @route   DELETE /api/drinks/:id
// @desc    Getränk löschen (mit Bar-Filter)
// @access  Private
router.delete('/:id', protect, deleteOne(Drink));

// Fehlerbehandlungs-Middleware registrieren
router.use(handleMongooseErrors);

module.exports = router;