const {
  validateEmail,
  validatePhone,
  calculateDistance,
  sanitizeInput
} = require('../../utils/validators');

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('john.doe@company.co.uk')).toBe(true);
      expect(validateEmail('test+tag@gmail.com')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(validateEmail('invalid.email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user name@example.com')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone format', () => {
      expect(validatePhone('+1234567890')).toBe(true);
      expect(validatePhone('+44 20 7946 0958')).toBe(true);
      expect(validatePhone('+33123456789')).toBe(true);
    });

    it('should reject invalid phone format', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validatePhone(null)).toBe(false);
      expect(validatePhone(undefined)).toBe(false);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between coordinates', () => {
      const coord1 = { lat: 40.7128, lon: -74.0060 }; // New York
      const coord2 = { lat: 34.0522, lon: -118.2437 }; // Los Angeles

      const distance = calculateDistance(
        coord1.lat, coord1.lon,
        coord2.lat, coord2.lon
      );

      // Distance should be approximately 3944 km
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });

    it('should handle decimal coordinates', () => {
      const distance = calculateDistance(
        40.712776, -74.005974,
        40.758896, -73.985130
      );

      expect(distance).toBeGreaterThan(0);
      expect(typeof distance).toBe('number');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove XSS attack patterns', () => {
      expect(sanitizeInput('<script>alert("xss")</script>'))
        .not.toContain('<script>');
      
      expect(sanitizeInput('javascript:alert("xss")'))
        .not.toContain('javascript:');
    });

    it('should preserve normal text', () => {
      const input = 'This is a normal message';
      expect(sanitizeInput(input)).toBe(input);
    });

    it('should handle special characters safely', () => {
      const input = 'Hello & goodbye < > "quotes"';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBeDefined();
      expect(typeof sanitized).toBe('string');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });
  });
});
