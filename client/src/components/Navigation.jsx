import React from 'react';
import { motion } from 'framer-motion';
import { FiHome, FiBarChart2, FiMap, FiSettings, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  const navItems = [
    { icon: FiHome, label: 'Home', href: '/dashboard' },
    { icon: FiBarChart2, label: 'Analytics', href: '/analytics' },
    { icon: FiMap, label: 'Map', href: '/map' },
    { icon: FiSettings, label: 'Settings', href: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <nav className="navbar">
      <motion.div
        className="navbar-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="navbar-brand"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="brand-icon">
            <span>N</span>
          </div>
          <span className="brand-text">NeuroNav</span>
        </motion.div>

        <button
          className="menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        <motion.div
          className={`navbar-nav ${isOpen ? 'open' : ''}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.label} variants={itemVariants}>
                <Link
                  to={item.href}
                  className="nav-link"
                  onClick={() => setIsOpen(false)}
                >
                  <motion.div
                    whileHover={{ scale: 1.05, color: '#6366f1' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}

          <motion.button
            className="nav-logout btn btn-outline btn-sm"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
          >
            <FiLogOut size={18} />
            <span>Logout</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </nav>
  );
};

export default Navigation;
