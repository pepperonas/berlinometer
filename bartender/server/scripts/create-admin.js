/**
 * Skript zum Erstellen eines Admin-Benutzers
 * 
 * Verwendung: node server/scripts/create-admin.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Verbindung zur Datenbank herstellen
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {});
    console.log('MongoDB verbunden für Admin-Erstellung');
  } catch (err) {
    console.error(`Fehler bei der Verbindung zur MongoDB: ${err.message}`);
    process.exit(1);
  }
};

// Admin-Benutzer erstellen
const createAdmin = async () => {
  try {
    // Prüfen, ob bereits ein Admin existiert
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Admin-Benutzer existiert bereits:');
      console.log('Email:', adminExists.email);
      process.exit(0);
    }
    
    // Admin-Daten
    const adminData = {
      name: 'Administrator',
      email: 'admin@bartender.app',
      password: 'admin123', // Sollte nach der ersten Anmeldung geändert werden!
      role: 'admin',
      active: true
    };
    
    // Admin erstellen
    const admin = await User.create(adminData);
    
    console.log('Admin-Benutzer erfolgreich erstellt:');
    console.log('Email:', admin.email);
    console.log('Passwort: admin123');
    console.log('WICHTIG: Bitte ändere das Passwort nach der ersten Anmeldung!');
    
    process.exit(0);
  } catch (err) {
    console.error(`Fehler beim Erstellen des Admin-Benutzers: ${err.message}`);
    process.exit(1);
  }
};

// Skript ausführen
connectDB().then(() => {
  createAdmin();
});