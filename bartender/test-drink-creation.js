/**
 * Test-Skript zur Überprüfung der Getränke-Erstellung mit Mongoose
 * 
 * Führe dieses Skript mit Node.js aus, um zu testen, ob das Drink-Modell
 * korrekt funktioniert: node test-drink-creation.js
 */

// Mongoose und Dotenv für die Datenbankverbindung
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Umgebungsvariablen laden
dotenv.config();

// Drink-Modell importieren
const Drink = require('./server/models/Drink');

// MongoDB-Verbindungszeichenfolge
const db = process.env.MONGO_URI || 'mongodb://localhost:27017/bartender';

// Verbindung zur Datenbank herstellen
mongoose.connect(db)
  .then(() => console.log('MongoDB verbunden...'))
  .catch(err => {
    console.error('MongoDB Verbindungsfehler:', err.message);
    process.exit(1);
  });

// Testfunktion zur Erstellung eines Getränks
async function testDrinkCreation() {
  try {
    console.log('Teste die Erstellung eines Getränks...');
    
    // Ein Standard-Getränk für Tests
    const testDrink = {
      name: 'Test-Getränk ' + Date.now(), // Eindeutiger Name mit Timestamp
      description: 'Ein Testgetränk zur Überprüfung des Mongoose-Modells',
      price: 5.99,
      category: 'cocktails',
      ingredients: [
        { name: 'Zutat 1', amount: '50ml' },
        { name: 'Zutat 2', amount: '20ml' }
      ],
      alcohol: 12.5,
      stock: 10,
      popular: true
    };
    
    // Erstellen eines neuen Getränks mit dem Mongoose-Modell
    const newDrink = new Drink(testDrink);
    
    // Versuche, das Getränk zu speichern
    const savedDrink = await newDrink.save();
    
    console.log('Getränk erfolgreich erstellt:');
    console.log(JSON.stringify(savedDrink, null, 2));
    
    // Optional: Das erstellte Getränk wieder löschen
    await Drink.findByIdAndDelete(savedDrink._id);
    console.log(`Testgetränk (ID: ${savedDrink._id}) wurde gelöscht.`);
    
    return true;
  } catch (error) {
    console.error('Fehler bei der Getränke-Erstellung:');
    console.error(error);
    
    // Detaillierte Validierungsfehler anzeigen
    if (error.name === 'ValidationError') {
      Object.keys(error.errors).forEach(field => {
        console.error(`- ${field}: ${error.errors[field].message}`);
      });
    }
    
    return false;
  } finally {
    // Verbindung zur Datenbank schließen
    mongoose.disconnect();
    console.log('Datenbankverbindung geschlossen.');
  }
}

// Test ausführen
testDrinkCreation()
  .then(success => {
    if (success) {
      console.log('Test erfolgreich abgeschlossen. Das Drink-Modell funktioniert korrekt.');
    } else {
      console.log('Test fehlgeschlagen. Siehe Fehlerdetails oben.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Unerwarteter Fehler beim Testlauf:', err);
    process.exit(1);
  });