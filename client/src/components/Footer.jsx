import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGithub, FiTwitter, FiLinkedin, FiFacebook,
  FiCode, FiBookOpen, FiZap, FiShield, FiUsers, FiChevronDown,
  FiServer, FiKey, FiDatabase, FiX, FiExternalLink,
} from 'react-icons/fi';
import './Footer.css';

/* ── Team members ───────────────────────────────────────────── */
const TEAM = [
  {
    initials: 'RD',
    name: 'R S Dharaneesh',
    roles: ['React Native & Android Developer', 'Full Stack Dev', 'Cloud Developer'],
    gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    github: 'https://github.com/Dharaneesh20',
    linkedin: 'https://www.linkedin.com/in/dharaneeshrs-clouddev',
  },
  {
    initials: 'DP',
    name: 'Dev Prasath A',
    roles: ['Full Stack Developer', 'AIML Developer'],
    gradient: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
    github: 'https://github.com/DevPrasath6',
    linkedin: 'https://www.linkedin.com/in/devprasatha9/',
  },
  {
    initials: 'AA',
    name: 'Abinayaa A',
    roles: ['Database Designer'],
    gradient: 'linear-gradient(135deg,#10b981,#0ea5e9)',
    github: 'https://github.com/Abinayaa018',
    linkedin: 'https://www.linkedin.com/in/abinayaa1/',
  },
  {
    initials: 'DR',
    name: 'Dharshini R S',
    roles: ['AI & ML Developer'],
    gradient: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
    github: 'https://github.com/Dharsh0109',
    linkedin: 'https://www.linkedin.com/in/dharshini-r-s-072848333/',
  },
];

/* ── API endpoints shown in footer ─────────────────────────── */
const API_GROUPS = [
  {
    icon: FiKey,
    label: 'Auth',
    endpoints: ['POST /api/auth/register', 'POST /api/auth/login', 'POST /api/auth/logout'],
  },
  {
    icon: FiDatabase,
    label: 'Data',
    endpoints: ['GET /api/calm-scores', 'POST /api/calm-scores', 'GET /api/history'],
  },
  {
    icon: FiServer,
    label: 'Services',
    endpoints: ['GET /api/safe-havens', 'GET /api/routes', 'POST /api/panic-events'],
  },
];

