const express = require('express');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, autismLevel, sensoryPreferences, triggers } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        name,
        phone,
        autismLevel,
        sensoryPreferences,
        triggers,
        updatedAt: Date.now(),
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user,
    });
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
