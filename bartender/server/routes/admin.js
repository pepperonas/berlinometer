const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

// Liste der erlaubten Skripte
const allowedScripts = [
  'seed-bar-data.js',
  'delete-bar-data.js',
  'reset-admin.js'
];

// Die Hilfsfunktionen werden nicht mehr benötigt, da wir die Funktionalität direkt implementiert haben

// @route   GET /api/admin/users
// @desc    Gibt eine Liste aller Benutzer zurück
// @access  Private/Admin
router.get('/users', protect, async (req, res) => {
  try {
    // Debug-Informationen
    console.log('Admin/users route accessed by:', req.user ? {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    } : 'No user in request');
    
    // Erweiterte Fehlerprüfung
    if (!req.user) {
      console.log('No user object in request');
      return res.status(401).json({
        success: false,
        error: 'Nicht autorisiert, Benutzerinformationen fehlen im Request'
      });
    }
    
    // Wir umgehen hier die Rollenprüfung und nutzen nur die E-Mail
    // Dies ist für den speziellen Fall, dass der Benutzer nicht die Admin-Rolle hat
    if (req.user.email !== 'martin.pfeffer@celox.io') {
      console.log(`User ${req.user.email} hat keine Berechtigung - role: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        error: `Keine Berechtigung zum Abrufen der Benutzerliste (${req.user.email})`
      });
    }
    
    // Direkt aus mongoose-Modell abrufen, falls möglich
    const User = require('../models/User');
    const users = await User.find().select('-password');
    
    console.log(`Benutzerabfrage erfolgreich - ${users.length} Benutzer gefunden`);
    
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('Fehler beim Abrufen der Benutzer:', err);
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Abrufen der Benutzer: ' + err.message
    });
  }
});

// @route   POST /api/admin/run-script
// @desc    Führt ein System-Skript aus
// @access  Private/Admin
router.post('/run-script', protect, async (req, res) => {
  try {
    const { script, email } = req.body;
    
    console.log('Run-Script-Anfrage:', { script, email, user: req.user.email });
    
    // Vergewissern, dass nur erlaubte Skripte ausgeführt werden können
    if (!allowedScripts.includes(script)) {
      return res.status(400).json({
        success: false,
        error: `Unerlaubtes Skript: ${script}`
      });
    }
    
    // Nur für Benutzer mit bestimmter E-Mail erlauben (Zusätzliche Sicherheitsmaßnahme)
    if (req.user.email !== 'martin.pfeffer@celox.io') {
      return res.status(403).json({
        success: false,
        error: `Keine Berechtigung zum Ausführen von Skripten (${req.user.email})`
      });
    }
    
    // Für Skripte, die eine E-Mail-Adresse benötigen, diese überprüfen
    if ((script === 'seed-bar-data.js' || script === 'delete-bar-data.js') && !email) {
      return res.status(400).json({
        success: false,
        error: 'Für dieses Skript wird eine E-Mail-Adresse benötigt'
      });
    }
    
    // Führen wir die Funktionalität direkt hier aus, anstatt ein externes Skript zu starten
    if (script === 'reset-admin.js') {
      // Implementierung der Admin-Zurücksetzung direkt hier
      try {
        console.log('Führe Admin-Zurücksetzung direkt aus...');
        
        // Admin-Benutzer suchen
        const User = require('../models/User');
        const adminUser = await User.findOne({ email: 'admin@bartender.app' });
        
        // Erfolgs-Output-String
        let output = '';
        
        if (!adminUser) {
          console.log('Admin-Benutzer nicht gefunden. Erstelle neuen Admin...');
          
          // Salt generieren
          const salt = await bcrypt.genSalt(10);
          // Passwort hashen
          const hashedPassword = await bcrypt.hash('admin123', salt);
          
          // Neuen Admin-Benutzer erstellen
          const newAdmin = new User({
            name: 'Administrator',
            email: 'admin@bartender.app',
            password: hashedPassword,
            role: 'admin',
            active: true
          });
          
          await newAdmin.save();
          output = 'Neuer Admin-Benutzer erstellt mit Passwort: admin123';
          console.log(output);
        } else {
          console.log('Admin-Benutzer gefunden, setze Passwort zurück...');
          
          // Salt generieren
          const salt = await bcrypt.genSalt(10);
          // Passwort hashen
          const hashedPassword = await bcrypt.hash('admin123', salt);
          
          // Benutzer aktualisieren
          adminUser.password = hashedPassword;
          adminUser.active = true;
          
          await adminUser.save();
          output = 'Admin-Passwort zurückgesetzt auf: admin123\nAdmin-Konto ist jetzt aktiv';
          console.log(output);
        }
        
        return res.status(200).json({
          success: true,
          output: output
        });
      } catch (error) {
        console.error('Fehler bei der Admin-Zurücksetzung:', error);
        return res.status(500).json({
          success: false,
          error: `Fehler bei der Admin-Zurücksetzung: ${error.message}`
        });
      }
    } else if (script === 'seed-bar-data.js') {
      // Implementierung der Bar-Daten-Erstellung
      try {
        console.log(`Führe Seed-Bar-Data für E-Mail ${email} direkt aus...`);
        
        // Basisklassen und -modelle laden
        const User = require('../models/User');
        const Bar = require('../models/Bar');
        const Drink = require('../models/Drink');
        const Staff = require('../models/Staff');
        const Supplier = require('../models/Supplier');
        const Inventory = require('../models/Inventory');
        const Sale = require('../models/Sale');
        const Expense = require('../models/Expense');
        const Income = require('../models/Income');
        
        // Benutzer mit der E-Mail-Adresse suchen
        const user = await User.findOne({ email }).populate('bar');
        
        if (!user) {
          return res.status(404).json({
            success: false,
            error: `Kein Benutzer mit der E-Mail-Adresse ${email} gefunden.`
          });
        }
        
        console.log(`Benutzer gefunden: ${user.name}`);
        
        // Prüfen, ob der Benutzer bereits eine Bar hat
        if (!user.bar) {
          return res.status(400).json({
            success: false,
            error: 'Dieser Benutzer hat keine zugewiesene Bar. Bitte erstelle zuerst eine Bar für diesen Benutzer.'
          });
        }
        
        console.log(`Bar gefunden: ${user.bar.name}`);
        
        // Referenz auf die Bar-ID
        const barId = user.bar._id;
        
        // Vorlagengetränke
        const drinks = [
          { name: 'Mojito', category: 'cocktails', price: 8.50, cost: 2.35, ingredients: [{ name: 'Rum' }, { name: 'Minze' }, { name: 'Limette' }, { name: 'Zucker' }, { name: 'Soda' }], isActive: true, stock: 0, popular: true, bar: barId },
          { name: 'Bier vom Fass', category: 'beer', price: 3.80, cost: 1.20, ingredients: [{ name: 'Bier' }], isActive: true, stock: 48, popular: true, bar: barId },
          { name: 'Hauswein Rot', category: 'wine', price: 4.50, cost: 1.80, ingredients: [{ name: 'Rotwein' }], isActive: true, stock: 24, popular: true, bar: barId },
          { name: 'Gin Tonic', category: 'cocktails', price: 7.50, cost: 2.10, ingredients: [{ name: 'Gin' }, { name: 'Tonic Water' }, { name: 'Limette' }], isActive: true, stock: 0, popular: true, bar: barId },
          { name: 'Cola', category: 'softDrinks', price: 2.80, cost: 0.60, ingredients: [{ name: 'Cola' }], isActive: true, stock: 120, popular: true, bar: barId },
          { name: 'Whiskey', category: 'spirits', price: 6.50, cost: 2.20, ingredients: [{ name: 'Whiskey' }], isActive: true, stock: 18, popular: false, bar: barId }
        ];
        
        // Personal-Vorlagen
        const staff = [
          { name: 'Max Mustermann', position: 'Barkeeper', role: 'bartender', hourlyRate: 15.50, hoursPerWeek: 30, startDate: '2021-05-15', phone: '+49 123 456789', email: 'max@example.com', isActive: true, bar: barId },
          { name: 'Lisa Schmidt', position: 'Managerin', role: 'manager', hourlyRate: 22.00, hoursPerWeek: 40, startDate: '2020-02-10', phone: '+49 123 456788', email: 'lisa@example.com', isActive: true, bar: barId }
        ];
        
        // Lieferanten-Vorlagen
        const suppliers = [
          { name: 'Getränke Schmidt', contactPerson: 'Michael Schmidt', phone: '+49 123 456789', email: 'info@getraenke-schmidt.de', address: { street: 'Industriestraße 12', city: 'Berlin', postalCode: '10115', country: 'Deutschland' }, notes: 'Liefert Dienstag und Freitag', categories: ['spirit', 'wine', 'beer'], bar: barId },
          { name: 'Brauerei Müller', contactPerson: 'Christina Müller', phone: '+49 123 456790', email: 'bestellung@brauerei-mueller.de', address: { street: 'Brauereiweg 5', city: 'Hamburg', postalCode: '20095', country: 'Deutschland' }, notes: 'Mindestbestellwert 200€', categories: ['beer'], bar: barId }
        ];
        
        // Erfolgs-Output
        let output = '';
        let successCount = 0;
        
        // Getränke erstellen
        try {
          const createdDrinks = await Drink.create(drinks);
          output += `✅ ${createdDrinks.length} Getränke erfolgreich erstellt\n`;
          successCount++;
        } catch (error) {
          output += `❌ Fehler beim Erstellen der Getränke: ${error.message}\n`;
        }
        
        // Personal erstellen
        try {
          const createdStaff = await Staff.create(staff);
          output += `✅ ${createdStaff.length} Mitarbeiter erfolgreich erstellt\n`;
          successCount++;
        } catch (error) {
          output += `❌ Fehler beim Erstellen des Personals: ${error.message}\n`;
        }
        
        // Lieferanten erstellen
        try {
          const createdSuppliers = await Supplier.create(suppliers);
          output += `✅ ${createdSuppliers.length} Lieferanten erfolgreich erstellt\n`;
          successCount++;
        } catch (error) {
          output += `❌ Fehler beim Erstellen der Lieferanten: ${error.message}\n`;
        }
        
        // Ergebnis senden
        if (successCount === 0) {
          output += '⛔ Keine Dummy-Daten wurden erstellt. Bitte überprüfe die Fehler und versuche es erneut.';
        } else {
          output += `✅ ${successCount} von 3 Datenkategorien wurden erfolgreich erstellt.`;
        }
        
        return res.status(200).json({
          success: true,
          output: output
        });
      } catch (error) {
        console.error('Fehler bei der Bar-Daten-Erstellung:', error);
        return res.status(500).json({
          success: false,
          error: `Fehler bei der Bar-Daten-Erstellung: ${error.message}`
        });
      }
    } else if (script === 'delete-bar-data.js') {
      // Implementierung der Bar-Daten-Löschung
      try {
        console.log(`Führe Delete-Bar-Data für E-Mail ${email} direkt aus...`);
        
        // Basisklassen und -modelle laden
        const User = require('../models/User');
        const Bar = require('../models/Bar');
        const Drink = require('../models/Drink');
        const Staff = require('../models/Staff');
        const Supplier = require('../models/Supplier');
        const Inventory = require('../models/Inventory');
        const Sale = require('../models/Sale');
        const Expense = require('../models/Expense');
        const Income = require('../models/Income');
        
        // Benutzer mit der E-Mail-Adresse suchen
        const user = await User.findOne({ email }).populate('bar');
        
        if (!user) {
          return res.status(404).json({
            success: false,
            error: `Kein Benutzer mit der E-Mail-Adresse ${email} gefunden.`
          });
        }
        
        console.log(`Benutzer gefunden: ${user.name}`);
        
        // Prüfen, ob der Benutzer eine Bar hat
        if (!user.bar) {
          return res.status(400).json({
            success: false,
            error: 'Dieser Benutzer hat keine zugewiesene Bar. Keine Daten zu löschen.'
          });
        }
        
        console.log(`Bar gefunden: ${user.bar.name}`);
        
        // Referenz auf die Bar-ID
        const barId = user.bar._id;
        
        // Erfolgs-Output und Zähler
        let output = '';
        let deletedCounts = {
          drinks: 0,
          staff: 0,
          suppliers: 0,
          inventory: 0,
          expenses: 0,
          income: 0,
          sales: 0
        };
        let successCount = 0;
        
        // Getränke löschen
        try {
          const result = await Drink.deleteMany({ bar: barId });
          deletedCounts.drinks = result.deletedCount;
          output += `✅ ${result.deletedCount} Getränke erfolgreich gelöscht\n`;
          successCount++;
        } catch (error) {
          output += `❌ Fehler beim Löschen der Getränke: ${error.message}\n`;
        }
        
        // Personal löschen
        try {
          const result = await Staff.deleteMany({ bar: barId });
          deletedCounts.staff = result.deletedCount;
          output += `✅ ${result.deletedCount} Mitarbeiter erfolgreich gelöscht\n`;
          successCount++;
        } catch (error) {
          output += `❌ Fehler beim Löschen des Personals: ${error.message}\n`;
        }
        
        // Lieferanten löschen
        try {
          const result = await Supplier.deleteMany({ bar: barId });
          deletedCounts.suppliers = result.deletedCount;
          output += `✅ ${result.deletedCount} Lieferanten erfolgreich gelöscht\n`;
          successCount++;
        } catch (error) {
          output += `❌ Fehler beim Löschen der Lieferanten: ${error.message}\n`;
        }
        
        // Inventar löschen
        try {
          const result = await Inventory.deleteMany({ bar: barId });
          deletedCounts.inventory = result.deletedCount;
          output += `✅ ${result.deletedCount} Inventareinträge erfolgreich gelöscht\n`;
          successCount++;
        } catch (error) {
          output += `❌ Fehler beim Löschen des Inventars: ${error.message}\n`;
        }
        
        // Ausgaben löschen
        try {
          const result = await Expense.deleteMany({ bar: barId });
          deletedCounts.expenses = result.deletedCount;
          output += `✅ ${result.deletedCount} Ausgaben erfolgreich gelöscht\n`;
          successCount++;
        } catch (error) {
          output += `❌ Fehler beim Löschen der Ausgaben: ${error.message}\n`;
        }
        
        // Einnahmen löschen
        try {
          const result = await Income.deleteMany({ bar: barId });
          deletedCounts.income = result.deletedCount;
          output += `✅ ${result.deletedCount} Einnahmen erfolgreich gelöscht\n`;
          successCount++;
        } catch (error) {
          output += `❌ Fehler beim Löschen der Einnahmen: ${error.message}\n`;
        }
        
        // Verkäufe löschen
        try {
          const result = await Sale.deleteMany({ bar: barId });
          deletedCounts.sales = result.deletedCount;
          output += `✅ ${result.deletedCount} Verkäufe erfolgreich gelöscht\n`;
          successCount++;
        } catch (error) {
          output += `❌ Fehler beim Löschen der Verkäufe: ${error.message}\n`;
        }
        
        // Gesamtzahl der gelöschten Einträge
        const totalDeleted = Object.values(deletedCounts).reduce((sum, val) => sum + val, 0);
        
        if (successCount === 0) {
          output += '⛔ Es wurden keine Daten gelöscht. Bitte überprüfe die Fehler und versuche es erneut.';
        } else if (successCount < 7) {
          output += `⚠️ Einige Daten wurden erfolgreich gelöscht (${successCount}/7 Kategorien)\n`;
        } else {
          output += `✅ Alle Daten wurden erfolgreich gelöscht!\n`;
        }
        
        output += `---------------------------\nInsgesamt ${totalDeleted} Einträge gelöscht`;
        
        return res.status(200).json({
          success: true,
          output: output
        });
      } catch (error) {
        console.error('Fehler bei der Bar-Daten-Löschung:', error);
        return res.status(500).json({
          success: false,
          error: `Fehler bei der Bar-Daten-Löschung: ${error.message}`
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: `Unbekanntes Skript: ${script}`
      });
    }
  } catch (err) {
    console.error('Fehler bei der Skriptausführung:', err);
    res.status(500).json({
      success: false,
      error: `Serverfehler bei der Skriptausführung: ${err.message}`
    });
  }
});

module.exports = router;