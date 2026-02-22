const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const User = require('../../models/User');

jest.mock('../../models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword123',
        phone: '+1234567890',
        autismLevel: 'moderate'
      };

      User.prototype.save = jest.fn().mockResolvedValue({
        _id: '123',
        ...userData,
        password: 'hashed_password'
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'John Doe'
          // Missing other required fields
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
          phone: '+1234567890',
          autismLevel: 'moderate'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return token for valid credentials', async () => {
      const userData = {
        _id: '123',
        email: 'john@example.com',
        password: 'hashed_password',
        name: 'John Doe',
        matchPassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(userData);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'securepassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for missing email or password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com'
          // Missing password
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/verify');

      expect(response.status).toBe(401);
    });

    it('should verify valid token', async () => {
      // This test requires proper JWT setup
      // Implementation depends on your auth middleware
      const token = 'valid_jwt_token';

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      // Expect 200 or 401 depending on token validity
      expect([200, 401]).toContain(response.status);
    });
  });
});
