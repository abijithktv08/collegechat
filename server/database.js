const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/college-chat';
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1); // Exit if database connection fails
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Error:', err);
});

module.exports = connectDatabase;