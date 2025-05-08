const User = require('./models/User'); 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Helper function to reset a user's password
async function resetPassword(username, newPassword) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mpsec');
    console.log('MongoDB connected');
    
    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found:', username);
      return;
    }
    
    // Set the new password and save (this will trigger the pre-save hook to hash the password)
    user.password = newPassword;
    await user.save();
    
    console.log('Password reset successful for user:', username);
    
    // Verify that we can authenticate with the new password
    const updatedUser = await User.findOne({ username }).select('+password');
    const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
    console.log('Password verification:', isMatch ? 'successful' : 'failed');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

// Reset password for martin to a known value
resetPassword('martin', 'password123');