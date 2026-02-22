import React from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiMapPin, FiTrendingUp, FiZap } from 'react-icons/fi';
import './HeroSection.css';

const HeroSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const floatingVariants = {
    initial: { y: 0 },
    animate: {
      y: [-20, 20, -20],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const features = [
    {
      icon: FiActivity,
      title: 'AI-Powered',
      desc: 'Smart sensory analysis',
    },
    {
      icon: FiMapPin,
      title: 'Location Aware',
      desc: 'Safe spaces mapping',
    },
    {
      icon: FiTrendingUp,
      title: 'Track Progress',
      desc: 'Monitor your journey',
    },
    {
      icon: FiZap,
      title: 'Real-time Insights',
      desc: 'Instant recommendations',
    },
  ];

  return (
    <section className="hero">
      <div className="hero-background">
        <motion.div
          className="gradient-blob blob-1"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
        <motion.div
          className="gradient-blob blob-2"
          animate={{
            rotate: -360,
            scale: [1, 0.9, 1],
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
            scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      </div>

      <motion.div
        className="hero-content container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 className="hero-title" variants={itemVariants}>
          Navigate Your Sensory World
        </motion.h1>

        <motion.p className="hero-subtitle" variants={itemVariants}>
          NeuroNav empowers autistic individuals to understand and manage their
          sensory environment with AI-powered insights and real-time support.
        </motion.p>

        <motion.div className="hero-buttons" variants={itemVariants}>
          <motion.button
            className="btn btn-primary btn-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
          </motion.button>

          <motion.button
            className="btn btn-outline btn-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Learn More
          </motion.button>
        </motion.div>

        <motion.div className="features-grid" variants={itemVariants}>
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                className="feature-card"
                whileHover={{ scale: 1.05, y: -5 }}
                variants={floatingVariants}
                initial="initial"
                animate="animate"
              >
                <div className="feature-icon">
                  <Icon size={28} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
