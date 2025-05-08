const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bitte geben Sie einen Namen an'],
    trim: true,
    maxlength: [50, 'Name darf nicht länger als 50 Zeichen sein']
  },
  email: {
    type: String,
    required: [true, 'Bitte geben Sie eine E-Mail-Adresse an'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Bitte geben Sie eine gültige E-Mail-Adresse an'
    ]
  },
  password: {
    type: String,
    required: [true, 'Bitte geben Sie ein Passwort an'],
    minlength: [6, 'Passwort muss mindestens 6 Zeichen lang sein'],
    select: false // Passwort wird bei DB-Abfragen standardmäßig nicht zurückgegeben
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
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
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Passwort hashen
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Passwort-Vergleich Methode
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// JWT-Token generieren
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET || 'defaultsecretkey',
    { expiresIn: '1d' }
  );
};

const User = mongoose.model('User', UserSchema);

module.exports = User;