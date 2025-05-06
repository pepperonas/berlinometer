const mongoose = require('mongoose');

const BarSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bitte geben Sie einen Namen für die Bar an'],
    trim: true,
    maxlength: [100, 'Name darf nicht länger als 100 Zeichen sein']
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'Deutschland',
      trim: true
    }
  },
  contact: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Bitte geben Sie eine gültige E-Mail-Adresse an'
      ]
    },
    website: {
      type: String,
      trim: true
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Temporär auf false, da wir beim Erstellen noch keinen Benutzer haben
  },
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  settings: {
    currency: {
      type: String,
      default: 'EUR'
    },
    taxRate: {
      type: Number,
      default: 19
    },
    theme: {
      type: String,
      default: 'default'
    },
    openingHours: {
      monday: {
        open: String,
        close: String,
        closed: {
          type: Boolean,
          default: false
        }
      },
      tuesday: {
        open: String,
        close: String,
        closed: {
          type: Boolean,
          default: false
        }
      },
      wednesday: {
        open: String,
        close: String,
        closed: {
          type: Boolean,
          default: false
        }
      },
      thursday: {
        open: String,
        close: String,
        closed: {
          type: Boolean,
          default: false
        }
      },
      friday: {
        open: String,
        close: String,
        closed: {
          type: Boolean,
          default: false
        }
      },
      saturday: {
        open: String,
        close: String,
        closed: {
          type: Boolean,
          default: false
        }
      },
      sunday: {
        open: String,
        close: String,
        closed: {
          type: Boolean,
          default: false
        }
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  logo: {
    type: String
  },
  taxId: {
    type: String,
    trim: true
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
BarSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Bar = mongoose.model('Bar', BarSchema);

module.exports = Bar;