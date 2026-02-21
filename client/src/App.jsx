import React from 'react';
import '../styles/global.css';

const App = () => {
  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <i className="bi bi-shield-check"></i>
            <span>NeuroNav</span>
          </div>
          <nav className="navbar-nav">
            <a href="/" className="nav-link">Home</a>
            <a href="/login" className="nav-link">Login</a>
            <a href="/signup" className="nav-link">Sign Up</a>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {/* Routes will be rendered here */}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 NeuroNav. Built by Team Dzio with <i className="bi bi-heart-fill"></i></p>
          <p>Empowering autistic individuals to navigate the world with confidence.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
