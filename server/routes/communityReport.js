const express = require('express');
const authMiddleware = require('../middleware/auth');
const CommunityReport = require('../models/CommunityReport');
const HistoryEntry = require('../models/HistoryEntry');

const router = express.Router();

// Create community report
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, reportType, location, severity, triggers, image } = req.body;

    const report = new CommunityReport({
      userId: req.userId,
      title,
      description,
      reportType,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address,
      },
      severity,
      triggers,
      image,
    });

    await report.save();

    // Create history entry
    const historyEntry = new HistoryEntry({
      userId: req.userId,
      type: 'report-created',
      relatedId: report._id,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address,
      },
      description: `Reported ${reportType}: ${title}`,
    });

    await historyEntry.save();

    res.status(201).json({
      message: 'Report created successfully',
      report,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reports with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { reportType, status, limit = 20, skip = 0 } = req.query;

    let query = { isArchived: false };
    if (reportType) query.reportType = reportType;
    if (status) query.status = status;

    const reports = await CommunityReport.find(query)
      .sort({ upvotes: -1, timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('userId', 'name');

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nearby reports (heat map)
router.get('/nearby', authMiddleware, async (req, res) => {
  try {
    const { longitude, latitude, distance = 5000 } = req.query;

    const reports = await CommunityReport.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(distance),
        },
      },
      isArchived: false,
    }).populate('userId', 'name');

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vote on report (upvote/downvote)
router.post('/:id/vote', authMiddleware, async (req, res) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'

    const report = await CommunityReport.findById(req.params.id);

    // Check if user already voted
    const existingVote = report.userVotes.find(
      (v) => v.userId.toString() === req.userId.toString()
    );

    if (existingVote) {
      // Remove previous vote
      if (existingVote.voteType === 'upvote') {
        report.upvotes -= 1;
      } else {
        report.downvotes -= 1;
      }
      report.userVotes = report.userVotes.filter(
        (v) => v.userId.toString() !== req.userId.toString()
      );
    }

    // Add new vote
    if (voteType === 'upvote') {
      report.upvotes += 1;
    } else {
      report.downvotes += 1;
    }

    report.userVotes.push({
      userId: req.userId,
      voteType,
    });

    await report.save();

    res.json({
      message: `${voteType} recorded`,
      upvotes: report.upvotes,
      downvotes: report.downvotes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to report
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    const report = await CommunityReport.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            userId: req.userId,
            text,
          },
        },
      },
      { new: true }
    ).populate('comments.userId', 'name');

    res.json({
      message: 'Comment added',
      report,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trending reports (by upvotes)
router.get('/trending', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const reports = await CommunityReport.find({ isArchived: false })
      .sort({ upvotes: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name');

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get report by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const report = await CommunityReport.findById(req.params.id)
      .populate('userId', 'name')
      .populate('comments.userId', 'name');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
