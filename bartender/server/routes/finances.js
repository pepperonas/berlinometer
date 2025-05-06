const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const { addBarToBody } = require('../middleware/barFilter');

// ========== AUSGABEN-ROUTES ==========

// @route   GET /api/finances/expenses
// @desc    Alle Ausgaben abrufen
// @access  Private
router.get('/expenses', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({ bar: req.barId }).sort({ date: -1 });
    
    // IDs formatieren
    const formattedExpenses = expenses.map(expense => {
      const expenseObj = expense.toObject();
      expenseObj.id = expenseObj._id.toString();
      return expenseObj;
    });
    
    res.json(formattedExpenses);
  } catch (err) {
    console.error('Fehler beim Abrufen der Ausgaben:', err.message);
    res.status(500).json({ message: 'Server-Fehler' });
  }
});

// @route   GET /api/finances/expenses/:id
// @desc    Einzelne Ausgabe abrufen
// @access  Private
router.get('/expenses/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, bar: req.barId });
    
    if (!expense) {
      return res.status(404).json({ message: 'Ausgabe nicht gefunden' });
    }
    
    res.json(expense);
  } catch (err) {
    console.error('Fehler beim Abrufen der Ausgabe:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ausgabe nicht gefunden' });
    }
    
    res.status(500).json({ message: 'Server-Fehler' });
  }
});

// @route   POST /api/finances/expenses
// @desc    Neue Ausgabe erstellen
// @access  Private
router.post('/expenses', protect, addBarToBody, async (req, res) => {
  try {
    const { category, amount, date, description, recurring } = req.body;
    
    // Neue Ausgabe erstellen
    const newExpense = new Expense({
      bar: req.barId, // Bar-ID hinzufügen
      category,
      amount,
      date,
      description,
      recurring
    });
    
    const expense = await newExpense.save();
    
    // ID formatieren
    const expenseObj = expense.toObject();
    expenseObj.id = expenseObj._id.toString();
    
    res.json(expenseObj);
  } catch (err) {
    console.error('Fehler beim Erstellen der Ausgabe:', err.message);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server-Fehler' });
  }
});

// @route   PUT /api/finances/expenses/:id
// @desc    Ausgabe aktualisieren
// @access  Private
router.put('/expenses/:id', protect, addBarToBody, async (req, res) => {
  try {
    const { category, amount, date, description, recurring } = req.body;
    
    // Vorhandene Ausgabe suchen und aktualisieren
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, bar: req.barId },
      {
        category,
        amount,
        date,
        description,
        recurring,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!expense) {
      return res.status(404).json({ message: 'Ausgabe nicht gefunden' });
    }
    
    // ID formatieren
    const expenseObj = expense.toObject();
    expenseObj.id = expenseObj._id.toString();
    
    res.json(expenseObj);
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Ausgabe:', err.message);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ausgabe nicht gefunden' });
    }
    
    res.status(500).json({ message: 'Server-Fehler' });
  }
});

// @route   DELETE /api/finances/expenses/:id
// @desc    Ausgabe löschen
// @access  Private
router.delete('/expenses/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, bar: req.barId });
    
    if (!expense) {
      return res.status(404).json({ message: 'Ausgabe nicht gefunden' });
    }
    
    await expense.deleteOne();
    
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Fehler beim Löschen der Ausgabe:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Ausgabe nicht gefunden' });
    }
    
    res.status(500).json({ message: 'Server-Fehler' });
  }
});

// ========== EINNAHMEN-ROUTES ==========

// @route   GET /api/finances/income
// @desc    Alle Einnahmen abrufen
// @access  Private
router.get('/income', protect, async (req, res) => {
  try {
    const incomes = await Income.find({ bar: req.barId }).sort({ date: -1 });
    
    // IDs formatieren
    const formattedIncomes = incomes.map(income => {
      const incomeObj = income.toObject();
      incomeObj.id = incomeObj._id.toString();
      return incomeObj;
    });
    
    res.json(formattedIncomes);
  } catch (err) {
    console.error('Fehler beim Abrufen der Einnahmen:', err.message);
    res.status(500).json({ message: 'Server-Fehler' });
  }
});

// @route   GET /api/finances/income/:id
// @desc    Einzelne Einnahme abrufen
// @access  Private
router.get('/income/:id', protect, async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, bar: req.barId });
    
    if (!income) {
      return res.status(404).json({ message: 'Einnahme nicht gefunden' });
    }
    
    res.json(income);
  } catch (err) {
    console.error('Fehler beim Abrufen der Einnahme:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Einnahme nicht gefunden' });
    }
    
    res.status(500).json({ message: 'Server-Fehler' });
  }
});

// @route   POST /api/finances/income
// @desc    Neue Einnahme erstellen
// @access  Private
router.post('/income', protect, addBarToBody, async (req, res) => {
  try {
    const { category, amount, date, description } = req.body;
    
    // Neue Einnahme erstellen
    const newIncome = new Income({
      bar: req.barId, // Bar-ID hinzufügen
      category,
      amount,
      date,
      description
    });
    
    const income = await newIncome.save();
    
    // ID formatieren
    const incomeObj = income.toObject();
    incomeObj.id = incomeObj._id.toString();
    
    res.json(incomeObj);
  } catch (err) {
    console.error('Fehler beim Erstellen der Einnahme:', err.message);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server-Fehler' });
  }
});

// @route   PUT /api/finances/income/:id
// @desc    Einnahme aktualisieren
// @access  Private
router.put('/income/:id', protect, addBarToBody, async (req, res) => {
  try {
    const { category, amount, date, description } = req.body;
    
    // Vorhandene Einnahme suchen und aktualisieren
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, bar: req.barId },
      {
        category,
        amount,
        date,
        description,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!income) {
      return res.status(404).json({ message: 'Einnahme nicht gefunden' });
    }
    
    // ID formatieren
    const incomeObj = income.toObject();
    incomeObj.id = incomeObj._id.toString();
    
    res.json(incomeObj);
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Einnahme:', err.message);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Einnahme nicht gefunden' });
    }
    
    res.status(500).json({ message: 'Server-Fehler' });
  }
});

// @route   DELETE /api/finances/income/:id
// @desc    Einnahme löschen
// @access  Private
router.delete('/income/:id', protect, async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, bar: req.barId });
    
    if (!income) {
      return res.status(404).json({ message: 'Einnahme nicht gefunden' });
    }
    
    await income.deleteOne();
    
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Fehler beim Löschen der Einnahme:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Einnahme nicht gefunden' });
    }
    
    res.status(500).json({ message: 'Server-Fehler' });
  }
});

module.exports = router;