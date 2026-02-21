import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiBarChart2, FiCalendar } from 'react-icons/fi';
import Card from '../components/Card';
import '../styles/pages/Analytics.css';

const Analytics = () => {
  const [timeRange, setTimeRange] = React.useState('week');

  const chartData = {
    week: [65, 72, 68, 75, 70, 78, 72],
    month: [68, 70, 72, 71, 75, 74, 76, 73, 77, 80, 78, 75],
  };

  const insights = [
    { label: 'Highest Score', value: '85', date: 'Mar 15' },
    { label: 'Lowest Score', value: '42', date: 'Mar 8' },
    { label: 'Average', value: '72', change: '+3% from last month' },
    { label: 'Consistency', value: '94%', change: 'Very Consistent' },
  ];

  const triggers = [
    { name: 'Noise', percentage: 45 },
    { name: 'Crowding', percentage: 35 },
    { name: 'Lighting', percentage: 15 },
    { name: 'Odors', percentage: 5 },
  ];

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

  const getChartBars = () => {
    const data = timeRange === 'week' ? chartData.week : chartData.month;
    const maxValue = Math.max(...data);
    return data.map(value => ({
      value,
      height: (value / maxValue) * 100,
    }));
  };

  return (
    <div className="analytics-page">
      <motion.div
        className="analytics-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Analytics & Insights</h1>
        <p>Track your sensory wellness journey</p>
      </motion.div>

      <motion.div
        className="time-selector"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <button
          className={`time-btn ${timeRange === 'week' ? 'active' : ''}`}
          onClick={() => setTimeRange('week')}
        >
          This Week
        </button>
        <button
          className={`time-btn ${timeRange === 'month' ? 'active' : ''}`}
          onClick={() => setTimeRange('month')}
        >
          This Month
        </button>
      </motion.div>

      <motion.div
        className="analytics-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Chart Section */}
        <motion.div variants={itemVariants} className="chart-section">
          <Card className="chart-card">
            <div className="card-header">
              <h2>Calm Score Trend</h2>
              <FiTrendingUp className="header-icon" size={24} />
            </div>

            <div className="chart-container">
              <div className="chart">
                {getChartBars().map((bar, idx) => (
                  <motion.div
                    key={idx}
                    className="bar-wrapper"
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    transition={{ delay: idx * 0.05, duration: 0.5 }}
                  >
                    <motion.div
                      className="bar"
                      initial={{ height: 0 }}
                      animate={{ height: `${bar.height}%` }}
                      transition={{ delay: idx * 0.05, duration: 0.5 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="value">{bar.value}</span>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="chart-legend">
              <span className="legend-item">
                <div className="legend-color primary"></div>
                Calm Score
              </span>
            </div>
          </Card>
        </motion.div>

        {/* Insights Cards */}
        <motion.div variants={itemVariants} className="insights-grid">
          {insights.map((insight, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="insight-card" gradient>
                <h3>{insight.label}</h3>
                <div className="insight-value">{insight.value}</div>
                {(insight.date || insight.change) && (
                  <p className="insight-meta">{insight.date || insight.change}</p>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Triggers Analysis */}
        <motion.div variants={itemVariants} className="triggers-section">
          <Card className="triggers-card">
            <h2>Top Stressors</h2>
            <div className="triggers-list">
              {triggers.map((trigger, idx) => (
                <motion.div
                  key={idx}
                  className="trigger-item"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="trigger-header">
                    <span className="trigger-name">{trigger.name}</span>
                    <span className="trigger-percent">{trigger.percentage}%</span>
                  </div>
                  <motion.div
                    className="trigger-bar"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                  >
                    <motion.div
                      className="trigger-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${trigger.percentage}%` }}
                      transition={{ delay: idx * 0.1 + 0.2, duration: 0.5 }}
                    />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recommendations */}
        <motion.div variants={itemVariants} className="recommendations-section">
          <Card className="recommendations-card glass">
            <h2>📊 Key Recommendations</h2>
            <ul className="recommendations-list">
              <li>Noise is your primary trigger - consider noise-cancelling solutions</li>
              <li>Your scores improve on weekends - take more breaks during weekdays</li>
              <li>Morning sessions (9-11am) show best results</li>
              <li>Morning sessions (9-11am) show best results</li>
            </ul>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Analytics;
