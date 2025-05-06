const mongoose = require('mongoose');
const { PAYMENT_METHODS } = require('../utils/constants');

const paymentMethodOptions = PAYMENT_METHODS.map(method => method.id);

const SaleSchema = new mongoose.Schema({
  bar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bar',
    required: [true, 'Jeder Verkauf muss einer Bar zugeordnet sein']
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  items: [{
    drinkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drink',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Menge muss größer oder gleich 1 sein']
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: [0, 'Preis muss größer oder gleich 0 sein']
    }
  }],
  total: {
    type: Number,
    required: true,
    min: [0, 'Gesamtbetrag muss größer oder gleich 0 sein']
  },
  paymentMethod: {
    type: String,
    enum: paymentMethodOptions,
    default: 'cash'
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notizen dürfen nicht länger als 500 Zeichen sein']
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
SaleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methode zum Berechnen des Gesamtbetrags
SaleSchema.methods.calculateTotal = function() {
  if (!this.items || this.items.length === 0) return 0;
  
  return this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.pricePerUnit);
  }, 0);
};

// Gesamtbetrag vor dem Speichern berechnen, falls nicht angegeben
SaleSchema.pre('save', function(next) {
  if (!this.total) {
    this.total = this.calculateTotal();
  }
  next();
});

const Sale = mongoose.model('Sale', SaleSchema);

module.exports = Sale;