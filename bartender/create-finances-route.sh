#!/bin/bash

# Dieses Skript erstellt die finances.js-Route direkt auf dem Server

# Überprüfe, ob die Datei bereits existiert
if [ -f "/var/www/html/bartender/server/routes/finances.js" ]; then
  echo "Die Datei finances.js existiert bereits. Soll sie überschrieben werden? (j/n)"
  read -r antwort
  if [ "$antwort" != "j" ]; then
    echo "Abbruch. Keine Änderungen vorgenommen."
    exit 0
  fi
fi

# Stelle sicher, dass das Verzeichnis existiert
mkdir -p /var/www/html/bartender/server/routes

# Erstelle die finances.js-Datei
cat > /var/www/html/bartender/server/routes/finances.js << 'EOL'
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const mongoose = require('mongoose');

// ========== AUSGABEN-ROUTES ==========

// @route   GET /api/finances/expenses
// @desc    Alle Ausgaben abrufen
// @access  Private
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    
    // IDs formatieren
    const formattedExpenses = expenses.map(expense => {
      const expenseObj = expense.toObject();
      expenseObj.id = expenseObj._id.toString();
      return expenseObj;
    });
    
    console.log(`Ausgaben geladen: ${formattedExpenses.length}`);
    res.json(formattedExpenses);
  } catch (err) {
    console.error('Fehler beim Abrufen der Ausgaben:', err.message);
    res.status(500).json({ message: 'Server-Fehler' });
  }
});

