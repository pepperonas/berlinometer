const mongoose = require('mongoose');

const practiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: {
    street: String,
    city: String,
    zip: String,
    country: String
  },
  phone: String,
  email: String,
  specialty: String,
  doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Practice', practiceSchema);
