const express = require('express');
const authMiddleware = require('../middleware/auth');
const Route = require('../models/Route');
const HistoryEntry = require('../models/HistoryEntry');

const router = express.Router();

// Create new route plan
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      origin,
      destination,
      routes,
    } = req.body;

    const routePlan = new Route({
      userId: req.userId,
      origin,
      destination,
      routes,
    });

    await routePlan.save();

    res.status(201).json({
      message: 'Route plan created',
      route: routePlan,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's routes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, skip = 0, completed } = req.query;

    let query = { userId: req.userId };
    if (completed !== undefined) {
      query.isCompleted = completed === 'true';
    }

    const routes = await Route.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete route and record feedback
router.put('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { actualSensoryLoad, feedback } = req.body;

    const routePlan = await Route.findByIdAndUpdate(
      req.params.id,
      {
        isCompleted: true,
        actualSensoryLoad,
        feedback,
      },
      { new: true }
    );

    // Create history entry
    const historyEntry = new HistoryEntry({
      userId: req.userId,
      type: 'route-completed',
      relatedId: routePlan._id,
      description: `Completed route from ${routePlan.origin.address} to ${routePlan.destination.address}`,
      metadata: {
        actualSensoryLoad,
        plannedLoad: routePlan.routes[routePlan.selectedRoute]?.estimatedSensoryLoad,
      },
    });

    await historyEntry.save();

    res.json({
      message: 'Route completed',
      route: routePlan,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Select best route option
router.put('/:id/select-route', authMiddleware, async (req, res) => {
  try {
    const { routeIndex } = req.body;

    const routePlan = await Route.findByIdAndUpdate(
      req.params.id,
      { selectedRoute: routeIndex },
      { new: true }
    );

    res.json({
      message: 'Route selected',
      route: routePlan,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get route analytics
router.get('/analytics/summary', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const routes = await Route.find({
      userId: req.userId,
      timestamp: { $gte: startDate },
    });

    const completedRoutes = routes.filter((r) => r.isCompleted);

    const avgPlannedLoad =
      routes.length > 0
        ? routes.reduce(
          (sum, r) =>
            sum +
            (r.routes[r.selectedRoute || 0]?.estimatedSensoryLoad || 0),
          0
        ) / routes.length
        : 0;

    const avgActualLoad =
      completedRoutes.length > 0
        ? completedRoutes.reduce((sum, r) => sum + (r.actualSensoryLoad || 0), 0) /
        completedRoutes.length
        : 0;

    res.json({
      totalRoutes: routes.length,
      completedRoutes: completedRoutes.length,
      averagePlannedLoad: Math.round(avgPlannedLoad),
      averageActualLoad: Math.round(avgActualLoad),
      sensoryImprovement: Math.round(avgPlannedLoad - avgActualLoad),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
