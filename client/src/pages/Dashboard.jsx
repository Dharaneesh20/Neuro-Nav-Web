import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiMapPin, FiAlertCircle, FiChevronRight, FiLoader } from 'react-icons/fi';
import Card from '../components/Card';
import { calmScoreAPI, panicEventAPI, userAPI } from '../services/api';
import '../styles/pages/Dashboard.css';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Average Calm Score', value: '—', change: '' },
    { label: 'Safe Spaces', value: '—', change: '' },
    { label: 'This Week', value: '—', change: 'recordings' },
  ]);
  const [calmScores, setCalmScores] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user profile
      const userRes = await userAPI.getProfile();
      setUser(userRes.data);

      // Fetch recent calm scores
      const scoresRes = await calmScoreAPI.getHistory(5, 0);
      const scores = scoresRes.data.map(score => ({
        date: new Date(score.timestamp).toLocaleDateString(),
        score: score.calmScore,
        location: score.environmentDescription || 'Unknown location'
      }));
      setCalmScores(scores);

      // Fetch calm score stats for this week
      const statsRes = await calmScoreAPI.getStats(7);
      setStats([
        { label: 'Average Calm Score', value: statsRes.data.average.toString(), change: '+5%' },
        { label: 'Safe Spaces', value: '12', change: '+2' },
        { label: 'This Week', value: statsRes.data.count.toString(), change: 'recordings' },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="dashboard">
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Welcome Back!</h1>
        <p>Here's your sensory wellness summary</p>
      </motion.div>

      <motion.div
        className="stats-overview"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <Card className="stat-card" hoverable gradient>
              <div className="stat-content">
                <h3>{stat.label}</h3>
                <div className="stat-main">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-change">{stat.change}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="dashboard-grid">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="dashboard-section"
        >
          <div className="section-header">
            <h2>Recent Recordings</h2>
            <a href="/record" className="link-btn">
              View All <FiChevronRight size={18} />
            </a>
          </div>

          <motion.div className="recording-list" variants={containerVariants}>
            {calmScores.map((item, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="recording-card" hoverable>
                  <div className="recording-content">
                    <div className="recording-info">
                      <h4>{item.date}</h4>
                      <p>{item.location}</p>
                    </div>
                    <div className="recording-score">
                      <div className={`score-badge score-${Math.floor(item.score / 20)}`}>
                        {item.score}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="dashboard-section"
        >
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>

          <div className="quick-actions">
            <motion.button
              className="action-btn primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiAlertCircle size={24} />
              <span>Record Now</span>
            </motion.button>

            <motion.button
              className="action-btn secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiMapPin size={24} />
              <span>View Map</span>
            </motion.button>

            <motion.button
              className="action-btn secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiTrendingUp size={24} />
              <span>Analytics</span>
            </motion.button>
          </div>

          <div className="section-header mt-4">
            <h2>Recommendations</h2>
          </div>

          <Card className="recommendation-card" gradient>
            <div className="recommendation-content">
              <h4>Today's Insight</h4>
              <p>
                Based on your recent recordings, high noise levels are your primary stressor. 
                Try using noise-cancelling headphones in busy environments.
              </p>
              <button className="btn btn-primary btn-sm mt-2">Learn More</button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
