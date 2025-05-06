const express = require('express');
const router = express.Router();
const Drink = require('../models/Drink');
const { protect } = require('../middleware/auth');
const { addBarToBody } = require('../middleware/barFilter');

// WICHTIG: Spezifische Routen VOR dynamischen Routen definieren
// @route   GET /api/drinks/popular/list
// @desc    Beliebte Getränke erhalten
// @access  Public
router.get('/popular/list', protect, async (req, res) => {
  try {
    const popularDrinks = await Drink.find({ popular: true, bar: req.barId });
    res.json(popularDrinks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/drinks
// @desc    Alle Getränke erhalten
// @access  Public
router.get('/', protect, async (req, res) => {
  try {
    const drinks = await Drink.find({ bar: req.barId }).sort({ name: 1 });
    res.json(drinks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/drinks/:id
// @desc    Einzelnes Getränk erhalten
// @access  Public
router.get('/:id', protect, async (req, res) => {
  try {
    const drink = await Drink.findOne({ _id: req.params.id, bar: req.barId });
    
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
router.post('/', protect, addBarToBody, async (req, res) => {
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
router.put('/:id', protect, addBarToBody, async (req, res) => {
  try {
    const drink = await Drink.findOneAndUpdate(
      { _id: req.params.id, bar: req.barId }, 
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
router.delete('/:id', protect, async (req, res) => {
  try {
    const drink = await Drink.findOne({ _id: req.params.id, bar: req.barId });
    
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