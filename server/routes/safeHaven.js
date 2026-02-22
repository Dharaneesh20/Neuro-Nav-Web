const express = require('express');
const authMiddleware = require('../middleware/auth');
const SafeHaven = require('../models/SafeHaven');

const router = express.Router();

// Create safe haven (community added)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, type, location, amenities, sensoryFeatures, operatingHours, phone, website, email, imageUrl } = req.body;

    const safeHaven = new SafeHaven({
      name,
      description,
      type,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address,
        city: location.city,
        country: location.country,
      },
      amenities,
      sensoryFeatures,
      operatingHours,
      phone,
      website,
      email,
      imageUrl,
      isCommunityAdded: true,
      addedBy: req.userId,
    });

    await safeHaven.save();

    res.status(201).json({
      message: 'Safe haven added',
      safeHaven,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nearby safe havens
router.get('/nearby', authMiddleware, async (req, res) => {
  try {
    const { longitude, latitude, distance = 5000 } = req.query; // distance in meters

    const safeHavens = await SafeHaven.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(distance),
        },
      },
    });

    res.json(safeHavens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all safe havens with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, city, limit = 50, skip = 0 } = req.query;

    let query = {};
    if (type) query.type = type;
    if (city) query['location.city'] = city;

    const safeHavens = await SafeHaven.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(safeHavens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single safe haven
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const safeHaven = await SafeHaven.findById(req.params.id);
    if (!safeHaven) {
      return res.status(404).json({ error: 'Safe haven not found' });
    }
    res.json(safeHaven);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add review to safe haven
router.post('/:id/review', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const safeHaven = await SafeHaven.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          reviews: {
            userId: req.userId,
            rating,
            comment,
          },
        },
      },
      { new: true }
    );

    // Recalculate average rating
    const totalRating = safeHaven.reviews.reduce((sum, r) => sum + r.rating, 0);
    safeHaven.averageRating = totalRating / safeHaven.reviews.length;
    safeHaven.totalReviews = safeHaven.reviews.length;

    await safeHaven.save();

    res.json({
      message: 'Review added',
      safeHaven,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record visit to safe haven
router.post('/:id/visit', authMiddleware, async (req, res) => {
  try {
    const safeHaven = await SafeHaven.findByIdAndUpdate(
      req.params.id,
      { $inc: { visitCount: 1 } },
      { new: true }
    );

    res.json({
      message: 'Visit recorded',
      safeHaven,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
