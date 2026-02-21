import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import Card from '../components/Card';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/pages/Auth.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
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
    try {
      const response = await authAPI.login(formData.email, formData.password);
      localStorage.setItem('token', response.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
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
    <div className="auth-page login-page">
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
              <span className="benefit-icon">📊</span>
              <h3>Track Progress</h3>
              <p>Monitor your sensory wellness over time</p>
            </div>
            <div className="benefit">
              <span className="benefit-icon">🗺️</span>
              <h3>Find Safe Spaces</h3>
              <p>Discover sensory-friendly locations</p>
            </div>
            <div className="benefit">
              <span className="benefit-icon">💡</span>
              <h3>Get Insights</h3>
              <p>AI-powered recommendations just for you</p>
            </div>
          </div>
        </motion.div>

        {/* Right Section */}
        <motion.div className="auth-section auth-right" variants={itemVariants}>
          <Card className="auth-form-card">
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account to continue</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
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

              {/* Remember Me */}
              <motion.div className="form-checkbox" variants={itemVariants}>
                <input
                  type="checkbox"
                  id="remember"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label htmlFor="remember">Remember me for 30 days</label>
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
                  <span className="btn-loading">Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
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
                  <span>Google</span>
                </button>
                <button type="button" className="social-btn apple">
                  <span>Apple</span>
                </button>
              </motion.div>
            </form>

            {/* Signup Link */}
            <motion.div className="form-footer" variants={itemVariants}>
              <p>
                Don't have an account?{' '}
                <Link to="/signup" className="link">
                  Sign up here
                </Link>
              </p>
            </motion.div>

            {/* Forgot Password */}
            <motion.div className="forgot-password" variants={itemVariants}>
              <Link to="/forgot-password" className="link">
                Forgot your password?
              </Link>
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

export default LoginPage;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      localStorage.setItem('authToken', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>
            <i className="bi bi-shield-check"></i> NeuroNav
          </h1>
          <p>Autism Support Companion</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Login to Your Account</h2>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/signup">Sign up here</Link>
          </p>
          <p>
            <a href="/forgot-password">Forgot your password?</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
