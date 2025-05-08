const mongoose = require('mongoose');

  async function testConnection() {
    try {
      console.log('Connecting to MongoDB with Auth...');
      const mongoURI = 'mongodb://mongoAdmin:%23QGwODkgI7fx@localhost:27017/bartender?authSource=admin';

      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 15000,
      });

      console.log(`Connected to MongoDB at ${conn.connection.host}`);
      console.log('Creating test document...');

      // Erstelle ein einfaches Modell und einen Testdatensatz
      const TestSchema = new mongoose.Schema({
        name: String,
        date: { type: Date, default: Date.now }
      });

      const Test = mongoose.model('Test', TestSchema);

      // Erstelle einen Testdatensatz
      const testEntry = new Test({ name: 'Test Entry' });
      await testEntry.save();

      console.log('Test document created successfully!');
      console.log('Fetching test document...');

      // Suche den Testdatensatz
      const result = await Test.findOne({ name: 'Test Entry' });
      console.log('Found document:', result);

      // Bereinige die Testdaten
      await Test.deleteOne({ _id: result._id });
      console.log('Test document deleted.');

      // Schließe die Verbindung
      await mongoose.connection.close();
      console.log('Connection closed.');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error.message);
      console.error('Full error:', error);
    }
  }

  testConnection();
