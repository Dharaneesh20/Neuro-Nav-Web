const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    origin: {
      address: String,
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: [Number],
      },
    },
    destination: {
      address: String,
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: [Number],
      },
    },
    routes: [
      {
        title: String,
        distance: Number, // in meters
        duration: Number, // in seconds
        estimatedSensoryLoad: Number, // 0-100
        avoidedTriggers: [String],
        waypoints: [
          {
            location: String,
            coordinates: [Number],
            safeHavenNearby: mongoose.Schema.Types.ObjectId,
          },
        ],
        polyline: String, // encoded polyline
      },
    ],
    selectedRoute: Number, // index of selected route
    isCompleted: Boolean,
    actualSensoryLoad: Number,
    feedback: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

routeSchema.index({ 'origin.coordinates': '2dsphere' });
routeSchema.index({ 'destination.coordinates': '2dsphere' });

module.exports = mongoose.model('Route', routeSchema);
