const express = require('express');
const authMiddleware = require('../middleware/auth');
const CommunityReport = require('../models/CommunityReport');
const HistoryEntry = require('../models/HistoryEntry');
const User = require('../models/User');

const router = express.Router();

// ── helper: check if user is banned ──────────────────────────
const checkBan = async (userId, res) => {
  const user = await User.findById(userId).select('bannedUntil');
  if (user?.bannedUntil && new Date(user.bannedUntil) > new Date()) {
    const until = new Date(user.bannedUntil).toLocaleDateString();
    res.status(403).json({ error: `Your account is suspended until ${until}.` });
    return true;
  }
  return false;
};

// Create community report
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (await checkBan(req.userId, res)) return;

    const {
      title, description, reportType, location,
      severity, triggers, image, media, district,
    } = req.body;

    const author = await User.findById(req.userId).select('name profilePicture googleAvatar');

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
      media: media || [],
      district: district || location.district || '',
      authorName:   author?.name   || 'Anonymous',
      authorAvatar: author?.googleAvatar || author?.profilePicture || '',
    });

    await report.save();

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

    res.status(201).json({ message: 'Report created successfully', report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reports with filters (reportType, status, district, nearby)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      reportType, status, district,
      latitude, longitude, radius,
      limit = 20, skip = 0,
    } = req.query;

    let query = { isArchived: false, isHidden: false };
    if (reportType) query.reportType = reportType;
    if (status)     query.status     = status;
    if (district)   query.district   = { $regex: district, $options: 'i' };

    // geo-box filter when coords supplied
    if (latitude && longitude) {
      const km = parseFloat(radius || 10);
      const deg = km / 111;
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      query['location.coordinates'] = {
        $geoWithin: {
          $box: [
            [lng - deg, lat - deg],
            [lng + deg, lat + deg],
          ],
        },
      };
    }

    const reports = await CommunityReport.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

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
    if (await checkBan(req.userId, res)) return;

    const { text } = req.body;
    const author = await User.findById(req.userId).select('name profilePicture googleAvatar');

    const report = await CommunityReport.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            userId:       req.userId,
            authorName:   author?.name || 'Anonymous',
            authorAvatar: author?.googleAvatar || author?.profilePicture || '',
            text,
          },
        },
      },
      { new: true }
    );

    res.json({ message: 'Comment added', comments: report.comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Flag post as NSFW / inappropriate
router.post('/:id/flag', authMiddleware, async (req, res) => {
  try {
    const report = await CommunityReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const alreadyFlagged = report.flaggedBy.some(
      id => id.toString() === req.userId.toString()
    );
    if (alreadyFlagged) return res.status(400).json({ error: 'Already flagged' });

    report.flaggedBy.push(req.userId);
    report.flagCount += 1;
    // Auto-hide at 5 flags
    if (report.flagCount >= 5) report.isHidden = true;
    await report.save();

    res.json({ message: 'Report flagged', flagCount: report.flagCount, isHidden: report.isHidden });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Moderate: ban the post author
router.post('/:id/moderate', authMiddleware, async (req, res) => {
  try {
    const { banDuration, reason } = req.body;
    // banDuration: '4d' | '2w' | 'permanent'
    const report = await CommunityReport.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const target = await User.findById(report.userId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    let bannedUntil = null;
    if      (banDuration === '4d')       bannedUntil = new Date(Date.now() + 4  * 24 * 3600_000);
    else if (banDuration === '2w')       bannedUntil = new Date(Date.now() + 14 * 24 * 3600_000);
    else if (banDuration === '1m')       bannedUntil = new Date(Date.now() + 30 * 24 * 3600_000);
    else if (banDuration === 'permanent') bannedUntil = new Date('2099-01-01');

    target.bannedUntil = bannedUntil;
    target.banHistory.push({
      reason:     reason || 'Community violation',
      bannedAt:   new Date(),
      bannedUntil,
      bannedBy:   req.userId,
    });
    await target.save();

    // also hide the offending report
    report.isHidden = true;
    await report.save();

    res.json({ message: 'User banned', bannedUntil });
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
