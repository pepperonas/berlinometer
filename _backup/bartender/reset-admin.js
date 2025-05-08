  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');

  async function resetAdminPassword() {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect('mongodb://mongoAdmin:%23QGwODkgI7fx@localhost:27017/bartender?authSource=admin');

      console.log('Searching for admin user...');

      // Get the User model
      const User = mongoose.model('User', new mongoose.Schema({
        name: String,
        email: String,
        password: {
          type: String,
          select: false
        },
        role: String,
        active: Boolean
      }));

      // Find admin user
      const adminUser = await User.findOne({ email: 'admin@bartender.app' });

      if (!adminUser) {
        console.log('Admin user not found. Creating one...');

        // Generate salt
        const salt = await bcrypt.genSalt(10);
        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Create a new admin user
        const newAdmin = new User({
          name: 'Administrator',
          email: 'admin@bartender.app',
          password: hashedPassword,
          role: 'admin',
          active: true
        });

        await newAdmin.save();
        console.log('New admin user created with password: admin123');
      } else {
        console.log('Admin user found, resetting password...');

        // Generate salt
        const salt = await bcrypt.genSalt(10);
        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Update user
        adminUser.password = hashedPassword;
        adminUser.active = true;

        await adminUser.save();
        console.log('Admin password reset to: admin123');
        console.log('Admin account is now active');
      }

      await mongoose.connection.close();
      console.log('Connection closed');
    } catch (error) {
      console.error('Error:', error);
      if (mongoose.connection) {
        await mongoose.connection.close();
      }
    }
  }

  resetAdminPassword();
