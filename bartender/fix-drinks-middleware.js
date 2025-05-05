/**
 * Verbesserter Code für server/routes/drinks.js
 * 
 * Diese verbesserte Version enthält Middleware-Funktionen zur Validierung und 
 * Formatierung der Drink-Daten, um häufige Fehler zu vermeiden.
 * 
 * Kopiere diesen Code in die Datei server/routes/drinks.js oder 
 * passe die bestehende Datei entsprechend an.
 */

const express = require('express');
const router = express.Router();
const Drink = require('../models/Drink');

// Middleware zur Vorbereitung und Validierung der Getränkedaten
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
    
    // Entferne Felder, die nicht im Schema definiert sind
    if (req.body.cost !== undefined) {
      delete req.body.cost; // "cost"-Feld wird im Schema nicht verwendet
    }
    
    // Zeitstempel für Aktualisierungen
    if (req.method === 'PUT') {
      req.body.updatedAt = new Date();
    }
    
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
// @desc    Alle Getränke erhalten
// @access  Public
router.get('/', async (req, res) => {
  try {
    const drinks = await Drink.find().sort({ name: 1 });
    res.json(drinks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/drinks/popular/list
// @desc    Beliebte Getränke erhalten
// @access  Public
router.get('/popular/list', async (req, res) => {
  try {
    const popularDrinks = await Drink.find({ popular: true });
    res.json(popularDrinks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/drinks/:id
// @desc    Einzelnes Getränk erhalten
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const drink = await Drink.findById(req.params.id);
    
    if (!drink) {
      return res.status(404).json({ message: 'Getränk nicht gefunden' });
    }
    
    res.json(drink);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Getränk nicht gefunden' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/drinks
// @desc    Getränk erstellen
// @access  Private
router.post('/', prepareDrinkData, async (req, res, next) => {
  try {
    const newDrink = new Drink(req.body);
    const drink = await newDrink.save();
    console.log('Getränk erfolgreich erstellt:', drink._id);
    res.json(drink);
  } catch (err) {
    next(err); // Weiterleitung an die Fehlerbehandlungs-Middleware
  }
});

// @route   PUT /api/drinks/:id
// @desc    Getränk aktualisieren
// @access  Private
router.put('/:id', prepareDrinkData, async (req, res, next) => {
  try {
    const drink = await Drink.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true,           // Gibt das aktualisierte Dokument zurück
        runValidators: true, // Führt die Schema-Validierungen aus
        context: 'query'     // Erlaubt den Zugriff auf die Abfrage in Pre-Hooks
      }
    );
    
    if (!drink) {
      return res.status(404).json({ 
        success: false, 
        error: 'Getränk nicht gefunden' 
      });
    }
    
    console.log('Getränk erfolgreich aktualisiert:', drink._id);
    res.json(drink);
  } catch (err) {
    next(err); // Weiterleitung an die Fehlerbehandlungs-Middleware
  }
});

// @route   DELETE /api/drinks/:id
// @desc    Getränk löschen
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const drink = await Drink.findById(req.params.id);
    
    if (!drink) {
      return res.status(404).json({ message: 'Getränk nicht gefunden' });
    }
    
    await drink.deleteOne();
    res.json({ message: 'Getränk entfernt' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Getränk nicht gefunden' });
    }
    
    res.status(500).send('Server Error');
  }
});

// Fehlerbehandlungs-Middleware registrieren
router.use(handleMongooseErrors);

module.exports = router;