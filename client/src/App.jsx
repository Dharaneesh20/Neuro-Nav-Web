import React from 'react';
import './styles/modern-theme.css';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import StatsSection from './components/StatsSection';
import Footer from './components/Footer';

const App = () => {
  return (
    <div className="app">
      <Navigation />

      <main className="main-content">
        <HeroSection />
        <StatsSection />
      </main>

      <Footer />
    </div>
  );
};

export default App;
