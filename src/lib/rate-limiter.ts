interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

/**
 * In-memory rate limiter for API endpoints
 * Tracks request counts per user within time windows
 */
class RateLimiter {
  private requests = new Map<string, number[]>();

  /**
   * Checks if a user has exceeded their rate limit
   * Returns allowed status and retry-after time if blocked
   */
  async checkLimit(userId: string, config: RateLimitConfig): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get user's request timestamps
    let timestamps = this.requests.get(userId) || [];

    // Filter out old requests outside the window
    timestamps = timestamps.filter((ts) => ts > windowStart);

    if (timestamps.length >= config.maxRequests) {
      const oldestRequest = timestamps[0];
      const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000);

      return { allowed: false, retryAfter };
    }

    // Add current request
    timestamps.push(now);
    this.requests.set(userId, timestamps);

    return { allowed: true };
  }

  /**
   * Cleanup old entries to prevent memory leaks
   * Should be called periodically
   */
  cleanup() {
    const now = Date.now();
    for (const [userId, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter((ts) => ts > now - 3600000); // Keep last hour
      if (filtered.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, filtered);
      }
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Cleanup old entries every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Auth login limits (US-024 - MVP requirement)
  AUTH_LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes

  // Auth registration limits - prevent spam/abuse
  AUTH_REGISTER: { windowMs: 15 * 60 * 1000, maxRequests: 3 }, // 3 attempts per 15 minutes

  // Quest generation limits
  QUEST_GENERATION_MINUTE: { windowMs: 60 * 1000, maxRequests: 5 },
  QUEST_GENERATION_HOUR: { windowMs: 60 * 60 * 1000, maxRequests: 30 },

  // General API limits
  GENERAL_API: { windowMs: 60 * 1000, maxRequests: 100 },
};
