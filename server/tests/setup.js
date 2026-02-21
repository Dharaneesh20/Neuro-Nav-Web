// Test setup and utilities
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Connect to MongoDB Memory Server for testing
 */
const connectDB = async () => {
  if (mongoServer) {
    return mongoServer.getUri();
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  return mongoUri;
};

/**
 * Disconnect from test database
 */
const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
};

/**
 * Clear all collections
 */
const clearDB = async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Create test user
 */
const createTestUser = async (User, overrides = {}) => {
  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword123',
    phone: '+1234567890',
    autismLevel: 'moderate',
    sensoryPreferences: {
      noiseAvoidance: 70,
      lightAvoidance: 60,
      crowdAvoidance: 75,
      temperatureAvoidance: 40,
      odorAvoidance: 55
    },
    ...overrides
  };

  const user = new User(userData);
  await user.save();
  return user;
};

/**
 * Create test calm score
 */
const createTestCalmScore = async (CalmScore, userId) => {
  const scoreData = {
    userId,
    noiseLevel: 60,
    lightIntensity: 70,
    crowdingLevel: 50,
    temperature: 22,
    odorLevel: 30,
    location: {
      type: 'Point',
      coordinates: [-74.0060, 40.7128]
    },
    calmScore: 75,
    stressors: ['moderate_noise', 'crowded'],
    recommendations: ['Take a break', 'Find quiet space']
  };

  const score = new CalmScore(scoreData);
  await score.save();
  return score;
};

module.exports = {
  connectDB,
  disconnectDB,
  clearDB,
  createTestUser,
  createTestCalmScore
};
