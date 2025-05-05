const mongoose = require('mongoose');

const DrinkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bitte geben Sie einen Namen an'],
    trim: true,
    maxlength: [100, 'Name darf nicht länger als 100 Zeichen sein']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Beschreibung darf nicht länger als 500 Zeichen sein']
  },
  price: {
    type: Number,
    required: [true, 'Bitte geben Sie einen Preis an'],
    min: [0, 'Preis muss größer oder gleich 0 sein']
  },
  cost: {
    type: Number,
    min: [0, 'Einkaufspreis muss größer oder gleich 0 sein'],
    default: 0
  },
  category: {
    type: String,
    enum: ['beer', 'wine', 'cocktails', 'spirits', 'softDrinks', 'other'],
    default: 'other'
  },
  ingredients: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: String
    }
  }],
  alcohol: {
    type: Number,
    min: [0, 'Alkoholgehalt muss größer oder gleich 0 sein'],
    max: [100, 'Alkoholgehalt muss kleiner oder gleich 100 sein']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Bestand muss größer oder gleich 0 sein']
  },
  popular: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Aktualisiere updatedAt bei jeder Änderung
DrinkSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Drink = mongoose.model('Drink', DrinkSchema);

module.exports = Drink;