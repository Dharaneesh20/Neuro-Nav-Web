const express = require('express');
const authMiddleware = require('../middleware/auth');
const { analyzeSensoryEnvironment } = require('../config/gemini');
const CalmScore = require('../models/CalmScore');
const HistoryEntry = require('../models/HistoryEntry');

const router = express.Router();

// Record calm score
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      noiseLevel,
      lightIntensity,
      crowdingLevel,
      temperature,
      odorLevel,
      environmentDescription,
      coordinates,
    } = req.body;

    // Analyze environment using Gemini Flash 2.5
    const analysisResult = await analyzeSensoryEnvironment({
      noiseLevel,
      lightIntensity,
      crowdingLevel,
      temperature,
      odorLevel,
      userTriggers: environmentDescription,
    });

    // Create calm score record
    const calmScore = new CalmScore({
      userId: req.userId,
      calmScore: analysisResult.calmScore,
      noiseLevel,
      lightIntensity,
      crowdingLevel,
      temperature,
      odorLevel,
      environmentDescription,
      stressors: analysisResult.stressors,
      recommendations: analysisResult.recommendations,
      location: {
        type: 'Point',
        coordinates: coordinates || [0, 0],
      },
    });

    await calmScore.save();

    // Create history entry
    const historyEntry = new HistoryEntry({
      userId: req.userId,
      type: 'calm-score',
      relatedId: calmScore._id,
      calmScore: analysisResult.calmScore,
      location: {
        type: 'Point',
        coordinates: coordinates || [0, 0],
      },
    });

    await historyEntry.save();

    res.status(201).json({
      message: 'Calm score recorded',
      calmScore,
      analysis: analysisResult,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's calm scores
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;
    const calmScores = await CalmScore.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(calmScores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get calm score statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const calmScores = await CalmScore.find({
      userId: req.userId,
      timestamp: { $gte: startDate },
    });

    const average =
      calmScores.length > 0
        ? calmScores.reduce((sum, cs) => sum + cs.calmScore, 0) /
          calmScores.length
        : 0;

    const max =
      calmScores.length > 0
        ? Math.max(...calmScores.map((cs) => cs.calmScore))
        : 0;

    const min =
      calmScores.length > 0
        ? Math.min(...calmScores.map((cs) => cs.calmScore))
        : 0;

    res.json({
      count: calmScores.length,
      average: Math.round(average),
      max,
      min,
      data: calmScores,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
