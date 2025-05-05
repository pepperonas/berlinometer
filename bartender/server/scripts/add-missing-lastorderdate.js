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

// Main update function
const addMissingLastOrderDate = async () => {
  try {
    const db = await connectDB();
    
    console.log('Starting to add missing lastOrderDate field...');
    
    // Get the inventory collection directly
    const inventoryCollection = db.collection('inventories');
    
    // Find all inventory documents without lastOrderDate field
    const documents = await inventoryCollection.find({
      lastOrderDate: { $exists: false }
    }).toArray();
    
    console.log(`Found ${documents.length} inventory documents without lastOrderDate`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Add today's date to all documents missing lastOrderDate
    for (const doc of documents) {
      try {
        const result = await inventoryCollection.updateOne(
          { _id: doc._id },
          { 
            $set: { 
              lastOrderDate: new Date(),
              updatedAt: new Date()
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`Added lastOrderDate to document ${doc._id}`);
        } else {
          console.log(`Failed to update document ${doc._id}`);
        }
      } catch (docError) {
        errorCount++;
        console.error(`Error processing document ${doc._id}:`, docError);
      }
    }
    
    // Log summary
    console.log('\nUpdate Summary:');
    console.log(`Total documents without lastOrderDate: ${documents.length}`);
    console.log(`Documents updated: ${updatedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    
    console.log('\nUpdate operation completed!');
  } catch (err) {
    console.error('Error in update process:', err);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the update
addMissingLastOrderDate().then(() => {
  console.log('Update script execution finished');
  process.exit(0);
}).catch(err => {
  console.error('Unhandled error in update script:', err);
  process.exit(1);
});