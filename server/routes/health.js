/**
 * Health Check Routes
 * Provides system health status and diagnostic information
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * GET /api/health
 * Basic health check - returns 200 if server is running
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'NeuroNav server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/health/detailed
 * Detailed health check - includes database and external service status
 */
router.get('/detailed', async (req, res) => {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      server: { status: 'ok' },
      database: { status: 'unknown', latency: 0 },
      memory: { status: 'ok' },
      environment: { status: 'ok' }
    },
    responseTime: 0
  };

  try {
    // Check database connection
    const dbStartTime = Date.now();
    if (mongoose.connection.readyState === 1) {
      health.checks.database.status = 'connected';
      health.checks.database.latency = Date.now() - dbStartTime;
    } else {
      health.checks.database.status = 'disconnected';
      health.status = 'degraded';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    health.checks.memory = {
      status: memPercent > 90 ? 'warning' : 'ok',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      percent: Math.round(memPercent * 100) / 100
    };
    if (memPercent > 90) health.status = 'degraded';

    // Check environment
    const requiredEnvVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'GEMINI_API_KEY',
      'GOOGLE_MAPS_API_KEY'
    ];
    const missingEnvVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );
    if (missingEnvVars.length > 0) {
      health.checks.environment = {
        status: 'warning',
        missingVariables: missingEnvVars
      };
      health.status = 'degraded';
    }

    health.responseTime = Date.now() - startTime;
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    health.responseTime = Date.now() - startTime;
    res.status(503).json(health);
  }
});

/**
 * GET /api/health/ready
 * Readiness check - returns 200 if system is ready for traffic
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not_ready',
        message: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }

    // Check if required environment variables are set
    const requiredEnvVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'GEMINI_API_KEY'
    ];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      return res.status(503).json({
        status: 'not_ready',
        message: 'Missing environment variables',
        missingVariables: missingVars,
        timestamp: new Date().toISOString()
      });
    }

    // System is ready
    res.status(200).json({
      status: 'ready',
      message: 'NeuroNav is ready to receive traffic',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/alive
 * Liveness check - returns 200 if process is alive
 */
router.get('/alive', (req, res) => {
  res.status(200).json({
    status: 'alive',
    message: 'NeuroNav process is running',
    pid: process.pid,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * GET /api/health/metrics
 * Performance metrics - useful for monitoring and alerting
 */
router.get('/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  res.status(200).json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  });
});

module.exports = router;
