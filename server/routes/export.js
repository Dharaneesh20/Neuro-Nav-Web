const express = require('express');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const CalmScore = require('../models/CalmScore');
const PanicEvent = require('../models/PanicEvent');
const Route = require('../models/Route');
const MusicTherapy = require('../models/MusicTherapy');
const HistoryEntry = require('../models/HistoryEntry');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const router = express.Router();

// Export sensory data as PDF
router.get('/pdf', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const user = await User.findById(req.userId);

    const query = { userId: req.userId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const calmScores = await CalmScore.find(query).sort({ timestamp: -1 });
    const panicEvents = await PanicEvent.find(query).sort({ timestamp: -1 });
    const routes = await Route.find(query).sort({ timestamp: -1 });
    const musicSessions = await MusicTherapy.find(query).sort({ timestamp: -1 });

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="neuronav-report.pdf"');

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('NeuroNav Sensory Data Report', { align: 'center' });
    doc.fontSize(12).text(`User: ${user.name}`, { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Summary
    doc.fontSize(14).text('Summary', { underline: true });
    doc.fontSize(11).text(`Total Calm Score Records: ${calmScores.length}`);
    doc.text(`Total Panic/Meltdown Events: ${panicEvents.length}`);
    doc.text(`Total Routes Planned: ${routes.length}`);
    doc.text(`Total Music Therapy Sessions: ${musicSessions.length}`);
    doc.moveDown();

    // Calm Scores
    if (calmScores.length > 0) {
      doc.fontSize(14).text('Recent Calm Scores', { underline: true });
      const avgScore = Math.round(
        calmScores.reduce((sum, cs) => sum + cs.calmScore, 0) / calmScores.length
      );
      doc.fontSize(11).text(`Average Calm Score: ${avgScore}/100`);
      doc.text(`Highest: ${Math.max(...calmScores.map((cs) => cs.calmScore))}/100`);
      doc.text(`Lowest: ${Math.min(...calmScores.map((cs) => cs.calmScore))}/100`);
      doc.moveDown();
    }

    // Panic Events
    if (panicEvents.length > 0) {
      doc.fontSize(14).text('Panic/Meltdown Events', { underline: true });
      const panicCount = panicEvents.filter((e) => e.severity === 'panic').length;
      const meltdownCount = panicEvents.filter((e) => e.severity === 'meltdown').length;
      doc.fontSize(11).text(`Total Panic Events: ${panicCount}`);
      doc.text(`Total Meltdown Events: ${meltdownCount}`);
      doc.moveDown();
    }

    // Music Therapy
    if (musicSessions.length > 0) {
      doc.fontSize(14).text('Music Therapy Effectiveness', { underline: true });
      const avgEffectiveness = Math.round(
        musicSessions.reduce((sum, m) => sum + (m.effectiveness || 0), 0) / musicSessions.length * 100
      ) / 100;
      doc.fontSize(11).text(`Average Effectiveness Rating: ${avgEffectiveness}/5`);
      doc.moveDown();
    }

    doc.fontSize(10).text('For more detailed analysis, please use the NeuroNav app dashboard.', {
      align: 'center',
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export sensory data as Excel
router.get('/excel', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const user = await User.findById(req.userId);

    const query = { userId: req.userId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const calmScores = await CalmScore.find(query).sort({ timestamp: -1 });
    const panicEvents = await PanicEvent.find(query).sort({ timestamp: -1 });
    const routes = await Route.find(query).sort({ timestamp: -1 });
    const musicSessions = await MusicTherapy.find(query).sort({ timestamp: -1 });

    const workbook = new ExcelJS.Workbook();

    // Calm Scores Sheet
    if (calmScores.length > 0) {
      const worksheet = workbook.addWorksheet('Calm Scores');
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Calm Score', key: 'calmScore', width: 12 },
        { header: 'Noise Level', key: 'noiseLevel', width: 12 },
        { header: 'Light Intensity', key: 'lightIntensity', width: 15 },
        { header: 'Crowding Level', key: 'crowdingLevel', width: 15 },
      ];

      calmScores.forEach((cs) => {
        worksheet.addRow({
          date: cs.timestamp.toLocaleDateString(),
          calmScore: cs.calmScore,
          noiseLevel: cs.noiseLevel,
          lightIntensity: cs.lightIntensity,
          crowdingLevel: cs.crowdingLevel,
        });
      });
    }

    // Panic Events Sheet
    if (panicEvents.length > 0) {
      const worksheet = workbook.addWorksheet('Panic Events');
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Severity', key: 'severity', width: 12 },
        { header: 'Duration (sec)', key: 'duration', width: 15 },
        { header: 'Location', key: 'address', width: 30 },
      ];

      panicEvents.forEach((pe) => {
        worksheet.addRow({
          date: pe.timestamp.toLocaleDateString(),
          severity: pe.severity,
          duration: pe.duration,
          address: pe.location?.address || 'Unknown',
        });
      });
    }

    // Routes Sheet
    if (routes.length > 0) {
      const worksheet = workbook.addWorksheet('Routes');
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Origin', key: 'origin', width: 20 },
        { header: 'Destination', key: 'destination', width: 20 },
        { header: 'Completed', key: 'completed', width: 12 },
        { header: 'Sensory Load', key: 'sensoryLoad', width: 15 },
      ];

      routes.forEach((r) => {
        worksheet.addRow({
          date: r.timestamp.toLocaleDateString(),
          origin: r.origin?.address || 'Unknown',
          destination: r.destination?.address || 'Unknown',
          completed: r.isCompleted ? 'Yes' : 'No',
          sensoryLoad: r.actualSensoryLoad || 'N/A',
        });
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="neuronav-report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get export statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { userId: req.userId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const calmScores = await CalmScore.find(query);
    const panicEvents = await PanicEvent.find(query);
    const routes = await Route.find(query);
    const musicSessions = await MusicTherapy.find(query);

    res.json({
      calmScoreCount: calmScores.length,
      panicEventCount: panicEvents.length,
      routeCount: routes.length,
      musicSessionCount: musicSessions.length,
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Today',
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
