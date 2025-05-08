const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bitte geben Sie einen Namen an'],
    trim: true,
    maxlength: [100, 'Name darf nicht länger als 100 Zeichen sein']
  },
  contactPerson: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Bitte geben Sie eine gültige E-Mail-Adresse an'
    ]
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    postalCode: String,
    country: String
  },
  website: {
    type: String,
    trim: true
  },
  categories: [{
    type: String,
    enum: ['spirit', 'wine', 'beer', 'mixer', 'fruit', 'equipment', 'other']
  }],
  paymentTerms: {
    type: String
  },
  notes: {
    type: String,
    maxlength: [500, 'Notizen dürfen nicht länger als 500 Zeichen sein']
  },
  active: {
    type: Boolean,
    default: true
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
SupplierSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Supplier = mongoose.model('Supplier', SupplierSchema);

module.exports = Supplier;