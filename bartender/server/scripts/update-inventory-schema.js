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

// Main migration function
const migrateInventorySchema = async () => {
  try {
    const db = await connectDB();
    
    console.log('Starting inventory schema migration...');
    
    // Get the inventory collection directly (without using the model)
    const inventoryCollection = db.collection('inventories');
    
    // Find all inventory documents
    const documents = await inventoryCollection.find({}).toArray();
    console.log(`Found ${documents.length} inventory documents to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each document
    for (const doc of documents) {
      try {
        // Check if the document has 'lastOrdered' field
        if (doc.lastOrdered !== undefined) {
          // Copy the lastOrdered value to lastOrderDate
          const result = await inventoryCollection.updateOne(
            { _id: doc._id },
            { 
              $set: { 
                lastOrderDate: doc.lastOrdered,
                updatedAt: new Date()
              }
            }
          );
          
          if (result.modifiedCount > 0) {
            updatedCount++;
            console.log(`Updated document ${doc._id}: copied 'lastOrdered' to 'lastOrderDate'`);
          } else {
            skippedCount++;
            console.log(`No update needed for document ${doc._id}`);
          }
        } else {
          skippedCount++;
          console.log(`Skipped document ${doc._id}: 'lastOrdered' field not found`);
        }
      } catch (docError) {
        errorCount++;
        console.error(`Error processing document ${doc._id}:`, docError);
      }
    }
    
    // Log summary
    console.log('\nMigration Summary:');
    console.log(`Total documents processed: ${documents.length}`);
    console.log(`Documents updated: ${updatedCount}`);
    console.log(`Documents skipped: ${skippedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    
    console.log('\nInventory schema migration completed!');
  } catch (err) {
    console.error('Error in migration process:', err);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the migration
migrateInventorySchema().then(() => {
  console.log('Migration script execution finished');
  process.exit(0);
}).catch(err => {
  console.error('Unhandled error in migration script:', err);
  process.exit(1);
});