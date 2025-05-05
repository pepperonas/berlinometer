const mongoose = require('mongoose');

// Connect to the MongoDB database
const connectDB = async () => {
  try {
    // Use the same connection string as in server/config/db.js
    const mongoURI = 'mongodb://mongoAdmin:%23QGwODkgI7fx@localhost:27017/bartender?authSource=admin';
    
    console.log('Connecting to MongoDB...');
    
    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5
    };

    await mongoose.connect(mongoURI, options);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    
    return mongoose.connection;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    console.error('Error details:', err);
    process.exit(1);
  }
};

// Main check function
const checkInventoryFields = async () => {
  try {
    const db = await connectDB();
    
    console.log('Examining inventory documents...');
    
    // Get the inventory collection directly
    const inventoryCollection = db.collection('inventories');
    
    // Find all inventory documents
    const documents = await inventoryCollection.find({}).toArray();
    
    console.log(`Found ${documents.length} inventory documents in database`);
    
    // Exit if no documents found
    if (documents.length === 0) {
      console.log('No inventory documents to examine');
      return;
    }
    
    // Print all field names from the first document
    console.log('\nFields in first document:');
    const firstDoc = documents[0];
    console.log(Object.keys(firstDoc));
    
    // Check for lastOrderDate and lastOrdered
    let lastOrderDateCount = 0;
    let lastOrderedCount = 0;
    
    for (const doc of documents) {
      if (doc.lastOrderDate !== undefined) {
        lastOrderDateCount++;
      }
      if (doc.lastOrdered !== undefined) {
        lastOrderedCount++;
      }
      
      // Print individual document details
      console.log(`\nDocument ${doc._id}:`);
      console.log(`  Name: ${doc.name}`);
      console.log(`  lastOrderDate: ${doc.lastOrderDate || 'undefined'}`);
      console.log(`  lastOrdered: ${doc.lastOrdered || 'undefined'}`);
      console.log(`  supplier: ${doc.supplier || 'undefined'}`);
    }
    
    // Log summary
    console.log('\nSummary:');
    console.log(`Total documents: ${documents.length}`);
    console.log(`Documents with lastOrderDate: ${lastOrderDateCount}`);
    console.log(`Documents with lastOrdered: ${lastOrderedCount}`);
    
  } catch (err) {
    console.error('Error examining inventory fields:', err);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the check
checkInventoryFields().then(() => {
  console.log('Check script execution finished');
  process.exit(0);
}).catch(err => {
  console.error('Unhandled error in check script:', err);
  process.exit(1);
});