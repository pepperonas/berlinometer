const mongoose = require('mongoose');
const crypto = require('crypto');

// Hilfsfunktionen für Ver- und Entschlüsselung
const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(16);

    // Stellen sicher, dass der Schlüssel exakt 32 Bytes hat
    const key = Buffer.from(process.env.ENCRYPTION_KEY.padEnd(32).slice(0, 32));

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Fehler bei der Verschlüsselung: ' + error.message);
  }
};

const decrypt = (text) => {
  try {
    const [ivHex, encryptedText] = text.split(':');
    if (!ivHex || !encryptedText) {
      return text; // Nicht verschlüsselte Daten zurückgeben
    }

    const iv = Buffer.from(ivHex, 'hex');
    // Stellen sicher, dass der Schlüssel exakt 32 Bytes hat
    const key = Buffer.from(process.env.ENCRYPTION_KEY.padEnd(32).slice(0, 32));

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Im Fehlerfall Original zurückgeben
  }
};

const TokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bitte gib einen Namen für den Token ein'],
    trim: true
  },
  secret: {
    type: String,
    required: [true, 'Bitte gib ein Token-Secret ein'],
    set: encrypt,
    get: decrypt
  },
  issuer: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['totp', 'hotp'],
    default: 'totp'
  },
  algorithm: {
    type: String,
    enum: ['SHA1', 'SHA256', 'SHA512'],
    default: 'SHA1'
  },
  digits: {
    type: Number,
    enum: [6, 8],
    default: 6
  },
  period: {
    type: Number,
    default: 30
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Sicherstellen, dass das Secret nicht in der JSON-Ausgabe enthalten ist
TokenSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.secret;
  return obj;
};

module.exports = mongoose.model('Token', TokenSchema);