const mongoose = require('mongoose');
const { INVENTORY_CATEGORIES, INVENTORY_UNITS } = require('../utils/constants');

// Extract just the ID values from the category and unit objects
const categoryEnums = INVENTORY_CATEGORIES.map(category => category.id);
const unitEnums = INVENTORY_UNITS.map(unit => unit.id);

const InventorySchema = new mongoose.Schema({
  bar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bar',
    required: [true, 'Jedes Inventarelement muss einer Bar zugeordnet sein']
  },
  name: {
    type: String,
    required: [true, 'Bitte geben Sie einen Namen an'],
    trim: true,
    maxlength: [100, 'Name darf nicht länger als 100 Zeichen sein']
  },
  category: {
    type: String,
    enum: categoryEnums,
    default: 'other'
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: false,
    default: null
  },
  unit: {
    type: String,
    required: [true, 'Bitte geben Sie eine Einheit an'],
    enum: unitEnums,
    default: 'Flaschen'
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
  lastOrderDate: {
    type: Date,
    default: Date.now
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

// Handle special field validation/normalization for new documents
InventorySchema.pre('save', function(next) {
  // Make sure supplier is valid - if it's empty string or falsy value, set to null
  if (!this.supplier || (typeof this.supplier === 'string' && this.supplier.trim() === '')) {
    this.supplier = null;
  }
  
  // Make sure lastOrderDate is valid
  if (!this.lastOrderDate || (typeof this.lastOrderDate === 'string' && !this.lastOrderDate.trim())) {
    this.lastOrderDate = new Date();
    console.log('Set empty lastOrderDate to current date in pre-save hook');
  } else if (isNaN(Date.parse(this.lastOrderDate))) {
    this.lastOrderDate = new Date();
    console.log('Set invalid lastOrderDate to current date in pre-save hook');
  }
  
  next();
});

// Handle updating via findOneAndUpdate, findByIdAndUpdate, etc.
InventorySchema.pre('findOneAndUpdate', function(next) {
  // Get the update document
  const update = this.getUpdate();
  console.log('Pre-update hook for Inventory:', JSON.stringify(update, null, 2));
  
  // Make sure supplier is valid
  if (update.supplier === '' || update.supplier === undefined) {
    update.supplier = null;
    console.log('Set supplier to null in pre-update hook');
  }
  
  // Make sure lastOrderDate is valid
  if (update.lastOrderDate) {
    if (typeof update.lastOrderDate === 'string' && !update.lastOrderDate.trim()) {
      update.lastOrderDate = new Date();
      console.log('Set empty lastOrderDate to current date in pre-update hook');
    } else if (isNaN(Date.parse(update.lastOrderDate))) {
      update.lastOrderDate = new Date();
      console.log('Set invalid lastOrderDate to current date in pre-update hook');
    }
  }
  
  // Set updatedAt
  update.updatedAt = Date.now();
  
  next();
});

const Inventory = mongoose.model('Inventory', InventorySchema);

module.exports = Inventory;