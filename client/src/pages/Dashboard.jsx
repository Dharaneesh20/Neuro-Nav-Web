import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiMapPin, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import Card from '../components/Card';
import '../styles/pages/Dashboard.css';

const Dashboard = () => {
  const [calmScores] = useState([
    { date: 'Today', score: 72, location: 'Coffee Shop' },
    { date: 'Yesterday', score: 65, location: 'Park' },
    { date: '2 days ago', score: 81, location: 'Home' },
  ]);

  const [stats] = useState([
    { label: 'Average Calm Score', value: '73', change: '+5%' },
    { label: 'Safe Spaces', value: '12', change: '+2' },
    { label: 'This Week', value: '24', change: 'recordings' },
  ]);

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
