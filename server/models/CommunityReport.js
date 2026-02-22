const mongoose = require('mongoose');

const communityReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reportType: {
      type: String,
      enum: ['sound-area', 'sensory-trigger', 'unsafe-zone', 'positive-space'],
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: [Number],
      address: String,
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'moderate',
    },
    triggers: [String],
    image: String,
    media: [
      {
        url: String,
        mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
      },
    ],
    authorName: String,
    authorAvatar: String,
    district: { type: String, default: '' },
    flagCount: { type: Number, default: 0 },
    flaggedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isHidden: { type: Boolean, default: false },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    userVotes: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        voteType: {
          type: String,
          enum: ['upvote', 'downvote'],
        },
      },
    ],
    comments: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        authorName:   { type: String, default: 'Anonymous' },
        authorAvatar: { type: String, default: '' },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'verified', 'resolved'],
      default: 'pending',
    },
    verificationCount: {
      type: Number,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

communityReportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('CommunityReport', communityReportSchema);
