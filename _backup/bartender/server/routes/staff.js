const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');

// @route   GET /api/staff
// @desc    Alle Mitarbeiter erhalten
// @access  Private
router.get('/', async (req, res) => {
  try {
    const staffMembers = await Staff.find().sort({ name: 1 });
    res.json(staffMembers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/staff/:id
// @desc    Einzelnen Mitarbeiter erhalten
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const staffMember = await Staff.findById(req.params.id);
    
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
router.post('/', async (req, res) => {
  try {
    const newStaff = new Staff(req.body);
    const staff = await newStaff.save();
    res.json(staff);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/staff/:id
// @desc    Mitarbeiter aktualisieren
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const staffMember = await Staff.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
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

// @route   DELETE /api/staff/:id
// @desc    Mitarbeiter löschen
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const staffMember = await Staff.findById(req.params.id);
    
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

module.exports = router;