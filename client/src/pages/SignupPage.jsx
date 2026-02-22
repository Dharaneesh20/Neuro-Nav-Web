import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { FaGoogle, FaApple } from 'react-icons/fa';
import Card from '../components/Card';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import '../styles/pages/Auth.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    autismLevel: 'moderate',
    agreeTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const signupData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        autismLevel: formData.autismLevel,
      };

      const response = await authAPI.signup(signupData);
      // Use the context login function to update global auth state
      login(response.data.token, response.data.user);
      // Navigate to dashboard after successful signup
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="auth-page signup-page">
      <motion.div
        className="auth-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Section */}
        <motion.div className="auth-section auth-left" variants={itemVariants}>
          <div className="auth-branding">
            <div className="brand-icon-large">N</div>
            <h1>NeuroNav</h1>
            <p>Navigate Your Sensory World</p>
          </div>

          <div className="auth-benefits">
            <div className="benefit">
              <span className="benefit-icon">💬</span>
              <h3>AI-Powered Support</h3>
              <p>Get personalized recommendations</p>
            </div>
            <div className="benefit">
              <span className="benefit-icon">🆘</span>
              <h3>Emergency Support</h3>
              <p>Alert caregivers instantly</p>
            </div>
            <div className="benefit">
              <span className="benefit-icon">🎵</span>
              <h3>Music Therapy</h3>
              <p>Soothing playlists for calm moments</p>
            </div>
          </div>
        </motion.div>

        {/* Right Section */}
        <motion.div className="auth-section auth-right" variants={itemVariants}>
          <Card className="auth-form-card">
            <div className="form-header">
              <h2>Create Your Account</h2>
              <p>Join NeuroNav to start your journey</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Name Field */}
              <motion.div className="form-group" variants={itemVariants}>
                <label htmlFor="name">Full Name</label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="input-field"
                    required
                  />
                </div>
              </motion.div>

              {/* Email Field */}
              <motion.div className="form-group" variants={itemVariants}>
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="input-field"
                    required
                  />
                </div>
              </motion.div>

              {/* Autism Level */}
              <motion.div className="form-group" variants={itemVariants}>
                <label htmlFor="autismLevel">Autism Support Level</label>
                <select
                  id="autismLevel"
                  name="autismLevel"
                  value={formData.autismLevel}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </motion.div>

              {/* Password Field */}
              <motion.div className="form-group" variants={itemVariants}>
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field"
                    minLength="6"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </motion.div>

              {/* Confirm Password Field */}
              <motion.div className="form-group" variants={itemVariants}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field"
                    minLength="6"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </motion.div>

              {/* Terms Checkbox */}
              <motion.div className="form-checkbox" variants={itemVariants}>
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="agreeTerms">I agree to the Terms of Service</label>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className="btn btn-primary btn-lg auth-btn"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                variants={itemVariants}
              >
                {isLoading ? (
                  <span className="btn-loading">Creating Account...</span>
                ) : (
                  <>
                    <span>Sign Up</span>
                    <FiArrowRight />
                  </>
                )}
              </motion.button>

              {/* Divider */}
              <motion.div className="divider" variants={itemVariants}>
                <span>or</span>
              </motion.div>

              {/* Social Login */}
              <motion.div className="social-login" variants={itemVariants}>
                <button type="button" className="social-btn google">
                  <FaGoogle size={20} />
                  <span>Google</span>
                </button>
                <button type="button" className="social-btn apple">
                  <FaApple size={20} />
                  <span>Apple</span>
                </button>
              </motion.div>
            </form>

            {/* Login Link */}
            <motion.div className="form-footer" variants={itemVariants}>
              <p>
                Already have an account?{' '}
                <Link to="/login" className="link">
                  Sign in here
                </Link>
              </p>
            </motion.div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Decorative Blobs */}
      <motion.div
        className="auth-blob blob-1"
        animate={{ rotate: 360, y: [0, 20, 0] }}
        transition={{ rotate: { duration: 20, repeat: Infinity }, y: { duration: 4, repeat: Infinity } }}
      />
      <motion.div
        className="auth-blob blob-2"
        animate={{ rotate: -360, y: [0, -20, 0] }}
        transition={{ rotate: { duration: 25, repeat: Infinity }, y: { duration: 5, repeat: Infinity } }}
      />
    </div>
  );
};

export default SignupPage;
