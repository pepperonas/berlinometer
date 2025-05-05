const mongoose = require('mongoose');
const { INCOME_CATEGORIES } = require('../utils/constants');

const incomeCategoryOptions = INCOME_CATEGORIES.map(category => category.id);

const IncomeSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: incomeCategoryOptions,
    required: [true, 'Bitte Kategorie angeben']
  },
  amount: {
    type: Number,
    required: [true, 'Bitte Betrag angeben'],
    min: [0, 'Betrag muss größer oder gleich 0 sein']
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  description: {
    type: String,
    required: [true, 'Bitte Beschreibung angeben'],
    maxlength: [500, 'Beschreibung darf maximal 500 Zeichen lang sein']
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
IncomeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Income = mongoose.model('Income', IncomeSchema);

module.exports = Income;