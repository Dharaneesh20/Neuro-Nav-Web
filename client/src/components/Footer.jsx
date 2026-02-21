import React from 'react';
import { motion } from 'framer-motion';
import { FiGithub, FiTwitter, FiLinkedin, FiFacebook } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Product',
      links: ['Features', 'Pricing', 'Security', 'Roadmap'],
    },
    {
      title: 'Company',
      links: ['About', 'Blog', 'Careers', 'Contact'],
    },
    {
      title: 'Resources',
      links: ['Docs', 'API', 'Support', 'Community'],
    },
    {
      title: 'Legal',
      links: ['Privacy', 'Terms', 'License', 'Cookies'],
    },
  ];

  const socialLinks = [
    { icon: FiGithub, href: '#' },
    { icon: FiTwitter, href: '#' },
    { icon: FiLinkedin, href: '#' },
    { icon: FiFacebook, href: '#' },
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
    <footer className="footer">
      <motion.div
        className="footer-content container"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div className="footer-section" variants={itemVariants}>
          <div className="footer-brand">
            <div className="brand-icon">N</div>
            <div>
              <h3>NeuroNav</h3>
              <p>Empowering autistic individuals to navigate their world.</p>
            </div>
          </div>
        </motion.div>

        {footerLinks.map((section, idx) => (
          <motion.div key={idx} className="footer-section" variants={itemVariants}>
            <h4>{section.title}</h4>
            <ul>
              {section.links.map((link, linkIdx) => (
                <li key={linkIdx}>
                  <a href="#">{link}</a>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="footer-bottom"
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="container footer-bottom-content">
          <p>&copy; {currentYear} NeuroNav. All rights reserved.</p>

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
  );
};

export default Footer;
