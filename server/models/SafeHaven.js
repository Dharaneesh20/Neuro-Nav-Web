const mongoose = require('mongoose');

const safeHavenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    type: {
      type: String,
      enum: ['quiet-zone', 'library', 'park', 'cafe', 'sensory-friendly-center', 'other'],
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: [Number], // [longitude, latitude]
      address: String,
      city: String,
      country: String,
    },
    amenities: [
      {
        name: String,
        availability: Boolean,
      },
    ],
    sensoryFeatures: {
      quietZone: Boolean,
      lowLighting: Boolean,
      isolatedArea: Boolean,
      calmEnvironment: Boolean,
      petFriendly: Boolean,
      accessibleToilets: Boolean,
      disabledAccess: Boolean,
    },
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    phone: String,
    website: String,
    email: String,
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    visitCount: {
      type: Number,
      default: 0,
    },
    isCommunityAdded: {
      type: Boolean,
      default: false,
    },
    addedBy: mongoose.Schema.Types.ObjectId,
    imageUrl: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

safeHavenSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SafeHaven', safeHavenSchema);
