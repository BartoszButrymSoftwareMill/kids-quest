class RateLimiter {
  requests = /* @__PURE__ */ new Map();
  /**
   * Checks if a user has exceeded their rate limit
   * Returns allowed status and retry-after time if blocked
   */
  async checkLimit(userId, config) {
    if (process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT === "true") {
      return { allowed: true };
    }
    const now = Date.now();
    const windowStart = now - config.windowMs;
    let timestamps = this.requests.get(userId) || [];
    timestamps = timestamps.filter((ts) => ts > windowStart);
    if (timestamps.length >= config.maxRequests) {
      const oldestRequest = timestamps[0];
      const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1e3);
      return { allowed: false, retryAfter };
    }
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
      const filtered = timestamps.filter((ts) => ts > now - 36e5);
      if (filtered.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, filtered);
      }
    }
  }
}
const rateLimiter = new RateLimiter();
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1e3);
const RATE_LIMITS = {
  // Auth login limits (US-024 - MVP requirement)
  AUTH_LOGIN: { windowMs: 15 * 60 * 1e3, maxRequests: 5 },
  // 5 attempts per 15 minutes
  // Auth registration limits - prevent spam/abuse
  AUTH_REGISTER: { windowMs: 15 * 60 * 1e3, maxRequests: 3 },
  // 3 attempts per 15 minutes
  // Quest generation limits
  QUEST_GENERATION_MINUTE: { windowMs: 60 * 1e3, maxRequests: 5 },
  QUEST_GENERATION_HOUR: { windowMs: 60 * 60 * 1e3, maxRequests: 30 },
  // General API limits
  GENERAL_API: { windowMs: 60 * 1e3, maxRequests: 100 }
};

export { RATE_LIMITS as R, rateLimiter as r };
