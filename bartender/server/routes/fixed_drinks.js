const express = require('express');
const router = express.Router();
const Drink = require('../models/Drink');

// WICHTIG: Spezifische Routen VOR dynamischen Routen definieren
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
router.post('/', async (req, res) => {
  try {
    const newDrink = new Drink(req.body);
    const drink = await newDrink.save();
    res.json(drink);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/drinks/:id
// @desc    Getränk aktualisieren
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const drink = await Drink.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
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

module.exports = router;