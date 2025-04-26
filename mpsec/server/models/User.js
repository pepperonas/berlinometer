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
  try {
    // Nur wenn Passwort geändert wurde
    if (!this.isModified('password')) {
      return next();
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error('Fehler beim Passwort-Hashing:', error);
    next(error);
  }
});

// Methode zum Passwort-Vergleich
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('Fehler beim Passwort-Vergleich:', error);
    throw new Error('Passwort-Vergleich fehlgeschlagen: ' + error.message);
  }
};

// JWT Token für den Benutzer generieren
UserSchema.methods.getSignedJwtToken = function() {
  try {
    // Prüfen, ob JWT_SECRET existiert
    const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_for_development';
    if (!jwtSecret) {
      throw new Error('JWT_SECRET ist nicht definiert');
    }

    // Eindeutige Benutzer-ID im Token speichern
    return jwt.sign(
        {
          id: this._id,
          username: this.username,
          // Zufällige Komponente hinzufügen, um Token-Wiederverwendung zu verhindern
          jti: Math.random().toString(36).substring(2)
        },
        jwtSecret,
        {
          expiresIn: process.env.JWT_EXPIRE || '30d'
        }
    );
  } catch (error) {
    console.error('Fehler bei der JWT-Token-Generierung:', error);
    throw new Error('Token-Generierung fehlgeschlagen: ' + error.message);
  }
};

module.exports = mongoose.model('User', UserSchema);