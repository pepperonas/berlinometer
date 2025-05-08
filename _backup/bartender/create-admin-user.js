/**
 * Admin-Benutzer-Erstellungsskript für die Bartender-App
 *
 * Dieses Skript erstellt einen Admin-Benutzer in der MongoDB,
 * falls noch kein Admin-Benutzer existiert.
 * 
 * Ausführen auf dem VPS mit: node create-admin-user.js
 */

// Umgebungsvariablen laden
require('dotenv').config();

// MongoDB und Benutzermodell importieren
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ANSI-Farben für bessere Lesbarkeit
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Admin-Benutzerdaten - HIER ANPASSEN FALLS NÖTIG
const adminUser = {
  name: 'Administrator',
  email: 'admin@bartender.de',
  password: 'admin1234',
  role: 'admin',
  active: true
};

// MongoDB-Verbindung herstellen
const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bartender';
  console.log(`${colors.yellow}Verbindung zur MongoDB herstellen: ${MONGODB_URI}${colors.reset}`);
  
  try {
    // Bei neueren Mongoose-Versionen sind die Optionen nicht mehr notwendig
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000 // 30 Sekunden Timeout für langsame Verbindungen
    });
    
    console.log(`${colors.green}MongoDB verbunden: ${conn.connection.host}${colors.reset}`);
    console.log(`${colors.blue}Datenbank: ${conn.connection.name}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Fehler bei der MongoDB-Verbindung: ${error.message}${colors.reset}`);
    process.exit(1);
  }
};

// Admin-Benutzer erstellen oder zurücksetzen
const createAdminUser = async () => {
  try {
    // Prüfen, ob User-Collection existiert
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    if (!collectionNames.includes('users')) {
      console.log(`${colors.cyan}Die Collection 'users' existiert noch nicht. Wird nun erstellt...${colors.reset}`);
      
      // Definiere User Schema, falls User-Modell nicht importiert werden kann
      const UserSchema = new mongoose.Schema({
        name: {
          type: String,
          required: [true, 'Bitte geben Sie einen Namen an'],
          trim: true,
          maxlength: [50, 'Name darf nicht länger als 50 Zeichen sein']
        },
        email: {
          type: String,
          required: [true, 'Bitte geben Sie eine E-Mail-Adresse an'],
          unique: true,
          match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Bitte geben Sie eine gültige E-Mail-Adresse an'
          ]
        },
        password: {
          type: String,
          required: [true, 'Bitte geben Sie ein Passwort an'],
          minlength: [6, 'Passwort muss mindestens 6 Zeichen lang sein'],
          select: false
        },
        role: {
          type: String,
          enum: ['user', 'admin', 'manager'],
          default: 'user'
        },
        active: {
          type: Boolean,
          default: false
        },
        avatar: {
          type: String
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        createdAt: {
          type: Date,
          default: Date.now
        },
        updatedAt: {
          type: Date,
          default: Date.now
        }
      });

      // Password Hashing
      UserSchema.pre('save', async function(next) {
        if (!this.isModified('password')) {
          next();
        }
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
      });
      
      // User Modell erstellen
      mongoose.model('User', UserSchema);
    }
    
    // Nach der Collection-Erstellung oder wenn sie bereits existiert
    // Versuche, das User-Modell zu laden
    let User;
    
    try {
      // Versuche, User Modell aus der App zu importieren
      User = require('./server/models/User');
      console.log(`${colors.green}User-Modell erfolgreich aus der App geladen.${colors.reset}`);
    } catch (error) {
      // Falls der Import fehlschlägt, verwende das Modell, das wir gerade definiert haben
      User = mongoose.model('User');
      console.log(`${colors.yellow}User-Modell aus Schema verwendet.${colors.reset}`);
    }

    // Überprüfen, ob bereits ein Admin-Benutzer existiert
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log(`${colors.blue}Ein Admin-Benutzer existiert bereits:${colors.reset}`);
      console.log(`- Name: ${existingAdmin.name}`);
      console.log(`- E-Mail: ${existingAdmin.email}`);
      console.log(`- Rolle: ${existingAdmin.role}`);
      console.log(`- Aktiv: ${existingAdmin.active ? 'Ja' : 'Nein'}`);
      
      // Frage, ob Passwort zurückgesetzt werden soll
      console.log(`\n${colors.yellow}Möchtest du das Passwort zurücksetzen? (j/n)${colors.reset}`);
      console.log(`${colors.cyan}Hinweis: Da dies ein Nicht-interaktives Skript ist, wird standardmäßig 'j' angenommen.${colors.reset}`);
      
      // Passwort zurücksetzen
      if (true) { // Immer ja in nicht-interaktivem Skript
        // Benutzer aktualisieren, Passwort wird durch pre-save Hook gehasht
        existingAdmin.password = adminUser.password;
        await existingAdmin.save();
        
        console.log(`${colors.green}Admin-Passwort erfolgreich zurückgesetzt!${colors.reset}`);
        console.log(`${colors.yellow}Neue Anmeldedaten:${colors.reset}`);
        console.log(`- E-Mail: ${existingAdmin.email}`);
        console.log(`- Passwort: ${adminUser.password}`);
      }
    } else {
      // Admin-Benutzer erstellen
      console.log(`${colors.cyan}Erstelle neuen Admin-Benutzer...${colors.reset}`);
      
      const newAdmin = new User(adminUser);
      await newAdmin.save();
      
      console.log(`${colors.green}Admin-Benutzer erfolgreich erstellt:${colors.reset}`);
      console.log(`- Name: ${newAdmin.name}`);
      console.log(`- E-Mail: ${newAdmin.email}`);
      console.log(`- Rolle: ${newAdmin.role}`);
      console.log(`- Aktiv: ${newAdmin.active ? 'Ja' : 'Nein'}`);
      console.log(`- Passwort: ${adminUser.password}`);
    }
    
    console.log(`\n${colors.magenta}Hinweis: Bitte ändere das Passwort nach der ersten Anmeldung!${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Fehler beim Erstellen des Admin-Benutzers: ${error.message}${colors.reset}`);
    console.error(error.stack);
    
    if (error.code === 11000) {
      console.error(`${colors.red}Ein Benutzer mit dieser E-Mail existiert bereits, ist aber kein Administrator.${colors.reset}`);
      console.log(`${colors.yellow}Lösung: Entferne den Benutzer aus der Datenbank oder ändere seine Rolle zu 'admin'.${colors.reset}`);
    }
  }
};

// Hauptfunktion
const main = async () => {
  console.log(`\n${colors.cyan}${colors.bright}==========================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}           BARTENDER ADMIN-BENUTZER ERSTELLEN            ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}==========================================================${colors.reset}\n`);
  
  // Verbindung zur MongoDB herstellen
  const connected = await connectDB();
  
  if (connected) {
    try {
      // Admin-Benutzer erstellen
      await createAdminUser();
      
      console.log(`\n${colors.green}Admin-Benutzer wurde erfolgreich erstellt oder aktualisiert.${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Allgemeiner Fehler: ${error.message}${colors.reset}`);
    } finally {
      // Verbindung trennen
      await mongoose.disconnect();
      console.log(`${colors.yellow}MongoDB-Verbindung getrennt.${colors.reset}`);
    }
  }
};

// Skript ausführen
main().catch(error => {
  console.error(`${colors.red}Unbehandelter Fehler: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});