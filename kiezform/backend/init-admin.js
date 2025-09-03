const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

async function initializeAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Remove all existing admins (for security)
    await Admin.deleteMany({});
    console.log('Removed all existing admin users');
    
    // Create new admin with secure password
    const username = 'admin';
    // WICHTIG: Ändere dieses Passwort vor dem Ausführen!
    const password = process.env.ADMIN_PASSWORD || 'Sundari-Colde1r-X';
    const email = 'martin.pfeffer@celox.io';
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const admin = new Admin({
      username,
      password: hashedPassword,
      email,
      role: 'admin'
    });
    
    await admin.save();
    console.log('✅ Admin user created successfully with new credentials');
    console.log(`Username: ${username}`);
    console.log('Password: [REDACTED]');
    console.log(`Email: ${email}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    process.exit(1);
  }
}

initializeAdmin();