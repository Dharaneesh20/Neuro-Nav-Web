/**
 * Database Seed Script
 * Populates MongoDB with sample data for development and testing
 * 
 * Usage: node seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Load models
const User = require('./models/User');
const CalmScore = require('./models/CalmScore');
const SafeHaven = require('./models/SafeHaven');
const CommunityReport = require('./models/CommunityReport');
const MusicTherapy = require('./models/MusicTherapy');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neuronav';

// Sample data
const sampleUsers = [
  {
    name: 'Alex Martinez',
    email: 'alex@example.com',
    password: 'hashed_password_1', // In real app, hash this
    phone: '+1234567890',
    autismLevel: 'moderate',
    sensoryPreferences: {
      noiseAvoidance: 75,
      lightAvoidance: 60,
      crowdAvoidance: 80,
      temperatureAvoidance: 45,
      odorAvoidance: 50
    },
    triggers: ['loud_noise', 'bright_lights', 'crowds'],
    caregiverContacts: [
      {
        name: 'Sarah Martinez',
        phone: '+1234567891',
        email: 'sarah@example.com',
        relationship: 'Mother',
        notificationPreference: ['email', 'sms']
      }
    ]
  },
  {
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    password: 'hashed_password_2',
    phone: '+1987654321',
    autismLevel: 'mild',
    sensoryPreferences: {
      noiseAvoidance: 50,
      lightAvoidance: 40,
      crowdAvoidance: 60,
      temperatureAvoidance: 30,
      odorAvoidance: 35
    },
    triggers: ['sudden_loud_sounds', 'flashing_lights'],
    caregiverContacts: [
      {
        name: 'Pat Lee',
        phone: '+1987654322',
        email: 'pat@example.com',
        relationship: 'Father',
        notificationPreference: ['sms']
      }
    ]
  }
];

const sampleSafeHavens = [
  {
    name: 'Central Library - Quiet Zone',
    type: 'library',
    location: {
      address: '456 Fifth Ave, New York, NY 10022',
      coordinates: [-73.9726, 40.7539]
    },
    sensoryFeatures: {
      quietZone: true,
      lowLighting: true,
      isolatedArea: false,
      calmEnvironment: true,
      petFriendly: false,
      accessibleToilets: true,
      disabledAccess: true
    },
    amenities: ['WiFi', 'Restrooms', 'Water fountain', 'Comfortable seating', 'Quiet reading rooms'],
    operatingHours: {
      Monday: { open: '09:00', close: '21:00' },
      Tuesday: { open: '09:00', close: '21:00' },
      Wednesday: { open: '09:00', close: '21:00' },
      Thursday: { open: '09:00', close: '21:00' },
      Friday: { open: '09:00', close: '21:00' },
      Saturday: { open: '10:00', close: '18:00' },
      Sunday: { open: '12:00', close: '18:00' }
    },
    reviews: [
      {
        userId: new mongoose.Types.ObjectId(),
        rating: 5,
        comment: 'Perfect quiet space for working and decompressing'
      }
    ],
    averageRating: 4.8,
    visitCount: 156,
    communityAdded: false
  },
  {
    name: 'Zen Park - Green Space',
    type: 'park',
    location: {
      address: 'Central Park West, New York, NY',
      coordinates: [-73.9731, 40.7829]
    },
    sensoryFeatures: {
      quietZone: true,
      lowLighting: false,
      isolatedArea: true,
      calmEnvironment: true,
      petFriendly: true,
      accessibleToilets: true,
      disabledAccess: true
    },
    amenities: ['Benches', 'Walking paths', 'Water features', 'Native plants', 'Restrooms'],
    operatingHours: {
      Monday: { open: '06:00', close: '23:59' },
      Tuesday: { open: '06:00', close: '23:59' },
      Wednesday: { open: '06:00', close: '23:59' },
      Thursday: { open: '06:00', close: '23:59' },
      Friday: { open: '06:00', close: '23:59' },
      Saturday: { open: '06:00', close: '23:59' },
      Sunday: { open: '06:00', close: '23:59' }
    },
    reviews: [
      {
        userId: new mongoose.Types.ObjectId(),
        rating: 4,
        comment: 'Peaceful natural environment, great for sensory breaks'
      }
    ],
    averageRating: 4.6,
    visitCount: 243,
    communityAdded: true
  },
  {
    name: 'Quiet Cafe - Autism-Friendly',
    type: 'cafe',
    location: {
      address: '123 Sensory Lane, New York, NY',
      coordinates: [-73.9500, 40.7400]
    },
    sensoryFeatures: {
      quietZone: true,
      lowLighting: true,
      isolatedArea: false,
      calmEnvironment: true,
      petFriendly: false,
      accessibleToilets: true,
      disabledAccess: true
    },
    amenities: ['Quiet corners', 'Noise-canceling available', 'Sensory-friendly menu', 'Clean facilities'],
    operatingHours: {
      Monday: { open: '08:00', close: '18:00' },
      Tuesday: { open: '08:00', close: '18:00' },
      Wednesday: { open: '08:00', close: '18:00' },
      Thursday: { open: '08:00', close: '18:00' },
      Friday: { open: '08:00', close: '19:00' },
      Saturday: { open: '09:00', close: '17:00' },
      Sunday: { open: '10:00', close: '16:00' }
    },
    reviews: [],
    averageRating: 4.9,
    visitCount: 89,
    communityAdded: true
  }
];

const sampleCommunityReports = [
  {
    userId: new mongoose.Types.ObjectId(),
    type: 'sound-area',
    severity: 'severe',
    location: {
      address: '42nd Street Times Square, New York, NY',
      coordinates: [-73.9855, 40.7580]
    },
    description: 'Very busy intersection with constant loud traffic, sirens, and construction noise. Not suitable for sensory-sensitive individuals.',
    upvotes: 47,
    downvotes: 2,
    status: 'verified',
    isArchived: false
  },
  {
    userId: new mongoose.Types.ObjectId(),
    type: 'positive-space',
    severity: 'mild',
    location: {
      address: 'Washington Square Park, New York, NY',
      coordinates: [-73.9965, 40.7314]
    },
    description: 'Great outdoor space with quiet corners and green areas. Good for calming sensory breaks.',
    upvotes: 23,
    downvotes: 1,
    status: 'verified',
    isArchived: false
  },
  {
    userId: new mongoose.Types.ObjectId(),
    type: 'sensory-trigger',
    severity: 'moderate',
    location: {
      address: '5th Avenue between 34th-42nd St, New York, NY',
      coordinates: [-73.9732, 40.7500]
    },
    description: 'Crowded shopping district with bright store lights and lots of stimulation. Can be overwhelming.',
    upvotes: 15,
    downvotes: 0,
    status: 'pending',
    isArchived: false
  }
];

/**
 * Connect to MongoDB
 */
