const mongoose = require('mongoose');
const { EXPENSE_CATEGORIES } = require('../utils/constants');

const expenseCategoryOptions = EXPENSE_CATEGORIES.map(category => category.id);

const ExpenseSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: expenseCategoryOptions,
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
  recurring: {
    type: Boolean,
    default: false
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
ExpenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Expense = mongoose.model('Expense', ExpenseSchema);

module.exports = Expense;