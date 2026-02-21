import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlert, FiMapPin, FiPhone, FiX } from 'react-icons/fi';
import { panicEventAPI } from '../services/api';
import '../styles/components/PanicButton.css';

const PanicButton = ({ className }) => {
  const [isPanicActive, setIsPanicActive] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [panicType, setPanicType] = useState('panic');
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [triggers, setTriggers] = useState('');

  // Get user's current location
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.warn('Geolocation error:', error);
            resolve({ latitude: 0, longitude: 0 });
          }
        );
      } else {
        resolve({ latitude: 0, longitude: 0 });
      }
    });
  };

  // Get address from coordinates (reverse geocoding)
  const getAddress = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.address?.city || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handlePanicTrigger = async () => {
    setIsLoading(true);

    try {
      const loc = await getLocation();
      setLocation(loc);

      const address = await getAddress(loc.latitude, loc.longitude);

      // Trigger panic event
      const triggerList = triggers
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

      const response = await panicEventAPI.trigger({
        severity: panicType,
        coordinates: [loc.longitude, loc.latitude],
        address,
        triggers: triggerList,
      });

      setMessage(`${panicType.toUpperCase()}: Caregivers have been notified!`);
      setShowConfirmation(true);
      setIsPanicActive(true);

      // Auto-reset after 5 seconds
      setTimeout(() => {
        setShowConfirmation(false);
        setMessage('');
      }, 5000);
    } catch (error) {
      console.error('Panic trigger error:', error);
      setMessage(`Error: ${error.response?.data?.error || 'Failed to trigger alert'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsPanicActive(false);
    setShowConfirmation(false);
    setMessage('');
    setTriggers('');
  };

  return (
    <div className={`panic-button-container ${className || ''}`}>
      <AnimatePresence>
        {!isPanicActive ? (
          <motion.button
            key="panic-main"
            className="panic-button"
            onClick={() => setShowConfirmation(true)}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.8)',
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <FiAlert className="panic-icon" />
            <span className="panic-text">
              {showConfirmation ? 'Confirm Alert' : 'SOS Help'}
            </span>
            <motion.div
              className="panic-pulse"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
        ) : (
          <motion.div
            key="panic-active"
            className="panic-active-state"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="alert-icon-large">
              <FiAlert />
            </div>
            <h3>Alert Activated</h3>
            <p>Caregivers have been notified of your location</p>
            <button className="reset-btn" onClick={handleReset}>
              <FiX /> Clear Alert
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && !isPanicActive && (
          <motion.div
            className="panic-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              className="panic-modal"
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setShowConfirmation(false)}
              >
                <FiX />
              </button>

              <div className="modal-header">
                <FiAlert className="modal-icon" />
                <h2>Emergency Alert</h2>
              </div>

              <div className="modal-content">
                <p className="modal-description">
                  This will trigger an emergency alert and notify your caregivers immediately.
                </p>

                {/* Alert Type Selection */}
                <div className="alert-type-selector">
                  <label>
                    <input
                      type="radio"
                      name="panicType"
                      value="panic"
                      checked={panicType === 'panic'}
                      onChange={(e) => setPanicType(e.target.value)}
                    />
                    <span className="type-label panic-type">Panic Attack</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="panicType"
                      value="meltdown"
                      checked={panicType === 'meltdown'}
                      onChange={(e) => setPanicType(e.target.value)}
                    />
                    <span className="type-label meltdown-type">Sensory Meltdown</span>
                  </label>
                </div>

                {/* Triggers Input */}
                <div className="input-group">
                  <label htmlFor="triggers">What triggered this? (optional)</label>
                  <textarea
                    id="triggers"
                    placeholder="e.g., Loud noise, Bright lights, Crowded space"
                    value={triggers}
                    onChange={(e) => setTriggers(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Location Info */}
                <div className="location-info">
                  <FiMapPin className="info-icon" />
                  <span>Your location will be shared with caregivers</span>
                </div>

                {/* Action Buttons */}
                <div className="modal-actions">
                  <button
                    className="action-btn cancel-btn"
                    onClick={() => setShowConfirmation(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="action-btn confirm-btn"
                    onClick={handlePanicTrigger}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Alert'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            className="panic-message"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PanicButton;
