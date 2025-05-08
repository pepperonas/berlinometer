const mongoose = require('mongoose');

  async function diagnoseMongoDBConnection() {
    try {
      console.log('MongoDB Diagnose-Tool');
      const mongoURI = 'mongodb://mongoAdmin:%23QGwODkgI7fx@localhost:27017/bartender?authSource=admin';

      console.log('Attempting connection...');

      const options = {
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
      };

      const conn = await mongoose.connect(mongoURI, options);
      console.log(`Connected to MongoDB at ${conn.connection.host}`);

      console.log('Testing database admin commands...');
      const adminPing = await mongoose.connection.db.admin().ping();
      console.log('Admin ping result:', adminPing);

      console.log('Testing database operations...');

      // Erstelle User-Schema wie in der Anwendung
      const UserSchema = new mongoose.Schema({
        name: String,
        email: String,
        password: String,
        role: String,
        active: Boolean,
        createdAt: { type: Date, default: Date.now }
      });

      const DiagnoseUser = mongoose.model('User', UserSchema);

      // Überprüfe die Benutzer-Sammlung
      console.log('Checking users collection...');
      const users = await DiagnoseUser.find().limit(5);
      console.log(`Found ${users.length} users`);

      // Überprüfe mit findOne
      console.log('Testing findOne operation...');
      const user = await DiagnoseUser.findOne({ role: 'admin' });
      if (user) {
        console.log('Found admin user:', user.email);
      } else {
        console.log('No admin user found. Creating one...');

        // Erstelle Admin-Benutzer
        const adminUser = new DiagnoseUser({
          name: 'Administrator',
          email: 'admin@bartender.app',
          password: 'admin123',
          role: 'admin',
          active: true
        });

        const savedUser = await adminUser.save();
        console.log('Admin user created:', savedUser.email);
      }

      console.log('Database operations completed successfully');
      await mongoose.connection.close();
      console.log('Connection closed');

    } catch (error) {
      console.error('Error during diagnose:', error.message);
      console.error('Full error:', error);

      if (mongoose.connection) {
        await mongoose.connection.close();
        console.log('Connection closed due to error');
      }
    }
  }

  diagnoseMongoDBConnection();
