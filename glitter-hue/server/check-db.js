const mongoose = require('mongoose');
require('dotenv').config();

// EnergyData-Modell importieren
const EnergyData = require('./models/EnergyData');

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB verbunden...');

    // Suche alle Datensätze
    const data = await EnergyData.find();
    console.log(`${data.length} Datensätze gefunden.`);
    
    if (data.length > 0) {
      console.log('Erster Datensatz:');
      console.log(JSON.stringify(data[0], null, 2));
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('Fehler:', err);
  }
}

checkDatabase();
