const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const { protect } = require('../middleware/auth');
const { addBarToBody } = require('../middleware/barFilter');

// Middleware zur Vorbereitung und Validierung der Mitarbeiterdaten
const prepareStaffData = (req, res, next) => {
  try {
    console.log('Empfangene Mitarbeiterdaten:', JSON.stringify(req.body, null, 2));
    
    // Pflichtfelder überprüfen
    if (!req.body.name) {
      return res.status(400).json({ success: false, error: 'Name ist ein Pflichtfeld' });
    }
    
    // Umwandlung von Frontend-Feldern in Backend-Felder
    if (req.body.role) {
      req.body.position = req.body.role; // Das Frontend sendet 'role', aber das Backend erwartet 'position'
    }
    
    if (!req.body.position) {
      return res.status(400).json({ success: false, error: 'Position/Rolle ist ein Pflichtfeld' });
    }
    
    // Numerische Werte konvertieren
    if (req.body.hourlyRate !== undefined) {
      req.body.hourlyRate = parseFloat(req.body.hourlyRate);
    }
    
    if (req.body.hoursPerWeek !== undefined) {
      req.body.hoursPerWeek = parseFloat(req.body.hoursPerWeek);
    }
    
    // Umwandlung für Gehalt
    if (req.body.hourlyRate !== undefined && req.body.hoursPerWeek !== undefined) {
      // Monatliches Gehalt berechnen (Stundenlohn * Stunden pro Woche * 4.33 Wochen pro Monat)
      const hourlyRate = parseFloat(req.body.hourlyRate);
      const hoursPerWeek = parseFloat(req.body.hoursPerWeek);
      
      if (!isNaN(hourlyRate) && !isNaN(hoursPerWeek)) {
        const monthlySalary = hourlyRate * hoursPerWeek * 4.33;
        req.body.salary = monthlySalary;
      }
    }
    
    // Datum überprüfen
    if (req.body.startDate) {
      try {
        // Stelle sicher, dass das Datum gültig ist
        req.body.startDate = new Date(req.body.startDate);
        
        if (isNaN(req.body.startDate.getTime())) {
          console.log('Ungültiges Startdatum, setze auf aktuelles Datum');
          req.body.startDate = new Date();
        }
      } catch (error) {
        console.log('Fehler beim Parsen des Startdatums:', error);
        req.body.startDate = new Date();
      }
    }
    
    // Synchronisiere isActive und active
    if (req.body.isActive !== undefined) {
      const isActive = typeof req.body.isActive === 'string' 
        ? req.body.isActive.toLowerCase() === 'true'
        : Boolean(req.body.isActive);
      
      req.body.active = isActive;
      req.body.isActive = isActive;
    } else if (req.body.active !== undefined) {
      const active = typeof req.body.active === 'string'
        ? req.body.active.toLowerCase() === 'true'
        : Boolean(req.body.active);
      
      req.body.isActive = active;
      req.body.active = active;
    }
    
    // Setze Zeitstempel
    if (req.method === 'PUT') {
      req.body.updatedAt = new Date();
    }
    
    console.log('Aufbereitete Mitarbeiterdaten:', JSON.stringify(req.body, null, 2));
    next();
  } catch (error) {
    console.error('Fehler bei der Mitarbeiterdatenverarbeitung:', error);
    return res.status(400).json({ success: false, error: 'Ungültiges Datenformat' });
  }
};

// Fehlerbehandlungs-Middleware für Mongoose-Fehler
const handleMongooseErrors = (err, req, res, next) => {
  console.error('Mongoose-Fehler:', err);
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ success: false, error: messages.join(', ') });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Ungültiges Datenformat. Bitte überprüfen Sie die Angaben.' });
  }
  
  return res.status(500).json({ success: false, error: err.message || 'Server-Fehler' });
};

// @route   GET /api/staff
// @desc    Alle Mitarbeiter erhalten
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const staffMembers = await Staff.find({ bar: req.barId }).sort({ name: 1 });
    res.json(staffMembers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/staff/:id
// @desc    Einzelnen Mitarbeiter erhalten
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const staffMember = await Staff.findOne({
      _id: req.params.id,
      bar: req.barId
    });
    
    if (!staffMember) {
      return res.status(404).json({ message: 'Mitarbeiter nicht gefunden' });
    }
    
    res.json(staffMember);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Mitarbeiter nicht gefunden' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/staff
// @desc    Mitarbeiter erstellen
// @access  Private
router.post('/', protect, addBarToBody, prepareStaffData, async (req, res, next) => {
  try {
    // Debug: Zeige die aufbereiteten Daten vor dem Speichern
    console.log('Speichere Mitarbeiter mit Daten:', JSON.stringify(req.body, null, 2));
    
    // Mitarbeiter erstellen
    const newStaff = new Staff(req.body);
    const staff = await newStaff.save();
    console.log('Mitarbeiter erfolgreich erstellt:', staff._id);
    
    // Debug: Zeige die gespeicherten Daten mit hourlyRate und hoursPerWeek
    console.log('Gespeicherte Mitarbeiterdaten:', {
      _id: staff._id,
      name: staff.name,
      position: staff.position,
      salary: staff.salary,
      hourlyRate: staff.hourlyRate,
      hoursPerWeek: staff.hoursPerWeek
    });
    
    res.json(staff);
  } catch (err) {
    next(err); // Weiterleitung an die Fehlerbehandlungs-Middleware
  }
});

// @route   PUT /api/staff/:id
// @desc    Mitarbeiter aktualisieren
// @access  Private
router.put('/:id', protect, addBarToBody, prepareStaffData, async (req, res, next) => {
  try {
    // Debug: Zeige die aufbereiteten Daten vor dem Update
    console.log('Aktualisiere Mitarbeiter mit Daten:', JSON.stringify(req.body, null, 2));
    
    const staffMember = await Staff.findOneAndUpdate(
      {
        _id: req.params.id,
        bar: req.barId
      }, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!staffMember) {
      return res.status(404).json({ success: false, error: 'Mitarbeiter nicht gefunden' });
    }
    
    // Debug: Zeige die aktualisierten Daten mit hourlyRate und hoursPerWeek
    console.log('Aktualisierte Mitarbeiterdaten:', {
      _id: staffMember._id,
      name: staffMember.name,
      position: staffMember.position,
      salary: staffMember.salary,
      hourlyRate: staffMember.hourlyRate,
      hoursPerWeek: staffMember.hoursPerWeek
    });
    
    console.log('Mitarbeiter erfolgreich aktualisiert:', staffMember._id);
    res.json(staffMember);
  } catch (err) {
    next(err); // Weiterleitung an die Fehlerbehandlungs-Middleware
  }
});

// @route   DELETE /api/staff/:id
// @desc    Mitarbeiter löschen
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const staffMember = await Staff.findOne({
      _id: req.params.id,
      bar: req.barId
    });
    
    if (!staffMember) {
      return res.status(404).json({ message: 'Mitarbeiter nicht gefunden' });
    }
    
    await staffMember.deleteOne();
    res.json({ message: 'Mitarbeiter entfernt' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Mitarbeiter nicht gefunden' });
    }
    
    res.status(500).send('Server Error');
  }
});

// Fehlerbehandlungs-Middleware registrieren
router.use(handleMongooseErrors);

module.exports = router;