// @route   GET /api/finances/expenses/:id
// @desc    Einzelne Ausgabe abrufen
// @access  Private
router.get('/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
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
router.post('/expenses', async (req, res) => {
  try {
    const { category, amount, date, description, recurring } = req.body;
    console.log('Neue Ausgabe erstellen:', req.body);
    
    // Neue Ausgabe erstellen
    const newExpense = new Expense({
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
    
    console.log('Ausgabe erstellt mit ID:', expenseObj.id);
    res.json(expenseObj);
  } catch (err) {
    console.error('Fehler beim Erstellen der Ausgabe:', err);
    
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
router.put('/expenses/:id', async (req, res) => {
  try {
    const { category, amount, date, description, recurring } = req.body;
    console.log(`Ausgabe ${req.params.id} aktualisieren:`, req.body);
    
    // Vorhandene Ausgabe suchen und aktualisieren
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
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
    
    console.log('Ausgabe aktualisiert:', expenseObj.id);
    res.json(expenseObj);
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Ausgabe:', err);
    
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
router.delete('/expenses/:id', async (req, res) => {
  console.log(`Lösche Ausgabe mit ID: ${req.params.id}`);
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Ausgabe nicht gefunden' });
    }
    
    await expense.deleteOne();
    
    console.log(`Ausgabe ${req.params.id} erfolgreich gelöscht`);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Fehler beim Löschen der Ausgabe:', err);
    
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
router.get('/income', async (req, res) => {
  try {
    const incomes = await Income.find().sort({ date: -1 });
    
    // IDs formatieren
    const formattedIncomes = incomes.map(income => {
      const incomeObj = income.toObject();
      incomeObj.id = incomeObj._id.toString();
      return incomeObj;
    });
    
    console.log(`Einnahmen geladen: ${formattedIncomes.length}`);
    res.json(formattedIncomes);
  } catch (err) {
    console.error('Fehler beim Abrufen der Einnahmen:', err.message);
    res.status(500).json({ message: 'Server-Fehler' });
  }
});

// @route   GET /api/finances/income/:id
// @desc    Einzelne Einnahme abrufen
// @access  Private
router.get('/income/:id', async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);
    
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
router.post('/income', async (req, res) => {
  try {
    const { category, amount, date, description } = req.body;
    console.log('Neue Einnahme erstellen:', req.body);
    
    // Neue Einnahme erstellen
    const newIncome = new Income({
      category,
      amount,
      date,
      description
    });
    
    const income = await newIncome.save();
    
    // ID formatieren
    const incomeObj = income.toObject();
    incomeObj.id = incomeObj._id.toString();
    
    console.log('Einnahme erstellt mit ID:', incomeObj.id);
    res.json(incomeObj);
  } catch (err) {
    console.error('Fehler beim Erstellen der Einnahme:', err);
    
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
router.put('/income/:id', async (req, res) => {
  try {
    const { category, amount, date, description } = req.body;
    console.log(`Einnahme ${req.params.id} aktualisieren:`, req.body);
    
    // Vorhandene Einnahme suchen und aktualisieren
    const income = await Income.findByIdAndUpdate(
      req.params.id,
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
    
    console.log('Einnahme aktualisiert:', incomeObj.id);
    res.json(incomeObj);
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Einnahme:', err);
    
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
router.delete('/income/:id', async (req, res) => {
  console.log(`Lösche Einnahme mit ID: ${req.params.id}`);
  try {
    const income = await Income.findById(req.params.id);
    
    if (!income) {
      return res.status(404).json({ message: 'Einnahme nicht gefunden' });
    }
    
    await income.deleteOne();
    
    console.log(`Einnahme ${req.params.id} erfolgreich gelöscht`);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Fehler beim Löschen der Einnahme:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Einnahme nicht gefunden' });
    }
    
    res.status(500).json({ message: 'Server-Fehler' });
  }
});

// @route   GET /api/finances/test
// @desc    Test-Endpunkt
// @access  Public
router.get('/test', (req, res) => {
  console.log('Finances Test-Endpunkt aufgerufen');
  res.json({ 
    message: 'Finances-API ist aktiv und funktioniert!', 
    time: new Date(),
    version: '1.0'
  });
});

module.exports = router;
EOL

echo "finances.js wurde erstellt in: /var/www/html/bartender/server/routes/finances.js"

# Erstelle die Expense.js-Datei
if [ ! -f "/var/www/html/bartender/server/models/Expense.js" ]; then
  # Stelle sicher, dass das Verzeichnis existiert
  mkdir -p /var/www/html/bartender/server/models
  
  cat > /var/www/html/bartender/server/models/Expense.js << 'EOL'
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
EOL

  echo "Expense.js wurde erstellt in: /var/www/html/bartender/server/models/Expense.js"
fi

# Erstelle die Income.js-Datei
if [ ! -f "/var/www/html/bartender/server/models/Income.js" ]; then
  # Stelle sicher, dass das Verzeichnis existiert
  mkdir -p /var/www/html/bartender/server/models
  
  cat > /var/www/html/bartender/server/models/Income.js << 'EOL'
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
EOL

  echo "Income.js wurde erstellt in: /var/www/html/bartender/server/models/Income.js"
fi

# Aktualisiere die constants.js-Datei, falls INCOME_CATEGORIES fehlt
if ! grep -q "INCOME_CATEGORIES" "/var/www/html/bartender/server/utils/constants.js"; then
  echo "Füge INCOME_CATEGORIES zu constants.js hinzu..."
  
  # Erstelle ein temporäres Backup
  cp /var/www/html/bartender/server/utils/constants.js /var/www/html/bartender/server/utils/constants.js.bak
  
  # Füge die neuen Kategorien nach EXPENSE_CATEGORIES hinzu
  awk '
  /const EXPENSE_CATEGORIES = \[/,/\];/ {
    print;
    if ($0 ~ /\];/) {
      print "\n// Einnahmenkategorien";
      print "const INCOME_CATEGORIES = [";
      print "  { id: \"bar\", name: \"Bar\" },";
      print "  { id: \"food\", name: \"Essen\" },";
      print "  { id: \"events\", name: \"Veranstaltungen\" },";
      print "  { id: \"merchandise\", name: \"Merchandise\" },";
      print "  { id: \"gifts\", name: \"Gutscheine\" },";
      print "  { id: \"other\", name: \"Sonstiges\" },";
      print "];";
      next;
    }
  }
  /module\.exports = \{/ {
    gsub(/module\.exports = \{/, "module.exports = {\n  INCOME_CATEGORIES,");
    print;
    next;
  }
  { print }
  ' /var/www/html/bartender/server/utils/constants.js.bak > /var/www/html/bartender/server/utils/constants.js
  
  echo "constants.js erfolgreich aktualisiert"
else
  echo "INCOME_CATEGORIES ist bereits in constants.js definiert, keine Änderung nötig"
fi

echo "Alle notwendigen Dateien für die Finance-API wurden erstellt. Bitte starten Sie den Server neu."