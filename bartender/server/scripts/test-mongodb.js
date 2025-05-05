/**
 * MongoDB-Verbindungstest
 * Führt einen einfachen Verbindungstest durch und zeigt Informationen zu Sammlungen an
 */

const mongoose = require('mongoose');

// Connect to the MongoDB database
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
    process.exit(1); // Bei Fehlern beenden
  }
};

// Liste alle Sammlungen/Collections auf
const listCollections = async (db) => {
  try {
    const collections = await db.listCollections().toArray();
    console.log('\n=== Collections in database ===');
    if (collections.length === 0) {
      console.log('No collections found!');
    } else {
      collections.forEach((collection, index) => {
        console.log(`${index + 1}. ${collection.name}`);
      });
    }
    return collections;
  } catch (err) {
    console.error('Error listing collections:', err);
    return [];
  }
};

// Zeige Dokumente in Collection an
const showDocumentsInCollection = async (db, collectionName, limit = 3) => {
  try {
    const collection = db.collection(collectionName);
    const count = await collection.countDocuments();
    
    console.log(`\n=== Collection "${collectionName}" (${count} documents) ===`);
    
    if (count === 0) {
      console.log(`Collection "${collectionName}" is empty.`);
      return;
    }
    
    const documents = await collection.find().limit(limit).toArray();
    
    documents.forEach((doc, index) => {
      console.log(`\nDocument ${index + 1}:`);
      // Entferne _id für die Darstellung
      const { _id, ...rest } = doc;
      console.log('_id:', _id.toString());
      console.log('Data:', JSON.stringify(rest, null, 2));
    });
    
    if (count > limit) {
      console.log(`\n... and ${count - limit} more documents not shown.`);
    }
  } catch (err) {
    console.error(`Error showing documents in collection "${collectionName}":`, err);
  }
};

// Hauptfunktion
const main = async () => {
  let connection = null;
  
  try {
    // Verbinde mit MongoDB
    connection = await connectDB();
    const db = connection.connection.db;
    
    // Liste alle Collections auf
    const collections = await listCollections(db);
    
    // Zeige einige wichtige Sammlungen an
    const collectionsToCheck = ['users', 'drinks', 'inventory', 'suppliers', 'sales', 'staff'];
    
    for (const collectionName of collectionsToCheck) {
      if (collections.some(c => c.name === collectionName)) {
        await showDocumentsInCollection(db, collectionName);
      }
    }
    
    console.log('\nDatabase check completed successfully!');
  } catch (err) {
    console.error('Error in database check:', err);
  } finally {
    // Verbindung schließen
    if (connection) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
  }
};

// Führe das Hauptprogramm aus
main().catch(console.error);