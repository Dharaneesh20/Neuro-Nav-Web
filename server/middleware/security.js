const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const securityMiddleware = helmet();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 requests per windowMs
});

module.exports = {
  securityMiddleware,
  apiLimiter,
  authLimiter,
};
