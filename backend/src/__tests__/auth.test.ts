import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/authService';

describe('AuthService', () => {
  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = AuthService.generateAccessToken({ userId: 'test-id', mobile: '9876543210' });

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe('test-id');
      expect(decoded.mobile).toBe('9876543210');
    });

    it('should set expiry on the token', () => {
      const token = AuthService.generateAccessToken({ userId: 'test-id', mobile: '9876543210' });
      const decoded = jwt.decode(token) as any;

      expect(decoded.exp).toBeTruthy();
      // Token should expire in the future
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });
});

describe('Cache helpers', () => {
  it('should return null when Redis is not configured', async () => {
    const { cacheGet } = await import('../config/redis');
    const result = await cacheGet('nonexistent-key');
    expect(result).toBeNull();
  });
});

describe('Queue helpers', () => {
  it('should return null when Redis is not configured', async () => {
    const { getQueue, QUEUES } = await import('../config/queue');
    const queue = getQueue(QUEUES.NOTIFICATION);
    expect(queue).toBeNull();
  });
});
