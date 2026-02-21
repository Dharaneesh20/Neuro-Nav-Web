import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiToggleLeft, FiToggleRight, FiBell, FiLock, FiUser, FiChevronRight, FiSave, FiAlertCircle } from 'react-icons/fi';
import Card from '../components/Card';
import { userAPI } from '../services/api';
import '../styles/pages/Settings.css';

const Settings = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    autismLevel: 'moderate',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    soundAlerts: true,
    darkMode: false,
    dataSharing: true,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setProfile({
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone || '',
        autismLevel: response.data.autismLevel || 'moderate',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      await userAPI.updateProfile(profile);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const settingsSections = [
    {
      title: 'Notifications',
      icon: FiBell,
      settings: [
        {
          id: 'notifications',
          label: 'Enable Notifications',
          description: 'Get alerts about your wellness',
        },
        {
          id: 'emailAlerts',
          label: 'Email Alerts',
          description: 'Receive insights via email',
        },
        {
          id: 'soundAlerts',
          label: 'Sound Alerts',
          description: 'Play sounds for notifications',
        },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: FiLock,
      settings: [
        {
          id: 'dataSharing',
          label: 'Data Sharing',
          description: 'Help improve our AI with anonymous data',
        },
      ],
    },
  ];

  const profileSettings = [
    { label: 'Full Name', value: 'John Doe', editable: true },
    { label: 'Email', value: 'john@example.com', editable: true },
    { label: 'Location', value: 'New York', editable: true },
    { label: 'Member Since', value: 'Jan 2024', editable: false },
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

  return (
    <div className="settings-page">
      <motion.div
        className="settings-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Settings</h1>
        <p>Manage your preferences and account</p>
      </motion.div>

      <motion.div
        className="settings-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Profile Section */}
        <motion.div variants={itemVariants}>
          <Card className="profile-section">
            <div className="section-title">
              <FiUser size={24} />
              <h2>Profile</h2>
            </div>

            <div className="profile-settings">
              {profileSettings.map((setting, idx) => (
                <div key={idx} className="profile-setting">
                  <span className="setting-label">{setting.label}</span>
                  <div className="setting-value-group">
                    <span className="setting-value">{setting.value}</span>
                    {setting.editable && (
                      <button className="edit-btn" title="Edit">
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <motion.button
              className="btn btn-secondary btn-lg"
              style={{ width: '100%', marginTop: '1.5rem' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Change Password
            </motion.button>
          </Card>
        </motion.div>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIdx) => {
          const IconComponent = section.icon;
          return (
            <motion.div key={sectionIdx} variants={itemVariants}>
              <Card className="settings-section-card">
                <div className="section-title">
                  <IconComponent size={24} />
                  <h2>{section.title}</h2>
                </div>

                <div className="settings-list">
                  {section.settings.map((setting, idx) => (
                    <motion.div
                      key={idx}
                      className="setting-item"
                      whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.02)' }}
                    >
                      <div className="setting-info">
                        <p className="setting-name">{setting.label}</p>
                        <p className="setting-description">{setting.description}</p>
                      </div>
                      <motion.button
                        className="toggle"
                        onClick={() => toggleSetting(setting.id)}
                        whileTap={{ scale: 0.95 }}
                      >
                        {settings[setting.id] ? (
                          <FiToggleRight size={32} color="var(--primary)" />
                        ) : (
                          <FiToggleLeft size={32} color="var(--text-secondary)" />
                        )}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          );
        })}

        {/* Preferences Section */}
        <motion.div variants={itemVariants}>
          <Card className="preferences-section">
            <h2>Other Preferences</h2>

            <div className="preference-item">
              <span className="preference-label">Preferred Language</span>
              <select className="preference-select">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>

            <div className="preference-item">
              <span className="preference-label">Data Export</span>
              <motion.button
                className="btn btn-outline btn-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Download Data
              </motion.button>
            </div>

            <div className="preference-item">
              <span className="preference-label">Danger Zone</span>
              <motion.button
                className="btn btn-danger btn-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Delete Account
              </motion.button>
            </div>
          </Card>
        </motion.div>

        {/* About Section */}
        <motion.div variants={itemVariants}>
          <Card className="about-section glass">
            <h2>About NeuroNav</h2>
            <div className="about-content">
              <p>
                <strong>Version:</strong> 2.1.0
              </p>
              <p>
                <strong>Last Updated:</strong> Mar 2026
              </p>
              <p>
                NeuroNav is dedicated to helping autistic individuals navigate and thrive
                in sensory-challenging environments with AI-powered insights and community
                support.
              </p>
              <div className="about-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Contact Us</a>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Settings;
