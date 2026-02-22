const express = require('express');
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const authenticate      = require('../middleware/auth');
const DisasterSession   = require('../models/DisasterSession');
const BroadcastMessage  = require('../models/BroadcastMessage');
const User              = require('../models/User');

const router = express.Router();

const HELPDESK_USER = 'disasterhelp';
const HELPDESK_PASS = 'disasterhelp';

/* ── Helpdesk auth middleware ─────────────────────────────── */
const helpdeskAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'helpdesk') return res.status(403).json({ error: 'Forbidden' });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid helpdesk token' });
  }
};

/* ══════════════════════════════════════════════════════════
   USER ENDPOINTS
   ══════════════════════════════════════════════════════════ */

// POST /api/disaster/activate
router.post('/activate', authenticate, async (req, res) => {
  try {
    const { latitude, longitude, address, region } = req.body;

    // Deactivate any previous session
    await DisasterSession.updateMany({ user: req.userId }, { isActive: false });

    const sessionId = crypto.randomBytes(16).toString('hex');
    const session = await DisasterSession.create({
      user:      req.userId,
      sessionId,
      latitude,
      longitude,
      address: address || '',
      region:  region  || '',
      isActive:    true,
      activatedAt: new Date(),
      lastPing:    new Date(),
    });

    res.json({
      sessionId: session.sessionId,
      trackUrl:  `/disaster/track/${session.sessionId}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to activate disaster mode' });
  }
});

// PATCH /api/disaster/location  — update live coords
router.patch('/location', authenticate, async (req, res) => {
  try {
    const { latitude, longitude, address, region } = req.body;
    const session = await DisasterSession.findOneAndUpdate(
      { user: req.userId, isActive: true },
      { latitude, longitude, address: address || '', region: region || '', lastPing: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'No active session' });
    res.json({ ok: true, lastPing: session.lastPing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// DELETE /api/disaster/deactivate
router.delete('/deactivate', authenticate, async (req, res) => {
  try {
    await DisasterSession.updateMany({ user: req.userId, isActive: true }, { isActive: false });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate' });
  }
});

// GET /api/disaster/session  — current user's active session
router.get('/session', authenticate, async (req, res) => {
  try {
    const session = await DisasterSession.findOne({ user: req.userId, isActive: true });
    res.json({ session: session || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// GET /api/disaster/track/:sessionId  — PUBLIC (no auth)
router.get('/track/:sessionId', async (req, res) => {
  try {
    const session = await DisasterSession.findOne({ sessionId: req.params.sessionId })
      .populate('user', 'name username');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({
      sessionId: session.sessionId,
      isActive:  session.isActive,
      latitude:  session.latitude,
      longitude: session.longitude,
      address:   session.address,
      region:    session.region,
      lastPing:  session.lastPing,
      userName:  session.user?.name || session.user?.username || 'Unknown',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get track' });
  }
});

// GET /api/disaster/broadcasts  — latest broadcasts for user
router.get('/broadcasts', authenticate, async (req, res) => {
  try {
    const msgs = await BroadcastMessage.find().sort({ createdAt: -1 }).limit(20);
    res.json({ broadcasts: msgs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get broadcasts' });
  }
});

/* ══════════════════════════════════════════════════════════
   HELPDESK ENDPOINTS
   ══════════════════════════════════════════════════════════ */

// POST /api/disaster/helpdesk/login
router.post('/helpdesk/login', (req, res) => {
  const { username, password } = req.body;
  if (username === HELPDESK_USER && password === HELPDESK_PASS) {
    const token = jwt.sign({ role: 'helpdesk' }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// GET /api/disaster/helpdesk/sessions  — all active sessions
router.get('/helpdesk/sessions', helpdeskAuth, async (req, res) => {
  try {
    const { region } = req.query;
    const query = { isActive: true };
    if (region) query.region = { $regex: region, $options: 'i' };

    // Consider stale if no ping in 3 minutes
    const cutoff = new Date(Date.now() - 3 * 60 * 1000);
    await DisasterSession.updateMany({ isActive: true, lastPing: { $lt: cutoff } }, { isActive: false });

    const sessions = await DisasterSession.find(query)
      .populate('user', 'name username email')
      .sort({ activatedAt: -1 });

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// GET /api/disaster/helpdesk/regions  — distinct active regions
router.get('/helpdesk/regions', helpdeskAuth, async (req, res) => {
  try {
    const regions = await DisasterSession.distinct('region', { isActive: true });
    res.json({ regions: regions.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get regions' });
  }
});

// POST /api/disaster/helpdesk/broadcast
router.post('/helpdesk/broadcast', helpdeskAuth, async (req, res) => {
  try {
    const { message, region } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
    const msg = await BroadcastMessage.create({
      message: message.trim(),
      region:  region || '',
      sentBy: 'helpdesk',
    });
    res.json({ ok: true, broadcast: msg });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// GET /api/disaster/helpdesk/broadcasts
router.get('/helpdesk/broadcasts', helpdeskAuth, async (req, res) => {
  try {
    const msgs = await BroadcastMessage.find().sort({ createdAt: -1 }).limit(50);
    res.json({ broadcasts: msgs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get broadcasts' });
  }
});

module.exports = router;
