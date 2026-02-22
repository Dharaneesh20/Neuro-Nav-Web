# NeuroNav - Security Hardening Guide

## Overview
This guide provides comprehensive security best practices for deploying and maintaining NeuroNav in production.

## Authentication & Authorization

### 1. Password Security

**Strong Password Requirements:**
```javascript
// Enforce strong passwords
const validatePassword = (password) => {
  const minLength = 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  return (
    password.length >= minLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumbers &&
    hasSpecialChar
  );
};
```

**Password Hashing:**
```javascript
const bcrypt = require('bcryptjs');

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

### 2. JWT Security

**Token Configuration:**
```javascript
// Secure token settings
const tokenOptions = {
  expiresIn: '24h',           // Short expiration
  issuer: 'neuronav',
  audience: 'neuronav-app',
  algorithm: 'HS256'
};

// Refresh token strategy
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};
```

**Token Validation:**
```javascript
const validateToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};
```

### 3. Session Management

**Implement CSRF Protection:**
```javascript
const csrf = require('csurf');

app.use(csrf({ cookie: false }));

// Require CSRF token for state-changing requests
app.post('/api/users', csrf(), (req, res) => {
  // Process request
});
```

**Secure Session Configuration:**
```javascript
const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: true,        // HTTPS only
    httpOnly: true,      // No JavaScript access
    sameSite: 'strict',  // CSRF protection
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}));
```

## Data Protection

### 1. Encryption at Rest

**Encrypt Sensitive Fields:**
```javascript
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const encryptionKey = process.env.ENCRYPTION_KEY;

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

const decrypt = (encrypted) => {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
  
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

**Apply to Sensitive Schema:**
```javascript
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    set: (val) => encrypt(val),
    get: (val) => decrypt(val)
  },
  caregiverContacts: [{
    phone: {
      type: String,
      set: (val) => encrypt(val),
      get: (val) => decrypt(val)
    }
  }]
});
```

### 2. Encryption in Transit

**HTTPS/TLS Configuration:**
```nginx
# Nginx SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Certificate setup
ssl_certificate /etc/ssl/certs/neuronav.crt;
ssl_certificate_key /etc/ssl/private/neuronav.key;
```

### 3. API Key Management

**Securely Manage Third-Party Keys:**
```javascript
// ❌ Bad: Keys in code
const GEMINI_KEY = 'sk-1234567890';

// ✅ Good: Keys in environment
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// Rotate keys regularly (30-90 days)
const keyRotationSchedule = {
  GEMINI_API_KEY: 30,
  GOOGLE_MAPS_API_KEY: 60,
  SPOTIFY_CLIENT_SECRET: 45
};
```

**API Key Validation:**
```javascript
const validateApiKey = async (key, service) => {
  const response = await fetch(
    `https://api.service.com/validate`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}` }
    }
  );
  
  return response.ok;
};
```

## Access Control

### 1. Role-Based Access Control (RBAC)

```javascript
const ROLES = {
  USER: 'user',
  CAREGIVER: 'caregiver',
  THERAPIST: 'therapist',
  ADMIN: 'admin'
};

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

// Usage
app.get('/api/admin/users', authorize([ROLES.ADMIN]), adminRoutes);
```

### 2. Data Access Control

```javascript
const getPrivateCalmScores = async (req, res) => {
  const userId = req.user.id;
  
  // Only allow users to see their own data
  const scores = await CalmScore.find({ userId });
  
  if (!scores) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json(scores);
};
```

## Input Validation & Sanitization

### 1. Input Validation

```javascript
const { body, validationResult } = require('express-validator');

const validateUserInput = [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 12 })
    .matches(/[A-Z]/)
    .matches(/[a-z]/)
    .matches(/\d/)
    .matches(/[!@#$%^&*]/),
  body('phone').isMobilePhone(),
  body('autismLevel').isIn(['mild', 'moderate', 'severe'])
];

app.post('/api/auth/signup', validateUserInput, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request
});
```

### 2. SQL/NoSQL Injection Prevention

```javascript
// ❌ Bad: Direct string concatenation
const user = await User.find({ email: req.body.email });

