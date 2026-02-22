const mongoose = require('mongoose');

const disasterSessionSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId:  { type: String, required: true, unique: true },
  isActive:   { type: Boolean, default: true },
  latitude:   { type: Number },
  longitude:  { type: Number },
  address:    { type: String, default: '' },
  region:     { type: String, default: '' },
  activatedAt:{ type: Date, default: Date.now },
  lastPing:   { type: Date, default: Date.now },
});

disasterSessionSchema.index({ isActive: 1 });
disasterSessionSchema.index({ region: 1 });

module.exports = mongoose.model('DisasterSession', disasterSessionSchema);
