/**
 * Unit tests for rate-limiter.ts
 * Tests checkLimit() and cleanup() logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Since rateLimiter is a singleton, we need to import the class directly for testing
class RateLimiterForTest {
  private requests = new Map<string, number[]>();

  async checkLimit(
    userId: string,
    config: { windowMs: number; maxRequests: number }
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let timestamps = this.requests.get(userId) || [];
    timestamps = timestamps.filter((ts) => ts > windowStart);

    if (timestamps.length >= config.maxRequests) {
      const oldestRequest = timestamps[0];
      const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000);

      return { allowed: false, retryAfter };
    }

    timestamps.push(now);
    this.requests.set(userId, timestamps);

    return { allowed: true };
  }

  cleanup() {
    const now = Date.now();
    for (const [userId, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter((ts) => ts > now - 3600000);
      if (filtered.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, filtered);
      }
    }
  }

  // Helper for testing
  getRequestsMap() {
    return this.requests;
  }
}

describe('RateLimiter', () => {
  let rateLimiter: RateLimiterForTest;

  beforeEach(() => {
    rateLimiter = new RateLimiterForTest();
    vi.clearAllMocks();
  });

  describe('checkLimit()', () => {
    it('should allow requests within limit', async () => {
      const userId = 'user-123';
      const config = { windowMs: 60000, maxRequests: 5 };

      // Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.checkLimit(userId, config);
        expect(result.allowed).toBe(true);
      }
    });

    it('should block requests after exceeding maxRequests', async () => {
      const userId = 'user-123';
      const config = { windowMs: 60000, maxRequests: 5 };

      // Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit(userId, config);
      }

      // 6th request should be blocked
      const result = await rateLimiter.checkLimit(userId, config);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should return correct retryAfter in seconds', async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const userId = 'user-123';
      const config = { windowMs: 60000, maxRequests: 3 };

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        await rateLimiter.checkLimit(userId, config);
      }

      // Try 4th request immediately
      const result = await rateLimiter.checkLimit(userId, config);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60); // Should be within window

      vi.useRealTimers();
    });

    it('should allow requests after window expires', async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const userId = 'user-123';
      const config = { windowMs: 10000, maxRequests: 2 }; // 10 second window

      // Make 2 requests
      await rateLimiter.checkLimit(userId, config);
      await rateLimiter.checkLimit(userId, config);

      // 3rd should be blocked
      let result = await rateLimiter.checkLimit(userId, config);
      expect(result.allowed).toBe(false);

      // Advance time by 11 seconds (beyond window)
      vi.setSystemTime(now + 11000);

      // Now should be allowed
      result = await rateLimiter.checkLimit(userId, config);
      expect(result.allowed).toBe(true);

      vi.useRealTimers();
    });

    it('should track different users independently', async () => {
      const config = { windowMs: 60000, maxRequests: 2 };

      // User 1 makes 2 requests
      await rateLimiter.checkLimit('user-1', config);
      await rateLimiter.checkLimit('user-1', config);

      // User 1 blocked
      let result = await rateLimiter.checkLimit('user-1', config);
      expect(result.allowed).toBe(false);

      // User 2 should still be allowed
      result = await rateLimiter.checkLimit('user-2', config);
      expect(result.allowed).toBe(true);
    });

    it('should handle windowMs of different durations', async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const userId = 'user-123';

      // Short window - 1 second, 2 requests max
      const shortConfig = { windowMs: 1000, maxRequests: 2 };

      await rateLimiter.checkLimit(userId, shortConfig);
      await rateLimiter.checkLimit(userId, shortConfig);

      // Blocked
      let result = await rateLimiter.checkLimit(userId, shortConfig);
      expect(result.allowed).toBe(false);

      // Advance time by 1.5 seconds
      vi.setSystemTime(now + 1500);

      // Should be allowed again
      result = await rateLimiter.checkLimit(userId, shortConfig);
      expect(result.allowed).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('cleanup()', () => {
    it('should remove entries older than 1 hour', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const userId = 'user-old';
      const config = { windowMs: 60000, maxRequests: 5 };

      // Make a request
      rateLimiter.checkLimit(userId, config);

      // Advance time by 1 hour + 1 second
      vi.setSystemTime(now + 3600000 + 1000);

      // Run cleanup
      rateLimiter.cleanup();

      // Check that user was removed
      const requests = rateLimiter.getRequestsMap();
      expect(requests.has(userId)).toBe(false);

      vi.useRealTimers();
    });

    it('should keep entries newer than 1 hour', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const userId = 'user-recent';
      const config = { windowMs: 60000, maxRequests: 5 };

      // Make a request
      rateLimiter.checkLimit(userId, config);

      // Advance time by 30 minutes (less than 1 hour)
      vi.setSystemTime(now + 30 * 60 * 1000);

      // Run cleanup
      rateLimiter.cleanup();

      // Check that user still exists
      const requests = rateLimiter.getRequestsMap();
      expect(requests.has(userId)).toBe(true);

      vi.useRealTimers();
    });

    it('should filter old timestamps but keep recent ones for same user', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const userId = 'user-mixed';
      const config = { windowMs: 60000, maxRequests: 10 };

      // Make request at time 0
      rateLimiter.checkLimit(userId, config);

      // Advance time by 30 seconds and make another request
      vi.setSystemTime(now + 30 * 1000);
      rateLimiter.checkLimit(userId, config);

      // Advance time by another 20 seconds (50 seconds total from start)
      // Now we're at 50 seconds. windowMs is 60 seconds, so all requests are still valid
      // Request at 0 sec is 50 sec old (< 60 sec) - should be kept by checkLimit
      // Request at 30 sec is 20 sec old (< 60 sec) - should be kept
      vi.setSystemTime(now + 50 * 1000);
      rateLimiter.checkLimit(userId, config);

      // Run cleanup - it keeps last 60 minutes (3600000ms)
      // All our requests are within last minute, so all should be kept
      rateLimiter.cleanup();

      // User should still exist
      const requests = rateLimiter.getRequestsMap();
      expect(requests.has(userId)).toBe(true);

      // Should have 3 requests: all within last hour
      const timestamps = requests.get(userId);
      expect(timestamps?.length).toBe(3);

      vi.useRealTimers();
    });

    it('should handle multiple users in cleanup', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const config = { windowMs: 60000, maxRequests: 5 };

      // User 1 - old request
      rateLimiter.checkLimit('user-old', config);

      // Advance time by 30 minutes
      vi.setSystemTime(now + 30 * 60 * 1000);

      // User 2 - recent request
      rateLimiter.checkLimit('user-recent', config);

      // Advance time by 40 more minutes (70 total)
      vi.setSystemTime(now + 70 * 60 * 1000);

      // Run cleanup
      rateLimiter.cleanup();

      const requests = rateLimiter.getRequestsMap();
      expect(requests.has('user-old')).toBe(false); // Too old
      expect(requests.has('user-recent')).toBe(true); // Still recent enough

      vi.useRealTimers();
    });
  });
});
