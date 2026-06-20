const { redisConnection } = require('../services/queue.service');

/**
 * Redis-backed sliding window rate limiting middleware.
 * Limits clients to 100 requests per 60 seconds per IP.
 *
 * Key fix: the ZADD member must be UNIQUE per request.
 * Using `now` as the member means requests arriving at the same millisecond
 * overwrite each other in the sorted set (ZADD updates the score when the
 * member already exists), so the count never grows past 1 per millisecond.
 * Using `${now}-${Math.random()}` gives every request its own entry.
 */
async function rateLimitMiddleware(req, res, next) {
  try {
    const ip = req.ip || 'unknown';
    const key = `rate_limit:${ip}`;
    const now = Date.now();
    const windowMs = 60000; // 60 seconds

    // 1. Remove all entries older than 60 seconds FIRST so the set stays lean.
    await redisConnection.zremrangebyscore(key, '-inf', now - windowMs);

    // 2. Add this request with a UNIQUE member so rapid requests never collide.
    //    Score = timestamp (for range queries), member = timestamp + random suffix.
    const member = `${now}-${Math.random()}`;
    await redisConnection.zadd(key, now, member);

    // 3. Count all entries within the sliding window.
    const count = await redisConnection.zcount(key, now - windowMs, now);

    // 4. Refresh TTL so idle keys are cleaned up automatically.
    await redisConnection.expire(key, 70);

    // 5. Reject if the window is full (request 101+ gets 429).
    if (count > 100) {
      return res.status(429).json({ error: 'Too many requests, please slow down' });
    }

    next();
  } catch (error) {
    // If Redis is unavailable, fail open so a Redis outage doesn't take down the API.
    console.error('Rate limiting Redis error:', error);
    next();
  }
}

module.exports = rateLimitMiddleware;
