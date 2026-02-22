const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/neuronav';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.warn('⚠️  MongoDB connection error:', error.message);
    console.warn('⚠️  Running in offline mode - database features unavailable');
    // Don't exit - allow app to run for testing health checks
    return false;
  }
};

module.exports = connectDB;