async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
}

/**
 * Clear existing data
 */
async function clearDatabase() {
  try {
    await User.deleteMany({});
    await CalmScore.deleteMany({});
    await SafeHaven.deleteMany({});
    await CommunityReport.deleteMany({});
    await MusicTherapy.deleteMany({});
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  }
}

/**
 * Seed database with sample data
 */
async function seedDatabase() {
  try {
    // Create users
    const createdUsers = await User.create(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} sample users`);

    // Create safe havens
    const createdHavens = await SafeHaven.create(sampleSafeHavens);
    console.log(`✅ Created ${createdHavens.length} sample safe havens`);

    // Create community reports
    const createdReports = await CommunityReport.create(sampleCommunityReports);
    console.log(`✅ Created ${createdReports.length} sample community reports`);

    // Create sample calm scores for first user
    const calmScores = [
      {
        userId: createdUsers[0]._id,
        noiseLevel: 65,
        lightIntensity: 70,
        crowdingLevel: 50,
        temperature: 22,
        odorLevel: 30,
        location: {
          type: 'Point',
          coordinates: [-73.9726, 40.7539]
        },
        calmScore: 72,
        stressors: ['moderate_noise', 'crowded'],
        recommendations: ['Take a break', 'Find quiet space']
      },
      {
        userId: createdUsers[0]._id,
        noiseLevel: 45,
        lightIntensity: 50,
        crowdingLevel: 20,
        temperature: 21,
        odorLevel: 15,
        location: {
          type: 'Point',
          coordinates: [-73.9731, 40.7829]
        },
        calmScore: 85,
        stressors: [],
        recommendations: ['Great environment for relaxation']
      }
    ];

    const createdScores = await CalmScore.create(calmScores);
    console.log(`✅ Created ${createdScores.length} sample calm scores`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nSample user credentials:');
    createdUsers.forEach((user, index) => {
      console.log(`  User ${index + 1}: ${user.email}`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🌱 Starting database seed...\n');
  
  await connectDatabase();
  await clearDatabase();
  await seedDatabase();

  await mongoose.disconnect();
  console.log('\n✅ Database connection closed');
  process.exit(0);
}

// Run seed
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
