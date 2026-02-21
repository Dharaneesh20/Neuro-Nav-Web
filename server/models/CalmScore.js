const mongoose = require('mongoose');

const calmScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    calmScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    noiseLevel: Number,
    lightIntensity: Number,
    crowdingLevel: Number,
    temperature: Number,
    odorLevel: Number,
    environmentDescription: String,
    stressors: [String],
    recommendations: [String],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: [Number], // [longitude, latitude]
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create geospatial index
calmScoreSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('CalmScore', calmScoreSchema);
