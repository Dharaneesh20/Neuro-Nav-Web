import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiFilter, FiPlus } from 'react-icons/fi';
import Card from '../components/Card';
import '../styles/pages/MapView.css';

const MapView = () => {
  const [safeSpaces] = useState([
    {
      id: 1,
      name: 'Central Library',
      location: 'Downtown',
      type: 'Library',
      rating: 4.8,
      visits: 12,
    },
    {
      id: 2,
      name: 'Green Park',
      location: 'Midtown',
      type: 'Park',
      rating: 4.5,
      visits: 8,
    },
    {
      id: 3,
      name: 'Quiet Café',
      location: 'Uptown',
      type: 'Café',
      rating: 4.9,
      visits: 15,
    },
  ]);

  const [filters, setFilters] = useState({
    type: 'all',
    minRating: 0,
  });

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
    <div className="map-view">
      <motion.div
        className="map-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-content">
          <h1>Safe Spaces Map</h1>
          <p>Discover sensory-friendly locations in your area</p>
        </div>
        <motion.button
          className="btn btn-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiPlus size={20} />
          Add Location
        </motion.button>
      </motion.div>

      <div className="map-container">
        <motion.div
          className="map-placeholder"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="map-bg">
            <FiMapPin size={80} opacity={0.3} />
            <p>Interactive map coming soon</p>
          </div>
        </motion.div>

        <motion.div
          className="spaces-sidebar"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="sidebar-header">
            <h2>Nearby Spaces</h2>
            <button className="filter-btn" title="Filter">
              <FiFilter size={20} />
            </button>
          </div>

          <motion.div
            className="spaces-list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {safeSpaces.map(space => (
              <motion.div key={space.id} variants={itemVariants}>
                <Card className="space-card" hoverable>
                  <div className="space-header">
                    <h3>{space.name}</h3>
                    <span className="space-badge">{space.type}</span>
                  </div>

                  <p className="space-location">
                    <FiMapPin size={16} />
                    {space.location}
                  </p>

                  <div className="space-stats">
                    <div className="stat">
                      <span className="label">Rating</span>
                      <span className="value">{space.rating}⭐</span>
                    </div>
                    <div className="stat">
                      <span className="label">Visits</span>
                      <span className="value">{space.visits}</span>
                    </div>
                  </div>

                  <motion.button
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', marginTop: '1rem' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Details
                  </motion.button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default MapView;
