const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bitte geben Sie einen Namen an'],
    trim: true,
    maxlength: [100, 'Name darf nicht länger als 100 Zeichen sein']
  },
  category: {
    type: String,
    enum: ['spirit', 'wine', 'beer', 'mixer', 'fruit', 'other'],
    default: 'other'
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  unit: {
    type: String,
    required: [true, 'Bitte geben Sie eine Einheit an'],
    enum: ['bottle', 'box', 'case', 'kg', 'liter', 'piece', 'other'],
    default: 'bottle'
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Menge muss größer oder gleich 0 sein']
  },
  minQuantity: {
    type: Number,
    default: 5,
    min: [0, 'Mindestmenge muss größer oder gleich 0 sein']
  },
  costPerUnit: {
    type: Number,
    required: true,
    min: [0, 'Kosten müssen größer oder gleich 0 sein']
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notizen dürfen nicht länger als 500 Zeichen sein']
  },
  lastOrdered: {
    type: Date
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
InventorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Inventory = mongoose.model('Inventory', InventorySchema);

module.exports = Inventory;