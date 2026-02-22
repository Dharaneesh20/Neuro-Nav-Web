const mongoose = require('mongoose');

const broadcastMessageSchema = new mongoose.Schema({
  message:   { type: String, required: true },
  region:    { type: String, default: '' },  // empty = all regions
  sentBy:    { type: String, default: 'helpdesk' },
  createdAt: { type: Date, default: Date.now },
});

broadcastMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BroadcastMessage', broadcastMessageSchema);
