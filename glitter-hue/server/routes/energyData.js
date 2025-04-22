// server/routes/energyData.js
const express = require('express');
const router = express.Router();
const EnergyData = require('../models/EnergyData');
// Auth-Middleware entfernt

// Energiedaten für einen Benutzer abrufen
router.get('/:userId', async (req, res) => {
    try {
        // Auth-Prüfung entfernt

        const energyData = await EnergyData.find({ userId: req.params.userId })
            .sort({ timestamp: -1 })
            .limit(1000);  // Begrenze die Ergebnisse

        res.json(energyData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Serverfehler' });
    }
});

// Energiedaten speichern
router.post('/', async (req, res) => {
    try {
        const { userId, lightId, data } = req.body;

        // Auth-Prüfung entfernt

        const newData = new EnergyData({
            userId,
            lightId,
            ...data
        });

        const savedData = await newData.save();
        res.json(savedData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Serverfehler' });
    }
});

// Verlaufsdaten für eine bestimmte Lampe abrufen
router.get('/:userId/history/:lightId', async (req, res) => {
    try {
        const { startTime, endTime } = req.query;

        // Auth-Prüfung entfernt

        // Basisfilter
        const filter = {
            userId: req.params.userId,
            lightId: req.params.lightId
        };

        // Zeitfilter hinzufügen, falls vorhanden
        if (startTime || endTime) {
            filter.timestamp = {};
            if (startTime) filter.timestamp.$gte = new Date(parseInt(startTime));
            if (endTime) filter.timestamp.$lte = new Date(parseInt(endTime));
        }

        const history = await EnergyData.find(filter).sort({ timestamp: 1 });
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Serverfehler' });
    }
});

module.exports = router;