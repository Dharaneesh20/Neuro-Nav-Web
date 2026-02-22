const mongoose = require('mongoose');

const panicEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    severity: {
      type: String,
      enum: ['panic', 'meltdown'],
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
    },
    caregiversNotified: [
      {
        contactId: mongoose.Schema.Types.ObjectId,
        notificationMethod: {
          type: String,
          enum: ['email', 'sms'],
        },
        sentAt: Date,
        delivered: Boolean,
      },
    ],
    musicPlayedIds: [String], // Spotify track IDs
    duration: Number, // in seconds
    triggers: [String],
    resolution: String,
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

panicEventSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('PanicEvent', panicEventSchema);
