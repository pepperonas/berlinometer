/**
 * MongoDB Datenbank-Erstellungsskript für Bartender
 * 
 * Dieses Skript erstellt die Bartender-Datenbank und alle benötigten Collections.
 * Ausführen mit: node create-mongodb-db.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
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

// Modell-Schemas laden
const User = require('./server/models/User');
const Drink = require('./server/models/Drink');
const Sale = require('./server/models/Sale');
const Inventory = require('./server/models/Inventory');
const Supplier = require('./server/models/Supplier');
const Staff = require('./server/models/Staff');

// Verbindung zur MongoDB herstellen
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bartender';
  console.log(`${colors.yellow}Verbindung zur MongoDB herstellen: ${MONGODB_URI}${colors.reset}`);
  
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000 // 30 Sekunden Timeout
    });
    
    console.log(`${colors.green}MongoDB verbunden: ${conn.connection.host}${colors.reset}`);
    console.log(`${colors.blue}Datenbank: ${conn.connection.name}${colors.reset}`);
    return conn;
  } catch (error) {
    console.error(`${colors.red}Fehler bei der MongoDB-Verbindung: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Verbindung zur MongoDB trennen
async function disconnectDB() {
  await mongoose.disconnect();
  console.log(`${colors.yellow}MongoDB-Verbindung getrennt.${colors.reset}`);
}

// Datenbank und Collections erstellen
async function createDatabase() {
  console.log(`${colors.cyan}${colors.bright}=== ERSTELLE BARTENDER DATENBANK UND COLLECTIONS ===${colors.reset}`);
  
  try {
    // Datenbank wird automatisch erstellt, wenn Sie eine Verbindung herstellen
    console.log(`${colors.blue}Bartender-Datenbank wurde erstellt/verwendet.${colors.reset}`);
    
    // Collections werden automatisch erstellt, wenn Sie Dokumente einfügen
    console.log(`${colors.yellow}Erstelle Collections...${colors.reset}`);
    
    // Admin-Benutzer erstellen
    console.log(`${colors.yellow}Erstelle Admin-Benutzer...${colors.reset}`);
    
    // Prüfen, ob bereits ein Admin existiert
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin1234', salt);
      
      const adminUser = new User({
        name: 'Administrator',
        email: 'admin@bartender.de',
        password: hashedPassword,
        role: 'admin',
        active: true
      });
      
      await adminUser.save();
      console.log(`${colors.green}Admin-Benutzer erstellt.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Admin-Benutzer existiert bereits.${colors.reset}`);
    }
    
    // Beispielgetränke erstellen
    console.log(`${colors.yellow}Erstelle Beispiel-Getränke...${colors.reset}`);
    
    // Prüfen, ob bereits Getränke existieren
    const drinkCount = await Drink.countDocuments();
    
    if (drinkCount === 0) {
      const sampleDrinks = [
        {
          name: 'Mojito',
          description: 'Erfrischender Cocktail mit Minze und Limette',
          price: 8.5,
          category: 'cocktails',
          ingredients: [
            { name: 'Rum', amount: '5cl' },
            { name: 'Limette', amount: '1 Stück' },
            { name: 'Minze', amount: '10 Blätter' },
            { name: 'Zucker', amount: '2 TL' },
            { name: 'Soda', amount: 'nach Bedarf' }
          ],
          alcohol: 16,
          stock: 50,
          popular: true
        },
        {
          name: 'Gin Tonic',
          description: 'Klassischer Cocktail mit Gin und Tonic Water',
          price: 7.5,
          category: 'cocktails',
          ingredients: [
            { name: 'Gin', amount: '4cl' },
            { name: 'Tonic Water', amount: '200ml' },
            { name: 'Limette', amount: '1 Stück' }
          ],
          alcohol: 12,
          stock: 100,
          popular: true
        },
        {
          name: 'Apfelsaft',
          description: 'Frischer Apfelsaft',
          price: 3.5,
          category: 'softDrinks',
          ingredients: [
            { name: 'Apfelsaft', amount: '200ml' }
          ],
          alcohol: 0,
          stock: 200,
          popular: false
        },
        {
          name: 'Pils vom Fass',
          description: 'Frisches Bier vom Fass',
          price: 4.2,
          category: 'beer',
          ingredients: [
            { name: 'Pils', amount: '500ml' }
          ],
          alcohol: 4.9,
          stock: 150,
          popular: true
        }
      ];
      
      await Drink.insertMany(sampleDrinks);
      console.log(`${colors.green}${sampleDrinks.length} Beispiel-Getränke erstellt.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Getränke existieren bereits (${drinkCount}).${colors.reset}`);
    }
    
    // Beispiel-Inventar erstellen
    console.log(`${colors.yellow}Erstelle Beispiel-Inventar...${colors.reset}`);
    
    // Prüfen, ob bereits Inventar existiert
    const inventoryCount = await Inventory.countDocuments();
    
    if (inventoryCount === 0) {
      const sampleInventory = [
        {
          name: 'Rum',
          category: 'spirit',
          unit: 'bottle',
          quantity: 15,
          minQuantity: 5,
          costPerUnit: 18.50,
          location: 'Bar Regal 1'
        },
        {
          name: 'Wodka',
          category: 'spirit',
          unit: 'bottle',
          quantity: 12,
          minQuantity: 4,
          costPerUnit: 15.75,
          location: 'Bar Regal 1'
        },
        {
          name: 'Pils',
          category: 'beer',
          unit: 'case',
          quantity: 8,
          minQuantity: 3,
          costPerUnit: 24.00,
          location: 'Kühllager'
        },
        {
          name: 'Cola',
          category: 'softDrinks',
          unit: 'bottle',
          quantity: 20,
          minQuantity: 10,
          costPerUnit: 1.20,
          location: 'Kühllager'
        },
        {
          name: 'Zitronen',
          category: 'fruit',
          unit: 'kg',
          quantity: 3,
          minQuantity: 2,
          costPerUnit: 3.50,
          location: 'Kühlschrank'
        }
      ];
      
      await Inventory.insertMany(sampleInventory);
      console.log(`${colors.green}${sampleInventory.length} Beispiel-Inventareinträge erstellt.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Inventar existiert bereits (${inventoryCount}).${colors.reset}`);
    }
    
    // Beispiel-Lieferanten erstellen
    console.log(`${colors.yellow}Erstelle Beispiel-Lieferanten...${colors.reset}`);
    
    // Prüfen, ob bereits Lieferanten existieren
    const supplierCount = await Supplier.countDocuments();
    
    if (supplierCount === 0) {
      const sampleSuppliers = [
        {
          name: 'Getränke Hoffmann',
          contactPerson: 'Thomas Schmidt',
          email: 'info@getraenke-hoffmann.de',
          phone: '030-12345678',
          address: {
            street: 'Hauptstraße 123',
            city: 'Berlin',
            postalCode: '10115',
            country: 'Deutschland'
          },
          categories: ['beer', 'wine', 'spirit'],
          paymentTerms: 'Zahlung innerhalb von 30 Tagen',
          notes: 'Lieferung immer dienstags und freitags',
          active: true
        },
        {
          name: 'Fresh Fruits AG',
          contactPerson: 'Maria Meyer',
          email: 'bestellung@freshfruits.de',
          phone: '040-87654321',
          address: {
            street: 'Obstweg 45',
            city: 'Hamburg',
            postalCode: '20095',
            country: 'Deutschland'
          },
          categories: ['fruit', 'mixer'],
          paymentTerms: 'Zahlung innerhalb von 14 Tagen',
          active: true
        }
      ];
      
      await Supplier.insertMany(sampleSuppliers);
      console.log(`${colors.green}${sampleSuppliers.length} Beispiel-Lieferanten erstellt.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Lieferanten existieren bereits (${supplierCount}).${colors.reset}`);
    }
    
    // Beispiel-Mitarbeiter erstellen
    console.log(`${colors.yellow}Erstelle Beispiel-Mitarbeiter...${colors.reset}`);
    
    // Prüfen, ob bereits Mitarbeiter existieren
    const staffCount = await Staff.countDocuments();
    
    if (staffCount === 0) {
      const sampleStaff = [
        {
          name: 'Max Mustermann',
          position: 'bartender',
          email: 'max@bartender.de',
          phone: '0171-12345678',
          dateOfBirth: new Date('1990-05-15'),
          hireDate: new Date('2022-03-01'),
          address: {
            street: 'Musterstraße 1',
            city: 'Berlin',
            postalCode: '10115',
            country: 'Deutschland'
          },
          hourlyRate: 15.00,
          active: true
        },
        {
          name: 'Julia Schmidt',
          position: 'manager',
          email: 'julia@bartender.de',
          phone: '0172-87654321',
          dateOfBirth: new Date('1985-08-20'),
          hireDate: new Date('2021-01-15'),
          address: {
            street: 'Hauptstraße 42',
            city: 'Berlin',
            postalCode: '10559',
            country: 'Deutschland'
          },
          hourlyRate: 18.50,
          active: true
        }
      ];
      
      await Staff.insertMany(sampleStaff);
      console.log(`${colors.green}${sampleStaff.length} Beispiel-Mitarbeiter erstellt.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Mitarbeiter existieren bereits (${staffCount}).${colors.reset}`);
    }
    
    // Beispiel-Verkäufe erstellen
    console.log(`${colors.yellow}Erstelle Beispiel-Verkäufe...${colors.reset}`);
    
    // Prüfen, ob bereits Verkäufe existieren
    const saleCount = await Sale.countDocuments();
    
    if (saleCount === 0) {
      // Getränke für Verkäufe abrufen
      const drinks = await Drink.find().limit(3);
      
      if (drinks.length > 0) {
        const today = new Date();
        const sampleSales = [];
        
        for (let i = 0; i < 5; i++) {
          const saleDate = new Date();
          saleDate.setDate(today.getDate() - i);
          
          const items = [];
          let total = 0;
          
          // Zufällige Auswahl von 1-3 Getränken für diesen Verkauf
          const numItems = Math.floor(Math.random() * 3) + 1;
          
          for (let j = 0; j < numItems; j++) {
            const drink = drinks[Math.floor(Math.random() * drinks.length)];
            const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 Stück
            
            items.push({
              drinkId: drink._id,
              name: drink.name,
              quantity: quantity,
              pricePerUnit: drink.price
            });
            
            total += quantity * drink.price;
          }
          
          // Zahlungsmethode zufällig auswählen
          const paymentMethods = ['cash', 'card', 'mobile'];
          const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
          
          sampleSales.push({
            date: saleDate,
            items: items,
            total: total,
            paymentMethod: paymentMethod
          });
        }
        
        await Sale.insertMany(sampleSales);
        console.log(`${colors.green}${sampleSales.length} Beispiel-Verkäufe erstellt.${colors.reset}`);
      } else {
        console.log(`${colors.yellow}Keine Getränke für Verkäufe vorhanden.${colors.reset}`);
      }
    } else {
      console.log(`${colors.yellow}Verkäufe existieren bereits (${saleCount}).${colors.reset}`);
    }
    
    console.log(`${colors.green}${colors.bright}Datenbankinitialisierung abgeschlossen.${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Fehler bei der Datenbankinitialisierung: ${error.message}${colors.reset}`);
    console.error(error.stack);
    return false;
  }
}

// Hauptfunktion
async function main() {
  console.log(`\n${colors.cyan}${colors.bright}==========================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}           BARTENDER DATENBANK INITIALISIERUNG           ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}==========================================================${colors.reset}\n`);
  
  // MongoDB-Verbindung herstellen
  const conn = await connectDB();
  
  try {
    // Datenbank und Collections erstellen
    await createDatabase();
    
    // Aktuelle Datenbankinformationen anzeigen
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`\n${colors.yellow}Collections in der Datenbank:${colors.reset}`);
    
    for (const collection of collections) {
      const count = await conn.connection.db.collection(collection.name).countDocuments();
      console.log(`- ${colors.bright}${collection.name}${colors.reset}: ${count} Dokumente`);
    }
    
    console.log(`\n${colors.green}${colors.bright}Bartender-Datenbank wurde erfolgreich initialisiert.${colors.reset}`);
    console.log(`${colors.yellow}Du kannst dich mit folgenden Zugangsdaten anmelden:${colors.reset}`);
    console.log(`${colors.yellow}E-Mail: admin@bartender.de${colors.reset}`);
    console.log(`${colors.yellow}Passwort: admin1234${colors.reset}`);
    console.log(`\n${colors.cyan}Bitte ändere das Passwort nach dem ersten Login!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Fehler: ${error.message}${colors.reset}`);
  } finally {
    // MongoDB-Verbindung trennen
    await disconnectDB();
  }
}

// Skript ausführen
main().catch(error => {
  console.error(`${colors.red}Unbehandelter Fehler: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});