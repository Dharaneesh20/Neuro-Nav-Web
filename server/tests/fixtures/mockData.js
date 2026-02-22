// Mock implementations for testing
const mockGeminiResponse = {
  calmScore: 75,
  stressors: ['moderate_noise', 'crowded'],
  recommendations: ['Take a break', 'Find quiet space']
};

const mockCalmScoreData = {
  _id: '123',
  userId: 'user123',
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
  recommendations: ['Take a break', 'Find quiet space'],
  timestamp: new Date()
};

const mockPanicEventData = {
  _id: 'panic123',
  userId: 'user123',
  severity: 'panic',
  location: {
    address: '123 Main St, New York, NY',
    coordinates: [-74.0060, 40.7128]
  },
  triggers: ['loud_noise', 'crowds'],
  musicPlayed: ['track_id_1', 'track_id_2'],
  caregiversNotified: [
    {
      method: 'email',
      caregiver: 'caregiver@example.com',
      timestamp: new Date(),
      delivered: true
    },
    {
      method: 'sms',
      caregiver: '+1234567890',
      timestamp: new Date(),
      delivered: true
    }
  ],
  resolutionNotes: 'Calmed down after 10 minutes in quiet space',
  timestamp: new Date()
};

const mockSafeHavenData = {
  _id: 'haven123',
  name: 'Central Library - Quiet Zone',
  type: 'library',
  location: {
    address: '456 Fifth Ave, New York, NY',
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
  amenities: ['WiFi', 'Restrooms', 'Water fountain', 'Comfortable seating'],
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
      userId: 'user456',
      rating: 5,
      comment: 'Great quiet space for studying',
      timestamp: new Date()
    }
  ],
  averageRating: 4.5,
  visitCount: 42,
  communityAdded: true,
  timestamp: new Date()
};

const mockUserData = {
  _id: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  autismLevel: 'moderate',
  sensoryPreferences: {
    noiseAvoidance: 70,
    lightAvoidance: 60,
    crowdAvoidance: 75,
    temperatureAvoidance: 40,
    odorAvoidance: 55
  },
  triggers: ['loud_noise', 'bright_lights', 'crowds'],
  profilePictureUrl: 'https://example.com/profile.jpg',
  caregiverContacts: [
    {
      name: 'Mom',
      phone: '+1234567891',
      email: 'mom@example.com',
      relationship: 'Mother',
      notificationPreference: ['email', 'sms']
    }
  ],
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockRoutePlanData = {
  _id: 'route123',
  userId: 'user123',
  origin: {
    address: '100 Main St, New York, NY',
    coordinates: [-74.0060, 40.7128]
  },
  destination: {
    address: '500 Fifth Ave, New York, NY',
    coordinates: [-73.9726, 40.7539]
  },
  routeOptions: [
    {
      polyline: 'encoded_polyline_1',
      duration: 25,
      distance: 1.2,
      sensoryLoadEstimate: 60,
      description: 'Main streets route'
    },
    {
      polyline: 'encoded_polyline_2',
      duration: 35,
      distance: 1.5,
      sensoryLoadEstimate: 40,
      description: 'Park route - quieter'
    }
  ],
  selectedRoute: 0,
  nearbyHavens: ['haven123', 'haven456'],
  isCompleted: false,
  actualSensoryLoad: null,
  feedback: null,
  timestamp: new Date()
};

const mockCommunityReportData = {
  _id: 'report123',
  userId: 'user789',
  type: 'sound-area',
  severity: 'moderate',
  location: {
    address: '200 Park Ave, New York, NY',
    coordinates: [-73.9800, 40.7500]
  },
  description: 'Busy intersection with lots of noise',
  upvotes: 23,
  downvotes: 2,
  userVotes: {
    'user123': 'upvote',
    'user456': 'upvote'
  },
  comments: [
    {
      userId: 'user456',
      text: 'I agree, very noisy here',
      timestamp: new Date()
    }
  ],
  status: 'verified',
  isArchived: false,
  timestamp: new Date()
};

module.exports = {
  mockGeminiResponse,
  mockCalmScoreData,
  mockPanicEventData,
  mockSafeHavenData,
  mockUserData,
  mockRoutePlanData,
  mockCommunityReportData
};
