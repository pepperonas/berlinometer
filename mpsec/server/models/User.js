const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Bitte gib einen Benutzernamen ein'],
    unique: true,
    trim: true,
    minlength: [3, 'Benutzername muss mindestens 3 Zeichen haben'],
    maxlength: [20, 'Benutzername darf maximal 20 Zeichen haben']
  },
  password: {
    type: String,
    required: [true, 'Bitte gib ein Passwort ein'],
    minlength: [8, 'Passwort muss mindestens 8 Zeichen haben'],
    select: false // Passwort nicht in Abfrageergebnissen zurückgeben
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Passwort vor dem Speichern hashen
UserSchema.pre('save', async function(next) {
  // Nur wenn Passwort geändert wurde
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Methode zum Passwort-Vergleich
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// JWT Token für den Benutzer generieren
UserSchema.methods.getSignedJwtToken = function() {
  // Eindeutige Benutzer-ID im Token speichern
  return jwt.sign(
      {
        id: this._id,
        username: this.username,
        // Zufällige Komponente hinzufügen, um Token-Wiederverwendung zu verhindern
        jti: Math.random().toString(36).substring(2)
      },
      process.env.JWT_SECRET || 'fallback_jwt_secret_for_development',
      {
        expiresIn: process.env.JWT_EXPIRE || '30d'
      }
  );
};

module.exports = mongoose.model('User', UserSchema);