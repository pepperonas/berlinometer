/**
 * Script to create a test supplier in the database
 * Run with: node server/scripts/create-test-supplier.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.server' });

// Database model
const Supplier = require('../models/Supplier');

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Direkte Verbindungs-URI mit Authentifizierung
    const mongoURI = process.env.MONGODB_URI || 'mongodb://mongoAdmin:%23QGwODkgI7fx@localhost:27017/bartender?authSource=admin';

    console.log('Connecting to MongoDB...');

    const options = {
      serverSelectionTimeoutMS: 30000, // Timeout auf 30 Sekunden erhöhen
      socketTimeoutMS: 60000,          // Socket-Timeout auf 60 Sekunden
      connectTimeoutMS: 45000,         // Verbindungs-Timeout auf 45 Sekunden
      maxPoolSize: 10,                 // Maximum Pool-Größe
      minPoolSize: 5                   // Minimum Pool-Größe
    };

    await mongoose.connect(mongoURI, options);
    console.log(`MongoDB Connected`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

// Create test supplier
const createTestSupplier = async () => {
  try {
    // Check if test supplier already exists
    const existingSupplier = await Supplier.findOne({ name: 'Test Lieferant' });
    
    if (existingSupplier) {
      console.log('Test supplier already exists with ID:', existingSupplier._id);
      return existingSupplier;
    }
    
    // Create new test supplier
    const testSupplier = new Supplier({
      name: 'Test Lieferant',
      contactPerson: 'Hans Müller',
      email: 'hans.mueller@testlieferant.de',
      phone: '030-12345678',
      address: {
        street: 'Teststraße 123',
        city: 'Berlin',
        postalCode: '10115',
        country: 'Deutschland'
      },
      website: 'https://www.testlieferant.de',
      categories: ['spirits', 'beer', 'wine'],
      active: true
    });
    
    const savedSupplier = await testSupplier.save();
    console.log('Test supplier created with ID:', savedSupplier._id);
    return savedSupplier;
  } catch (err) {
    console.error('Error creating test supplier:', err);
    throw err;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    const supplier = await createTestSupplier();
    console.log('Success! Supplier details:', supplier);
  } catch (err) {
    console.error('Script failed:', err);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
main();