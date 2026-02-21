import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';
import Card from '../components/Card';
import { calmScoreAPI } from '../services/api';
import '../styles/pages/RecordScore.css';

const RecordScore = () => {
  const [formData, setFormData] = useState({
    noiseLevel: 5,
    lightIntensity: 5,
    crowdingLevel: 5,
    temperature: 20,
    odorLevel: 5,
    description: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSliderChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDescriptionChange = (e) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await calmScoreAPI.record({
        noiseLevel: formData.noiseLevel,
        lightIntensity: formData.lightIntensity,
        crowdingLevel: formData.crowdingLevel,
        temperature: formData.temperature,
        odorLevel: formData.odorLevel,
        environmentDescription: formData.description,
        coordinates: [0, 0], // Can be updated with geolocation
      });

      setRecommendations({
        calmScore: response.data.analysis.calmScore,
        stressors: response.data.analysis.stressors,
        recommendations: response.data.analysis.recommendations,
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          noiseLevel: 5,
          lightIntensity: 5,
          crowdingLevel: 5,
          temperature: 20,
          odorLevel: 5,
          description: '',
        });
        setRecommendations(null);
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record calm score');
    } finally {
      setIsLoading(false);
    }
  };

  const sliders = [
    { label: 'Noise Level', field: 'noiseLevel', icon: '🔊' },
    { label: 'Light Intensity', field: 'lightIntensity', icon: '💡' },
    { label: 'Crowding Level', field: 'crowdingLevel', icon: '👥' },
    { label: 'Odor Level', field: 'odorLevel', icon: '👃' },
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

  if (submitted && recommendations) {
    return (
      <motion.div
        className="record-page success-state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="success-container"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          <div className="success-icon">
            <FiCheck size={60} />
          </div>
          <h2>Recording Saved!</h2>
          <p>Your sensory data has been analyzed and saved.</p>

          <Card className="result-card" gradient>
            <div className="result-content">
              <div className="calm-score-large">
                <span className="score">{recommendations.calmScore}</span>
                <span className="label">Calm Score</span>
              </div>

              <div className="stressors">
                <h4>Identified Stressors</h4>
                <ul>
                  {recommendations.stressors.map((stressor, idx) => (
                    <li key={idx}>{stressor}</li>
                  ))}
                </ul>
              </div>

              <div className="recommendations">
                <h4>Recommendations</h4>
                <ul>
                  {recommendations.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="record-page">
      <motion.div
        className="record-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Record Your Sensory Environment</h1>
        <p>Help us understand your current environment</p>
      </motion.div>

      <motion.div
        className="record-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="form-card">
            <div className="form-section">
              <h3>Current Sensory Levels</h3>
              <p className="section-desc">Rate each sensory factor on a scale of 1-10</p>

              <div className="sliders-container">
                {sliders.map(slider => (
                  <motion.div key={slider.field} className="slider-group" variants={itemVariants}>
                    <div className="slider-header">
                      <label>
                        <span className="icon">{slider.icon}</span>
                        <span>{slider.label}</span>
                      </label>
                      <span className="slider-value">{formData[slider.field]}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData[slider.field]}
                      onChange={(e) => handleSliderChange(slider.field, parseInt(e.target.value))}
                      className="slider"
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h3>Additional Context</h3>
              <p className="section-desc">Tell us more about your environment</p>
              <textarea
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Describe your current environment, triggers, or feelings..."
                className="textarea"
                rows="4"
              />
            </div>

            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FiAlertCircle />
                {error}
              </motion.div>
            )}

            <div className="form-actions">
              <motion.button
                className="btn btn-primary btn-lg"
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                <FiCheck size={20} />
                {isLoading ? 'Analyzing...' : 'Analyze & Save'}
              </motion.button>
              <motion.button
                className="btn btn-secondary btn-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="info-card glass" gradient>
            <div className="info-content">
              <h3>💡 Tips for Better Tracking</h3>
              <ul className="tips-list">
                <li>Be honest about your sensory experience</li>
                <li>Record immediately after experiencing the environment</li>
                <li>Note any specific triggers that affect you</li>
                <li>Track patterns over time to identify solutions</li>
              </ul>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RecordScore;
