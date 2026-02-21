# API Testing Guide

## Setup Test Environment

Install test dependencies:
```bash
cd server
npm install --save-dev jest supertest
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Test Structure

Tests are organized in the `tests/` directory:

```
tests/
├── unit/
│   ├── models.test.js
│   ├── validators.test.js
│   └── helpers.test.js
├── integration/
│   ├── auth.test.js
│   ├── users.test.js
│   ├── calmScores.test.js
│   ├── panicEvents.test.js
│   ├── routes.test.js
│   ├── safeHavens.test.js
│   ├── communityReports.test.js
│   ├── musicTherapy.test.js
│   ├── history.test.js
│   └── export.test.js
└── e2e/
    └── fullWorkflow.test.js
```

## Example Tests

### Authentication Test
```javascript
const request = require('supertest');
const app = require('../index');

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
```

### Calm Scores Test
```javascript
describe('Calm Scores Endpoints', () => {
  it('should record a calm score', async () => {
    const res = await request(app)
      .post('/api/calm-scores')
      .set('Authorization', `Bearer ${token}`)
      .send({
        noiseLevel: 85,
        lightIntensity: 70,
        crowdingLevel: 8,
        temperature: 22,
        environmentDescription: 'Busy mall',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.calmScore).toHaveProperty('calmScore');
    expect(res.body.calmScore.calmScore).toBeLessThanOrEqual(100);
  });
});
```

## Manual Testing with cURL

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Record Calm Score (requires token)
```bash
curl -X POST http://localhost:5000/api/calm-scores \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "noiseLevel": 85,
    "lightIntensity": 70,
    "crowdingLevel": 8,
    "temperature": 22,
    "environmentDescription": "Busy mall"
  }'
```

## API Testing Tools

### Postman
1. Import the Postman collection from `docs/postman-collection.json`
2. Set environment variables for your base URL and auth tokens
3. Run individual requests or test suites

### Insomnia
Similar to Postman - import the collection and configure environment.

### VS Code REST Client
Create a `test-api.http` file:

```
### Signup
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}

###  Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

## Performance Testing

### Load Testing with Apache Bench
```bash
# Test endpoint with 1000 requests, 10 concurrent
ab -n 1000 -c 10 http://localhost:5000/api/health
```

### Load Testing with Locust
```bash
# Create locustfile.py with test scenarios
locust -f locustfile.py
```

## Continuous Integration

Tests run automatically on every push:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Upload coverage
        run: npm run coverage
```

## Coverage Goals

- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%