/* ── Team Modal ─────────────────────────────────────────────── */
const TeamModal = ({ onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="team-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="team-modal"
          initial={{ opacity: 0, scale: 0.92, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 40 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="team-modal-header">
            <div className="team-modal-header-left">
              <span className="team-modal-icon"><FiUsers size={22} /></span>
              <div>
                <h2 className="team-modal-title">
                  Team&nbsp;<span className="dzio-gradient">dzio</span>
                </h2>
                <p className="team-modal-subtitle">The people who built NeuroNav</p>
              </div>
            </div>
            <button className="team-modal-close" onClick={onClose} aria-label="Close">
              <FiX size={20} />
            </button>
          </div>

          {/* Cards */}
          <div className="team-modal-grid">
            {TEAM.map((m, i) => (
              <motion.div
                key={m.name}
                className="team-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                {/* Avatar */}
                <div className="team-card-avatar" style={{ background: m.gradient }}>
                  {m.initials}
                  <div className="team-card-avatar-ring" style={{ boxShadow: `0 0 0 3px ${m.gradient.match(/#[0-9a-f]{6}/i)?.[0] ?? '#6366f1'}44` }} />
                </div>

                {/* Info */}
                <div className="team-card-info">
                  <h3 className="team-card-name">{m.name}</h3>
                  <div className="team-card-roles">
                    {m.roles.map(r => (
                      <span key={r} className="team-card-role">{r}</span>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="team-card-links">
                  <a
                    href={m.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="team-card-link github"
                  >
                    <FiGithub size={15} />
                    <span>GitHub</span>
                    <FiExternalLink size={11} className="team-link-ext" />
                  </a>
                  <a
                    href={m.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="team-card-link linkedin"
                  >
                    <FiLinkedin size={15} />
                    <span>LinkedIn</span>
                    <FiExternalLink size={11} className="team-link-ext" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [teamOpen, setTeamOpen] = useState(false);
  const [apiOpen,  setApiOpen]  = useState(false);

  const socialLinks = [
    { icon: FiGithub,   href: '#' },
    { icon: FiTwitter,  href: '#' },
    { icon: FiLinkedin, href: '#' },
    { icon: FiFacebook, href: '#' },
  ];

  return (
    <>
    {/* Team modal — rendered outside footer so it overlays everything */}
    <AnimatePresence>
      {teamOpen && <TeamModal onClose={() => setTeamOpen(false)} />}
    </AnimatePresence>

    <footer className="footer">

      {/* ── Brand block ──────────────────────────────────── */}
      <motion.div
        className="footer-brand-bar container"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="footer-brand">
          <div className="brand-icon">N</div>
          <div>
            <h3>NeuroNav</h3>
            <p>Empowering autistic individuals to navigate their world.</p>
          </div>
        </div>
      </motion.div>

      {/* ── API Reference strip ──────────────────────────────── */}
      <motion.div
        className="footer-api-strip container"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15 }}
      >
        {/* header / toggle */}
        <button
          className="footer-api-header"
          onClick={() => setApiOpen(p => !p)}
          aria-expanded={apiOpen}
        >
          <span className="footer-api-header-left">
            <FiCode className="footer-api-icon" size={18} />
            <span className="footer-api-title">API Reference</span>
            <span className="footer-api-pill">v1</span>
            <span className="footer-api-pill green">REST</span>
          </span>
          <span className="footer-api-header-right">
            <a
              href="/docs/api"
              className="footer-api-docs-link"
              onClick={e => e.stopPropagation()}
            >
              <FiBookOpen size={14} /> Full Docs
            </a>
            <motion.span
              animate={{ rotate: apiOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="footer-api-chevron"
            >
              <FiChevronDown size={16} />
            </motion.span>
          </span>
        </button>

        {/* expanded panel */}
        <AnimatePresence initial={false}>
          {apiOpen && (
            <motion.div
              className="footer-api-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
            >
              <div className="footer-api-info">
                <div className="footer-api-meta">
                  <span><FiZap size={13}/> Base URL: <code>https://api.neuronav.app/v1</code></span>
                  <span><FiShield size={13}/> Auth: Bearer JWT token</span>
                  <span><FiServer size={13}/> Content-Type: application/json</span>
                </div>

                <div className="footer-api-groups">
                  {API_GROUPS.map(({ icon: Icon, label, endpoints }) => (
                    <div key={label} className="footer-api-group">
                      <p className="footer-api-group-label">
                        <Icon size={13}/> {label}
                      </p>
                      <ul>
                        {endpoints.map(ep => (
                          <li key={ep}>
                            <code>{ep}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Our Team button strip ─────────────────────────────── */}
      <motion.div
        className="footer-team-strip container"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.25 }}
      >
        <button
          className="footer-team-btn"
          onClick={() => setTeamOpen(true)}
        >
          <FiUsers size={16} />
          Meet the team&nbsp;—&nbsp;<span className="footer-dzio">dzio</span>
          <FiExternalLink size={13} className="footer-team-btn-ext" />
        </button>
      </motion.div>

      {/* ── Bottom bar ───────────────────────────────────────── */}
      <motion.div
        className="footer-bottom"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="container footer-bottom-content">
          <p>
            &copy; {currentYear} NeuroNav. All rights reserved.
            &nbsp;·&nbsp;
            Built with ♥ by&nbsp;
            <button className="footer-dzio-btn" onClick={() => setTeamOpen(true)}>
              <span className="footer-dzio-inline">dzio</span>
            </button>
          </p>

          <div className="social-links">
            {socialLinks.map((social, idx) => {
              const Icon = social.icon;
              return (
                <motion.a
                  key={idx}
                  href={social.href}
                  className="social-link"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={20} />
                </motion.a>
              );
            })}
          </div>
        </div>
      </motion.div>
    </footer>
    </>
  );
};

export default Footer;
