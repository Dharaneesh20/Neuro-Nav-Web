const express = require('express');
const authMiddleware = require('../middleware/auth');
const PanicEvent = require('../models/PanicEvent');
const User = require('../models/User');
const { sendEmail } = require('../config/email');
const { sendSMS } = require('../config/sms');
const HistoryEntry = require('../models/HistoryEntry');

const router = express.Router();

// Trigger panic/meltdown button
router.post('/trigger', authMiddleware, async (req, res) => {
  try {
    const { severity, coordinates, address, triggers } = req.body;

    // Get user and caregiver contacts
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create panic event
    const panicEvent = new PanicEvent({
      userId: req.userId,
      severity,
      location: {
        type: 'Point',
        coordinates: coordinates || [0, 0],
        address,
      },
      triggers,
    });

    await panicEvent.save();

    // Notify caregivers
    const notificationPromises = user.caregiverContacts.map(async (contact) => {
      const locationLink = `https://maps.google.com/?q=${coordinates[1]},${coordinates[0]}`;

      let emailResult = false;
      let smsResult = false;

      // Send email notification
      if (contact.email) {
        const emailContent = `
          <h2>Alert: ${user.name} needs help!</h2>
          <p><strong>Status:</strong> ${severity.toUpperCase()}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Triggers:</strong> ${triggers.join(', ')}</p>
          <p><a href="${locationLink}">View Live Location</a></p>
          <p>Please check on ${user.name} immediately.</p>
        `;

        emailResult = await sendEmail(
          contact.email,
          `URGENT: ${user.name} needs help - ${severity}`,
          emailContent
        );
      }

      // Send SMS notification
      if (contact.phone) {
        const smsContent = `ALERT: ${user.name} is having a ${severity}. Location: ${locationLink}`;
        smsResult = await sendSMS(contact.phone, smsContent);
      }

      return {
        contactId: contact._id,
        emailSent: emailResult,
        smsSent: smsResult,
      };
    });

    const notificationResults = await Promise.all(notificationPromises);

    // Update panic event with notification results
    panicEvent.caregiversNotified = notificationResults.map((result) => ({
      contactId: result.contactId,
      notificationMethod: result.emailSent ? 'email' : 'sms',
      sentAt: new Date(),
      delivered: result.emailSent || result.smsSent,
    }));

    await panicEvent.save();

    // Create history entry
    const historyEntry = new HistoryEntry({
      userId: req.userId,
      type: 'panic-event',
      relatedId: panicEvent._id,
      location: {
        type: 'Point',
        coordinates: coordinates || [0, 0],
        address,
      },
      description: `${severity} triggered at ${address}`,
    });

    await historyEntry.save();

    res.status(201).json({
      message: 'Panic event recorded and caregivers notified',
      panicEvent,
      notifications: notificationResults,
    });
  } catch (error) {
    console.error('Panic event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's panic events
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const panicEvents = await PanicEvent.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(panicEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update panic event resolution
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { resolution, duration } = req.body;

    const panicEvent = await PanicEvent.findByIdAndUpdate(
      req.params.id,
      {
        resolution,
        duration,
      },
      { new: true }
    );

    res.json({
      message: 'Panic event updated',
      panicEvent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get panic statistics
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await PanicEvent.find({
      userId: req.userId,
      timestamp: { $gte: startDate },
    });

    const panicCount = events.filter((e) => e.severity === 'panic').length;
    const meltdownCount = events.filter((e) => e.severity === 'meltdown').length;

    const avgDuration =
      events.length > 0
        ? events.reduce((sum, e) => sum + (e.duration || 0), 0) / events.length
        : 0;

    res.json({
      totalEvents: events.length,
      panicCount,
      meltdownCount,
      averageDuration: Math.round(avgDuration),
      mostCommonTriggers: getMostCommonTriggers(events),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getMostCommonTriggers(events) {
  const triggerMap = {};
  events.forEach((event) => {
    event.triggers?.forEach((trigger) => {
      triggerMap[trigger] = (triggerMap[trigger] || 0) + 1;
    });
  });

  return Object.entries(triggerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([trigger, count]) => ({ trigger, count }));
}

module.exports = router;
