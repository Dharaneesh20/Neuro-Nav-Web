# NeuroNav Environment Configuration Guide

## Overview
This document explains the environment-specific configuration for NeuroNav across development, staging, and production environments.

## Environment Files

### Development (.env.development)
Used for local development with relaxed settings and verbose logging.

```bash
# Server
NODE_ENV=development
PORT=5000
DEBUG=true

# Database
MONGODB_URI=mongodb://localhost:27017/neuronav_dev

# JWT
JWT_SECRET=dev_secret_key_change_in_production
JWT_EXPIRE=7d

# API Keys
GEMINI_API_KEY=your_gemini_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
SPOTIFY_CLIENT_ID=your_spotify_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_secret_here

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_password

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting (disabled in dev)
RATE_LIMIT_ENABLED=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
```

### Staging (.env.staging)
Used for QA and testing with semi-relaxed settings.

```bash
# Server
NODE_ENV=staging
PORT=5000
DEBUG=false

# Database
MONGODB_URI=mongodb+srv://user:password@staging-cluster.mongodb.net/neuronav_staging

# JWT
JWT_SECRET=staging_secret_key_from_vault
JWT_EXPIRE=7d

# API Keys (staging versions)
GEMINI_API_KEY=staging_gemini_key
GOOGLE_MAPS_API_KEY=staging_google_maps_key
SPOTIFY_CLIENT_ID=staging_spotify_id
SPOTIFY_CLIENT_SECRET=staging_spotify_secret

# SMTP (staging Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=staging@neuronav.com
SMTP_PASS=staging_app_password

# Twilio (staging)
TWILIO_ACCOUNT_SID=staging_account_sid
TWILIO_AUTH_TOKEN=staging_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# CORS
CORS_ORIGIN=https://staging.neuronav.com

# Rate Limiting (moderate)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Production (.env.production)
Used in production with strict security settings.

```bash
# Server
NODE_ENV=production
PORT=5000
DEBUG=false

# Database
MONGODB_URI=mongodb+srv://user:password@prod-cluster.mongodb.net/neuronav

# JWT (from secure vault)
JWT_SECRET=production_secret_key_from_aws_secrets_manager
JWT_EXPIRE=7d

# API Keys (from AWS Secrets Manager)
GEMINI_API_KEY=production_gemini_key_from_vault
GOOGLE_MAPS_API_KEY=production_google_maps_key_from_vault
SPOTIFY_CLIENT_ID=production_spotify_id_from_vault
SPOTIFY_CLIENT_SECRET=production_spotify_secret_from_vault

# SMTP (production Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=neuronav@gmail.com
SMTP_PASS=production_app_password_from_vault

# Twilio (production)
TWILIO_ACCOUNT_SID=production_account_sid_from_vault
TWILIO_AUTH_TOKEN=production_auth_token_from_vault
TWILIO_PHONE_NUMBER=+1234567890

# CORS
CORS_ORIGIN=https://neuronav.com

# Rate Limiting (strict)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# Logging
LOG_LEVEL=error

# Security
HELMET_ENABLED=true
HTTPS_REDIRECT=true
```

## Configuration Management

### Using AWS Secrets Manager (Production)
```javascript
const AWS = require('aws-sdk');

const secretsManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION
});

async function getSecrets() {
  try {
    const data = await secretsManager.getSecretValue({
      SecretId: 'neuronav/production'
    }).promise();
    return JSON.parse(data.SecretString);
  } catch (error) {
    console.error('Error retrieving secrets:', error);
    throw error;
  }
}
```

### Using Environment-Specific Config Files

**server/config/environments.js**
```javascript
const environments = {
  development: {
    dbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    apiKeys: {
      gemini: process.env.GEMINI_API_KEY,
      googleMaps: process.env.GOOGLE_MAPS_API_KEY,
      spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
      }
    },
    rateLimiting: {
      enabled: false
    },
    logging: {
      level: 'debug'
    }
  },
  staging: {
    dbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    apiKeys: {
      gemini: process.env.GEMINI_API_KEY,
      googleMaps: process.env.GOOGLE_MAPS_API_KEY,
      spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
      }
    },
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    },
    logging: {
      level: 'info'
    }
  },
  production: {
    dbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    apiKeys: {
      gemini: process.env.GEMINI_API_KEY,
      googleMaps: process.env.GOOGLE_MAPS_API_KEY,
      spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
      }
    },
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000,
      maxRequests: 50
    },
    logging: {
      level: 'error'
    }
  }
};

module.exports = environments[process.env.NODE_ENV || 'development'];
```

## Deploying to Staging/Production

### Staging Deployment
```bash
# Build Docker image
docker build -t neuronav:staging -f Dockerfile.staging .

# Push to registry
docker tag neuronav:staging registry.example.com/neuronav:staging
docker push registry.example.com/neuronav:staging

# Deploy to staging server
ssh staging@neuronav-staging.com "docker pull registry.example.com/neuronav:staging && docker-compose -f docker-compose.staging.yml up -d"
```

### Production Deployment
```bash
# Create production tag
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0

# Build Docker image
docker build -t neuronav:1.0.0 .

# Push to registry
docker tag neuronav:1.0.0 registry.example.com/neuronav:1.0.0
docker push registry.example.com/neuronav:1.0.0

# Deploy to production (with blue-green deployment)
ssh prod@neuronav.com "docker pull registry.example.com/neuronav:1.0.0 && docker-compose -f docker-compose.production.yml up -d"
```

## Best Practices

1. **Never commit .env files** - Use .env.example
2. **Rotate secrets regularly** - Update API keys and secrets every 90 days
3. **Use environment-specific configs** - Different settings per environment
4. **Monitor logs** - Enable appropriate logging levels
5. **Test deployments** - Always test in staging first
6. **Secure secrets** - Use AWS Secrets Manager or similar service
7. **Use HTTPS** - Always use SSL/TLS in production
8. **Rate limiting** - Stricter limits in production

---

**Last Updated**: February 2026
