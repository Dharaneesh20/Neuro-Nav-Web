import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/modern-theme.css';

// Components
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import StatsSection from './components/StatsSection';
import Footer from './components/Footer';
import PanicButton from './components/PanicButton';

// Pages
import Dashboard from './pages/Dashboard';
import RecordScore from './pages/RecordScore';
import MapView from './pages/MapView';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Protected Route Component
const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        {isAuthenticated && <Navigation />}
        {!isAuthenticated && <Navigation />}
        
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <>
                    <HeroSection />
                    <StatsSection />
                  </>
                )
              } 
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/record"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <RecordScore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <MapView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {!isAuthenticated && <Footer />}
        {isAuthenticated && <PanicButton />}
      </div>
    </Router>
  );
};

export default App;
