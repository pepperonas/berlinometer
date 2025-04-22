// server/models/EnergyData.js
const mongoose = require('mongoose');

const EnergyDataSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    lightId: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    value: Number,
    valueWh: Number,
    isStandby: Boolean,
    brightness: Number,
    costPerKwh: Number,
    energyType: String
});

// Index für schnellere Abfragen nach Benutzer, Lampe und Zeitraum
EnergyDataSchema.index({ userId: 1, lightId: 1, timestamp: 1 });

module.exports = mongoose.model('EnergyData', EnergyDataSchema);