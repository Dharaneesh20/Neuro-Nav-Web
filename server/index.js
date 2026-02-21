const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const calmScoreRoutes = require('./routes/calmScore');
const panicEventRoutes = require('./routes/panicEvent');
const routeRoutes = require('./routes/route');
const safeHavenRoutes = require('./routes/safeHaven');
const communityReportRoutes = require('./routes/communityReport');
const musicTherapyRoutes = require('./routes/musicTherapy');
const historyRoutes = require('./routes/history');
const exportRoutes = require('./routes/export');
const { securityMiddleware, apiLimiter } = require('./middleware/security');

const app = express();

// Connect to database
connectDB();

// Security Middleware
app.use(securityMiddleware);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(apiLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'NeuroNav API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/calm-scores', calmScoreRoutes);
app.use('/api/panic-events', panicEventRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/safe-havens', safeHavenRoutes);
app.use('/api/community-reports', communityReportRoutes);
app.use('/api/music-therapy', musicTherapyRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/export', exportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`NeuroNav server running on port ${PORT}`);
});

module.exports = app;
