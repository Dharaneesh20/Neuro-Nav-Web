const mongoose = require('mongoose');

const musicTherapySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    spotifyTrackId: String,
    trackName: String,
    artistName: String,
    calmScoreBefore: Number,
    calmScoreAfter: Number,
    duration: Number, // in seconds
    effectiveness: {
      type: Number,
      min: 1,
      max: 5,
    },
    mood: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MusicTherapy', musicTherapySchema);
