const express = require('express');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile (name, phone, location, autismLevel, sensoryPreferences, triggers)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, location, autismLevel, sensoryPreferences, triggers } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, phone, location, autismLevel, sensoryPreferences, triggers, updatedAt: Date.now() },
      { new: true }
    ).select('-password');
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('settings');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.settings || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user settings (toggles + language)
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { notifications, emailAlerts, soundAlerts, dataSharing, darkMode, language } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { settings: { notifications, emailAlerts, soundAlerts, dataSharing, darkMode, language } } },
      { new: true }
    ).select('settings');
    res.json({ message: 'Settings saved', settings: user.settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // For Google-only accounts there may be no password
    if (user.password) {
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add caregiver contact
router.post('/caregivers', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, relationship } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $push: {
          caregiverContacts: { name, phone, email, relationship },
        },
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Caregiver contact added',
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update caregiver contact
router.put('/caregivers/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, relationship } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          'caregiverContacts.$[elem]': { name, phone, email, relationship },
        },
      },
      { arrayFilters: [{ 'elem._id': req.params.id }], new: true }
    ).select('-password');

    res.json({
      message: 'Caregiver contact updated',
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete caregiver contact
router.delete('/caregivers/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $pull: { caregiverContacts: { _id: req.params.id } },
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Caregiver contact removed',
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all caregivers for a user
router.get('/caregivers', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('caregiverContacts');
    res.json(user.caregiverContacts || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
