const mongoose = require('mongoose');

const historyEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'calm-score',
        'panic-event',
        'route-completed',
        'safe-haven-visit',
        'music-therapy',
        'report-created',
      ],
      required: true,
    },
    relatedId: mongoose.Schema.Types.ObjectId,
    calmScore: Number,
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

historyEntrySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('HistoryEntry', historyEntrySchema);
