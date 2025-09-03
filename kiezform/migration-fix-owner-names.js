// Database migration to fix missing owner.name fields
// Run this script on the production VPS to update existing products

const mongoose = require('mongoose');

// Product schema (matching server.js)
const ProductSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  serialNumber: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  category: { type: String, required: true },
  imageUrl: String,
  manufacturingDate: { type: Date, default: Date.now },
  owner: {
    name: { type: String },
    email: { type: String },
    registrationDate: { type: Date }
  },
  metadata: {
    material: String,
    size: String,
    color: String,
    price: Number,
    notes: String,
    owner: String // Sometimes owner name is stored here
  },
  blockchainInfo: {
    currentOwner: String,
    mintBlock: String,
    lastBlock: String,
    transferCount: { type: Number, default: 0 }
  },
  isValid: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastVerified: Date
}, { collection: 'products' });

const Product = mongoose.model('Product', ProductSchema);

async function migrateOwnerNames() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://kiezform_user:KiezForm2024!SecureDB#MongoDB@localhost:27017/kiezform');
    console.log('Connected to MongoDB');

    // Find products without owner.name field
    const productsWithoutOwner = await Product.find({
      $or: [
        { 'owner.name': { $exists: false } },
        { 'owner.name': null },
        { 'owner.name': '' }
      ]
    });

    console.log(`Found ${productsWithoutOwner.length} products without owner.name`);

    for (const product of productsWithoutOwner) {
      let ownerName = 'Alexander König'; // Default owner

      // Try to get owner from metadata first
      if (product.metadata?.owner) {
        ownerName = product.metadata.owner;
      }

      // Update the product with owner structure
      product.owner = {
        name: ownerName,
        email: null,
        registrationDate: product.createdAt || new Date()
      };

      await product.save();
      console.log(`Updated product ${product.serialNumber}: ${product.productName} -> Owner: ${ownerName}`);
    }

    console.log('\n=== Migration completed successfully ===');
    console.log(`Updated ${productsWithoutOwner.length} products with owner data`);
    
    // Verify the fix
    const stillMissing = await Product.countDocuments({
      $or: [
        { 'owner.name': { $exists: false } },
        { 'owner.name': null },
        { 'owner.name': '' }
      ]
    });
    
    console.log(`Products still missing owner.name: ${stillMissing}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration
migrateOwnerNames();