import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

const Card = ({
  children,
  className = '',
  hoverable = true,
  gradient = false,
  ...props
}) => {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const hoverVariants = hoverable
    ? {
        hover: { scale: 1.02, y: -5 },
      }
    : {};

  return (
    <motion.div
      className={`modern-card ${gradient ? 'gradient' : ''} ${className}`}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      whileHover={hoverable ? 'hover' : {}}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      {...hoverVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
