const express = require('express');
const authMiddleware = require('../middleware/auth');
const MusicTherapy = require('../models/MusicTherapy');

const router = express.Router();

// Record music therapy session
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { spotifyTrackId, trackName, artistName, calmScoreBefore, calmScoreAfter, duration, effectiveness, mood } = req.body;

    const session = new MusicTherapy({
      userId: req.userId,
      spotifyTrackId,
      trackName,
      artistName,
      calmScoreBefore,
      calmScoreAfter,
      duration,
      effectiveness,
      mood,
    });

    await session.save();

    res.status(201).json({
      message: 'Music therapy session recorded',
      session,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's music therapy history
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const sessions = await MusicTherapy.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get music therapy statistics
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await MusicTherapy.find({
      userId: req.userId,
      timestamp: { $gte: startDate },
    });

    const avgEffectiveness =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.effectiveness || 0), 0) / sessions.length
        : 0;

    const totalCalm =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.calmScoreAfter - s.calmScoreBefore), 0) /
        sessions.length
        : 0;

    const topTracks = getTopTracks(sessions, 5);
    const topMoods = getTopMoods(sessions);

    res.json({
      totalSessions: sessions.length,
      averageEffectiveness: Math.round(avgEffectiveness * 100) / 100,
      averageCalmImprovement: Math.round(totalCalm),
      topTracks,
      topMoods,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recommendations based on mood
router.get('/recommendations/:mood', authMiddleware, async (req, res) => {
  try {
    const { mood } = req.params;

    const sessions = await MusicTherapy.find({
      userId: req.userId,
      mood,
    }).sort({ effectiveness: -1 }).limit(10);

    const recommendations = sessions.map((s) => ({
      spotifyTrackId: s.spotifyTrackId,
      trackName: s.trackName,
      artistName: s.artistName,
      effectiveness: s.effectiveness,
    }));

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getTopTracks(sessions, limit) {
  const trackMap = {};
  sessions.forEach((session) => {
    if (!trackMap[session.spotifyTrackId]) {
      trackMap[session.spotifyTrackId] = {
        trackName: session.trackName,
        artistName: session.artistName,
        count: 0,
        totalEffectiveness: 0,
      };
    }
    trackMap[session.spotifyTrackId].count += 1;
    trackMap[session.spotifyTrackId].totalEffectiveness += session.effectiveness || 0;
  });

  return Object.values(trackMap)
    .sort((a, b) => b.totalEffectiveness / b.count - a.totalEffectiveness / a.count)
    .slice(0, limit)
    .map((t) => ({
      ...t,
      avgEffectiveness: Math.round((t.totalEffectiveness / t.count) * 100) / 100,
    }));
}

function getTopMoods(sessions) {
  const moodMap = {};
  sessions.forEach((session) => {
    moodMap[session.mood] = (moodMap[session.mood] || 0) + 1;
  });

  return Object.entries(moodMap)
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => ({ mood, count }));
}

module.exports = router;
