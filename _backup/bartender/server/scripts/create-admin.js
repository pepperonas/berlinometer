/**
 * Skript zum Erstellen eines Admin-Benutzers
 * 
 * Verwendung: node -r dotenv/config server/scripts/create-admin.js dotenv_config_path=.env.server
 */

const mongoose = require('mongoose');
const User = require('../models/User');

// Verbindung zur Datenbank herstellen
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('MONGODB_URI ist nicht in den Umgebungsvariablen definiert.');
      process.exit(1);
    }
    
    console.log('Verbindungsaufbau zu MongoDB mit URI:', mongoURI);
    
    await mongoose.connect(mongoURI);
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
      mongoose.connection.close();
      return;
    }
    
    // Admin-Daten aus Umgebungsvariablen oder Standard-Werte
    const adminData = {
      name: process.env.ADMIN_NAME || 'Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@bartender.app',
      password: process.env.ADMIN_PASSWORD || 'admin123', // Sollte nach der ersten Anmeldung geändert werden!
      role: 'admin',
      active: true
    };
    
    console.log('Erstelle Admin-Benutzer mit E-Mail:', adminData.email);
    
    // Admin erstellen
    const admin = await User.create(adminData);
    
    console.log('Admin-Benutzer erfolgreich erstellt:');
    console.log('Email:', admin.email);
    console.log('WICHTIG: Bitte ändere das Passwort nach der ersten Anmeldung!');
    
  } catch (err) {
    console.error(`Fehler beim Erstellen des Admin-Benutzers: ${err.message}`);
  } finally {
    // Verbindung schließen
    mongoose.connection.close();
  }
};

// Skript ausführen
connectDB().then(() => {
  createAdmin();
});