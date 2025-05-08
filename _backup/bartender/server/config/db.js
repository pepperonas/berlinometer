const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Direkte Verbindungs-URI mit Authentifizierung
    const mongoURI = 'mongodb://mongoAdmin:%23QGwODkgI7fx@localhost:27017/bartender?authSource=admin';

    console.log('Attempting MongoDB connection with hardcoded URI');

    const options = {
      serverSelectionTimeoutMS: 30000, // Timeout auf 30 Sekunden erhöhen
      socketTimeoutMS: 60000,          // Socket-Timeout auf 60 Sekunden
      connectTimeoutMS: 45000,         // Verbindungs-Timeout auf 45 Sekunden
      maxPoolSize: 10,                 // Maximum Pool-Größe
      minPoolSize: 5                   // Minimum Pool-Größe
    };

    const conn = await mongoose.connect(mongoURI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Überprüfe, ob die Verbindung funktioniert
    const pingResult = await mongoose.connection.db.admin().ping();
    console.log('MongoDB ping successful:', pingResult);

    return conn;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    console.error('Full error stack:', err.stack);
    console.error('Full error object:', JSON.stringify(err, null, 2));
    process.exit(1); // Bei Fehlern beenden
  }
};

module.exports = connectDB;