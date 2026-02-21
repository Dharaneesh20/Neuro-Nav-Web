const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: String,
    dateOfBirth: Date,
    autismLevel: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'moderate',
    },
    sensoryPreferences: {
      noiseAvoidance: { type: Number, min: 0, max: 100, default: 50 },
      lightSensitivity: { type: Number, min: 0, max: 100, default: 50 },
      crowdAvoidance: { type: Number, min: 0, max: 100, default: 50 },
      temperatureSensitivity: { type: Number, min: 0, max: 100, default: 50 },
      odorSensitivity: { type: Number, min: 0, max: 100, default: 50 },
    },
    triggers: [String],
    caregiverContacts: [
      {
        name: String,
        phone: String,
        email: String,
        relationship: String,
      },
    ],
    profilePicture: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
