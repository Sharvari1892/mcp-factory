import { describe, test, expect, vi, beforeEach } from 'vitest';

// Define the mock redis connection object
const mockRedis = {
  zadd: vi.fn(),
  zremrangebyscore: vi.fn(),
  zcount: vi.fn(),
  expire: vi.fn(),
  on: vi.fn()
};

// Define a traditional constructor function to allow instantiation with `new`
function MockIORedis() {
  return mockRedis;
}
MockIORedis.default = MockIORedis;

// Populate require.cache directly for 'ioredis' to intercept CommonJS requires
const ioredisPath = require.resolve('ioredis');
require.cache[ioredisPath] = {
  id: ioredisPath,
  filename: ioredisPath,
  loaded: true,
  exports: MockIORedis
};

// Populate require.cache directly for 'bullmq' to prevent any real bullmq behavior
const bullmqPath = require.resolve('bullmq');
require.cache[bullmqPath] = {
  id: bullmqPath,
  filename: bullmqPath,
  loaded: true,
  exports: {
    Queue: function() {
      return {
        add: vi.fn()
      };
    }
  }
};

// Require the middleware and the queue service AFTER cache population
const rateLimitMiddleware = require('../../src/middleware/rateLimit.middleware.js');
const { redisConnection } = require('../../src/services/queue.service.js');

describe('rateLimitMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      ip: '127.0.0.1'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    next = vi.fn();
  });

  test('should allow request when limit is not exceeded', async () => {
    mockRedis.zadd.mockResolvedValue(1);
    mockRedis.zremrangebyscore.mockResolvedValue(0);
    mockRedis.zcount.mockResolvedValue(50);
    mockRedis.expire.mockResolvedValue(1);

    await rateLimitMiddleware(req, res, next);

    expect(mockRedis.zadd).toHaveBeenCalledWith('rate_limit:127.0.0.1', expect.any(Number), expect.any(Number));
    expect(mockRedis.zremrangebyscore).toHaveBeenCalledWith('rate_limit:127.0.0.1', '-inf', expect.any(Number));
    expect(mockRedis.zcount).toHaveBeenCalledWith('rate_limit:127.0.0.1', expect.any(Number), expect.any(Number));
    expect(mockRedis.expire).toHaveBeenCalledWith('rate_limit:127.0.0.1', 70);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should block request when limit is exceeded (> 100)', async () => {
    mockRedis.zadd.mockResolvedValue(1);
    mockRedis.zremrangebyscore.mockResolvedValue(0);
    mockRedis.zcount.mockResolvedValue(101);
    mockRedis.expire.mockResolvedValue(1);

    await rateLimitMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ error: 'Too many requests, please slow down' });
  });

  test('should allow request (fail-open) if Redis throws an error', async () => {
    mockRedis.zadd.mockRejectedValue(new Error('Redis connection failed'));

    await rateLimitMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
