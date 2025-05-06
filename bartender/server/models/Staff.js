const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
  bar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bar',
    required: [true, 'Jeder Mitarbeiter muss einer Bar zugeordnet sein']
  },
  name: {
    type: String,
    required: [true, 'Bitte geben Sie einen Namen an'],
    trim: true,
    maxlength: [100, 'Name darf nicht länger als 100 Zeichen sein']
  },
  position: {
    type: String,
    required: [true, 'Bitte geben Sie eine Position an'],
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
  startDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: Number,
    min: [0, 'Gehalt muss größer oder gleich 0 sein']
  },
  // Hilfswerte für das Frontend
  hourlyRate: {
    type: Number,
    min: [0, 'Stundenlohn muss größer oder gleich 0 sein']
  },
  hoursPerWeek: {
    type: Number,
    min: [0, 'Wochenstunden müssen größer oder gleich 0 sein']
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'bartender', 'waiter', 'trainee', 'chef', 'cleaner'],
    default: 'bartender'
  },
  schedule: {
    type: [{
      day: {
        type: String,
        enum: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag', 
               'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      startTime: String,
      endTime: String
    }],
    default: [],
    validate: {
      validator: function(schedules) {
        // Allow empty schedules
        if (!schedules || schedules.length === 0) return true;
        
        // Check each schedule item
        for (const schedule of schedules) {
          if (!schedule.day) return false;
          // Other validations can be added here
        }
        return true;
      },
      message: 'Ungültiger Zeitplan. Bitte überprüfen Sie das Format.'
    }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notizen dürfen nicht länger als 500 Zeichen sein']
  },
  image: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  isActive: {
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
StaffSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Staff = mongoose.model('Staff', StaffSchema);

module.exports = Staff;