// ✅ Good: Parameterized queries (Mongoose handles this)
const user = await User.find({ email: req.body.email });

// For raw queries
const user = await User.findOne({
  $where: `this.email === '${req.body.email}'`  // Vulnerable!
});

// ✅ Correct
const user = await User.findOne({
  email: req.body.email
});
```

### 3. XSS Prevention

```javascript
const sanitizeHtml = require('sanitize-html');

const sanitizeInput = (input) => {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  });
};

app.post('/api/communityReport', (req, res) => {
  const sanitizedDescription = sanitizeInput(req.body.description);
  // Process sanitized input
});
```

## Security Headers

### 1. Helmet Configuration

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"]
    }
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

### 2. Security Headers

```javascript
app.use((req, res, next) => {
  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Permissions-Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});
```

## Logging & Monitoring

### 1. Security Event Logging

```javascript
const logger = require('winston');

const logSecurityEvent = (eventType, details) => {
  logger.warn({
    timestamp: new Date(),
    eventType,
    userId: details.userId,
    ip: details.ip,
    action: details.action,
    result: details.result
  });
};

// Usage
app.post('/api/auth/login', (req, res) => {
  try {
    // Login logic
    logSecurityEvent('LOGIN_SUCCESS', {
      userId: user.id,
      ip: req.ip,
      action: 'user_login',
      result: 'success'
    });
  } catch (error) {
    logSecurityEvent('LOGIN_FAILED', {
      email: req.body.email,
      ip: req.ip,
      action: 'user_login',
      result: 'failed',
      reason: error.message
    });
  }
});
```

### 2. Intrusion Detection

```javascript
// Monitor for suspicious activities
const suspiciousActivityMiddleware = (req, res, next) => {
  const failedAttempts = getFailedAttempts(req.ip);
  
  if (failedAttempts > 5) {
    logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      ip: req.ip,
      action: 'rate_limit_exceeded',
      attemptCount: failedAttempts
    });
    
    return res.status(429).json({ error: 'Too many attempts' });
  }
  
  next();
};
```

## Deployment Security

### 1. Environment Secrets

**Use AWS Secrets Manager:**
```javascript
const AWS = require('aws-sdk');

const secretsManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION
});

const getSecrets = async () => {
  const secret = await secretsManager.getSecretValue({
    SecretId: 'neuronav/production'
  }).promise();
  
  return JSON.parse(secret.SecretString);
};
```

### 2. Docker Security

```dockerfile
# Run as non-root user
FROM node:18-alpine

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 5000
CMD ["node", "index.js"]
```

### 3. Kubernetes Security

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: neuronav
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsReadOnlyRootFilesystem: true
  containers:
  - name: neuronav
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop:
        - ALL
    livenessProbe:
      httpGet:
        path: /api/health/alive
        port: 5000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /api/health/ready
        port: 5000
      initialDelaySeconds: 10
      periodSeconds: 5
```

## Security Checklist

- [ ] Enable HTTPS/TLS for all communications
- [ ] Implement HSTS header
- [ ] Use strong password requirements
- [ ] Enable two-factor authentication
- [ ] Implement CSRF protection
- [ ] Validate and sanitize all inputs
- [ ] Use parameterized queries
- [ ] Implement proper error handling (don't leak info)
- [ ] Enable security logging and monitoring
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Implement rate limiting
- [ ] Use environment variables for secrets
- [ ] Regular backups with encryption
- [ ] Security training for team
- [ ] Incident response plan
- [ ] Privacy policy compliance (GDPR, CCPA)
- [ ] Regular penetration testing

## Incident Response

### 1. Security Breach Protocol

```markdown
1. **Immediate Actions**
   - Isolate affected systems
   - Preserve evidence
   - Notify security team

2. **Investigation**
   - Determine scope of breach
   - Identify root cause
   - Log all findings

3. **Notification**
   - Inform affected users
   - Notify regulatory bodies if required
   - Post-breach communications

4. **Recovery**
   - Remediate vulnerabilities
   - Update security measures
   - Restore systems
```

---

**Last Updated**: February 2026  
**Security Contact**: security@neuronav.com
