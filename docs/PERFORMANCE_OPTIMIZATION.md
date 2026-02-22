# NeuroNav - Performance Optimization Guide

## Overview
This guide provides best practices for optimizing NeuroNav performance in development, staging, and production environments.

## Database Optimization

### 1. Create Essential Indexes

**MongoDB Indexes to Create:**
```javascript
// Users collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 })

// Calm Scores collection - for time-based queries
db.calmScores.createIndex({ userId: 1, timestamp: -1 })
db.calmScores.createIndex({ location: '2dsphere' })  // Geospatial

// Panic Events collection
db.panicEvents.createIndex({ userId: 1, timestamp: -1 })
db.panicEvents.createIndex({ location: '2dsphere' })

// Safe Havens collection - for proximity searches
db.safeHavens.createIndex({ location: '2dsphere' })
db.safeHavens.createIndex({ type: 1 })
db.safeHavens.createIndex({ 'location.address': 1 })

// Community Reports - for trending and location-based queries
db.communityReports.createIndex({ upvotes: -1, timestamp: -1 })
db.communityReports.createIndex({ location: '2dsphere' })
db.communityReports.createIndex({ status: 1 })

// History entries - for efficient querying
db.historyEntries.createIndex({ userId: 1, timestamp: -1 })
db.historyEntries.createIndex({ activityType: 1 })
```

### 2. Query Optimization

**Avoid N+1 Queries:**
```javascript
// ❌ Bad - multiple queries in loop
const users = await User.find();
for (const user of users) {
  const scores = await CalmScore.find({ userId: user._id });
}

// ✅ Good - single aggregation query
const results = await CalmScore.aggregate([
  {
    $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'user'
    }
  }
]);
```

**Use Projection to Limit Fields:**
```javascript
// ❌ Returns all fields
const scores = await CalmScore.find({ userId: userId });

// ✅ Returns only needed fields
const scores = await CalmScore.find(
  { userId: userId },
  'calmScore timestamp stressors'
);
```

### 3. Pagination

Always paginate large result sets:
```javascript
const limit = parseInt(req.query.limit) || 10;
const skip = parseInt(req.query.skip) || 0;

const results = await CalmScore.find({ userId })
  .limit(limit)
  .skip(skip)
  .sort({ timestamp: -1 });
```

## API Performance

### 1. Caching Strategy

**Redis Caching for Frequently Accessed Data:**
```javascript
const redis = require('redis');
const client = redis.createClient();

// Get safe havens with caching
router.get('/safeHaven', async (req, res) => {
  const cacheKey = `havens:${JSON.stringify(req.query)}`;
  
  // Check cache
  const cached = await client.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));
  
  // Fetch from DB
  const havens = await SafeHaven.find(req.query);
  
  // Cache for 1 hour
  await client.setex(cacheKey, 3600, JSON.stringify(havens));
  
  res.json(havens);
});
```

### 2. Response Compression

Enable gzip compression in Nginx:
```nginx
gzip on;
gzip_types application/json text/html text/css;
gzip_min_length 1000;
```

### 3. API Rate Limiting

Adjust based on environment:
```javascript
// Development: relaxed
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});

// Production: strict
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

## Frontend Performance

### 1. Code Splitting

```javascript
// Lazy load components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Analytics = React.lazy(() => import('./pages/Analytics'));

export const Routes = () => (
  <Suspense fallback={<Loader />}>
    <Dashboard />
    <Analytics />
  </Suspense>
);
```

### 2. Memoization

```javascript
import React, { useMemo, useCallback } from 'react';

// Memoize expensive computations
const CalmScoreCard = ({ score }) => {
  const processedData = useMemo(() => {
    return score.map(s => ({
      ...s,
      risk: calculateRisk(s)
    }));
  }, [score]);

  return <Chart data={processedData} />;
};
```

### 3. Image Optimization

```javascript
// Use WebP with fallback
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="description" />
</picture>
```

## Monitoring & Alerting

### 1. Application Monitoring

Use New Relic or Datadog:
```javascript
const newrelic = require('newrelic');

app.use((req, res, next) => {
  newrelic.recordMetric('Custom/Request', 1);
  next();
});
```

### 2. Error Tracking

Use Sentry:
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0
});

app.use(Sentry.Handlers.errorHandler());
```

### 3. Performance Budgets

```javascript
// Monitor API response times
const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Slow API: ${req.path} took ${duration}ms`);
    }
  });
  
  next();
};
```

## Load Testing

### 1. Using Apache Bench

```bash
# Basic load test
ab -n 1000 -c 100 http://localhost:5000/api/health

# With custom headers
ab -n 1000 -c 100 -H "Authorization: Bearer token" \
  http://localhost:5000/api/calmScore
```

### 2. Using Locust

```python
from locust import HttpUser, task, between

class NeuroNavUser(HttpUser):
    wait_time = between(1, 5)
    
    @task(3)
    def get_calm_score(self):
        self.client.get("/api/calmScore")
    
    @task(1)
    def record_score(self):
        self.client.post("/api/calmScore", json={
            "noiseLevel": 50,
            "lightIntensity": 60
        })
```

## Deployment Optimization

### 1. Container Image Optimization

```dockerfile
# Multi-stage build for smaller image
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]
```

### 2. Kubernetes Resource Limits

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

## Monitoring Checklist

- [ ] Database query performance
- [ ] API response times
- [ ] Memory usage
- [ ] CPU utilization
- [ ] Disk I/O
- [ ] Network bandwidth
- [ ] Error rates
- [ ] Concurrent connections

## Performance Targets

- API response time: < 200ms (p95)
- Database query time: < 100ms
- Page load time: < 3s
- Uptime: > 99.9%
- Error rate: < 0.1%

---

**Last Updated**: February 2026
