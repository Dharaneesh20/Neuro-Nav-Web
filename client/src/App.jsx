import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/modern-theme.css';

// Context
import { AuthProvider, useAuthContext } from './context/AuthContext';

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
import CommunityFeed from './pages/CommunityFeed';
import DisasterMode from './pages/DisasterMode';
import HelpDesk from './pages/HelpDesk';
import DisasterTrack from './pages/DisasterTrack';
import PlanTrip from './pages/PlanTrip';
import ChatBot from './pages/ChatBot';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Protected Route Component
const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuthContext();

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
            <Route
              path="/plan-trip"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <PlanTrip />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <ChatBot />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <CommunityFeed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/disaster"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <DisasterMode />
                </ProtectedRoute>
              }
            />
            {/* Public disaster tracking — no auth required */}
            <Route path="/disaster/track/:sessionId" element={<DisasterTrack />} />
            {/* Helpdesk portal — has its own login */}
            <Route path="/helpdesk" element={<HelpDesk />} />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
        {isAuthenticated && <PanicButton />}
      </div>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
