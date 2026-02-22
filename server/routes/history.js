const express = require('express');
const authMiddleware = require('../middleware/auth');
const HistoryEntry = require('../models/HistoryEntry');

const router = express.Router();

// Get user's history
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, limit = 50, skip = 0, days = 90 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let query = {
      userId: req.userId,
      timestamp: { $gte: startDate },
    };

    if (type) {
      query.type = type;
    }

    const history = await HistoryEntry.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get history summary/analytics
router.get('/analytics/summary', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await HistoryEntry.find({
      userId: req.userId,
      timestamp: { $gte: startDate },
    });

    const typeCounts = {};
    history.forEach((entry) => {
      typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1;
    });

    const calmScores = history.filter((h) => h.calmScore !== undefined);
    const avgCalmScore =
      calmScores.length > 0
        ? Math.round(
          calmScores.reduce((sum, h) => sum + h.calmScore, 0) / calmScores.length
        )
        : 0;

    res.json({
      totalActivities: history.length,
      typeBreakdown: typeCounts,
      averageCalmScore: avgCalmScore,
      period: `Last ${days} days`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get activity timeline
router.get('/timeline', authMiddleware, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const history = await HistoryEntry.find({
      userId: req.userId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: -1 });

    const timeline = {};
    history.forEach((entry) => {
      const date = entry.timestamp.toISOString().split('T')[0];
      if (!timeline[date]) {
        timeline[date] = [];
      }
      timeline[date].push({
        type: entry.type,
        description: entry.description,
        time: entry.timestamp.toISOString().split('T')[1],
        calmScore: entry.calmScore,
      });
    });

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete old history entries (older than specified days)
router.delete('/cleanup/:days', authMiddleware, async (req, res) => {
  try {
    const { days } = req.params;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await HistoryEntry.deleteMany({
      userId: req.userId,
      timestamp: { $lt: cutoffDate },
    });

    res.json({
      message: `Deleted ${result.deletedCount} old history entries`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
