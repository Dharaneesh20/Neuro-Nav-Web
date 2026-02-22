import React from 'react';
import { motion } from 'framer-motion';
import { FiHome, FiBarChart2, FiMap, FiSettings, FiLogOut, FiMenu, FiX, FiNavigation, FiMessageCircle, FiUsers, FiAlertTriangle } from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuthContext();

  const navItems = [
    { icon: FiHome, label: 'Home', href: '/dashboard' },
    { icon: FiNavigation, label: 'Plan Trip', href: '/plan-trip' },
    { icon: FiMessageCircle, label: 'Chat', href: '/chat' },
    { icon: FiBarChart2, label: 'Analytics', href: '/analytics' },
    { icon: FiUsers,         label: 'Community', href: '/community' },
    { icon: FiAlertTriangle, label: 'Disaster',  href: '/disaster'  },
    { icon: FiMap,           label: 'Map',       href: '/map' },
    { icon: FiSettings, label: 'Settings', href: '/settings' },
  ];

  const handleLogout = () => {
    logout();
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
        {/* Brand — always shows the "N" logo */}
        <motion.div
          className="navbar-brand"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="brand-icon"><span>N</span></div>
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
                <NavLink
                  to={item.href}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              </motion.div>
            );
          })}

          {/* User actions: avatar + logout */}
          <motion.div className="nav-user-actions" variants={itemVariants}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user?.name || 'Profile'}
                className="nav-avatar"
                referrerPolicy="no-referrer"
                title={user?.name || user?.email || 'Profile'}
              />
            ) : (
              <div className="nav-avatar nav-avatar-fallback">
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}

            <motion.button
              className="nav-logout btn btn-glass-outline btn-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
            >
              <FiLogOut size={16} />
              <span>Logout</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </nav>
  );
};

export default Navigation;
