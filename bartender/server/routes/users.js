const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// @route   GET /api/users
// @desc    Alle Benutzer abrufen (nur für Admins)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Abrufen der Benutzer'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Einzelnen Benutzer abrufen
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Error getting user:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Abrufen des Benutzers'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Benutzer aktualisieren (Admin-Funktion)
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // Felder, die aktualisiert werden dürfen
    const { name, email, role, active } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Error updating user:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Aktualisieren des Benutzers'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Benutzer löschen
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }
    
    // Stelle sicher, dass Admins sich nicht selbst löschen können
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Du kannst deinen eigenen Account nicht löschen'
      });
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Löschen des Benutzers'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Eigenes Profil aktualisieren (für jeden Benutzer)
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = req.user;
    
    // Felder, die aktualisiert werden dürfen
    const { name, currentPassword, newPassword } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    
    // Wenn ein neues Passwort gesetzt werden soll, prüfe das aktuelle
    if (newPassword && currentPassword) {
      // Hole den Benutzer mit Passwort für den Vergleich
      const userWithPassword = await User.findById(user._id).select('+password');
      
      if (!userWithPassword) {
        return res.status(404).json({
          success: false,
          error: 'Benutzer nicht gefunden'
        });
      }
      
      // Prüfe, ob das aktuelle Passwort korrekt ist
      const isMatch = await userWithPassword.matchPassword(currentPassword);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Aktuelles Passwort ist falsch'
        });
      }
      
      // Setze das neue Passwort
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
    }
    
    // Benutzer aktualisieren
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Aktualisieren des Profils'
    });
  }
});

module.exports = router;