import { Redis } from 'ioredis';
import { RedisStore } from 'rate-limit-redis';
import { MemoryStore } from 'express-rate-limit';
import logger from '../utils/logger.js';

let redisClient = null;

class CappedMemoryStore {
  constructor(maxKeys = 10000) {
    this.store = new MemoryStore();
    this.maxKeys = maxKeys;
    this.options = null;
  }

  init(options) {
    this.options = options;
    return this.store.init(options);
  }

  async increment(key) {
    const localKeysCount = this.store.localKeys?.length || 0;
    if (localKeysCount >= this.maxKeys) {
      logger.warn(
        '[RateLimiter] Fallback memory store capacity exceeded. Purging to prevent OOM.',
        { capacity: this.maxKeys }
      );
      if (this.store.shutdown) this.store.shutdown();
      this.store = new MemoryStore();
      if (this.options) this.store.init(this.options);
    }
    return this.store.increment(key);
  }

  async decrement(key) {
    return this.store.decrement(key);
  }

  async resetKey(key) {
    return this.store.resetKey(key);
  }

  async get(key) {
    return this.store.get ? this.store.get(key) : undefined;
  }
}

// Determine available Redis URL
const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

if (process.env.UPSTASH_REDIS_REST_URL && !process.env.REDIS_URL) {
  throw new Error(
    'Configuration Error: ioredis does not support Upstash REST URLs. Please use a TCP connection string under REDIS_URL instead.'
  );
}
if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        // Stop retrying after 3 attempts to allow graceful fallback to memory
        if (times > 3) {
          logger.warn(
            '[RateLimiter] Redis unreachable after 3 retries, falling back to memory store if necessary.'
          );
          return null;
        }
        return Math.min(times * 100, 2000);
      },
    });

    redisClient.on('error', (err) => {
      logger.warn('[RateLimiter] Redis connection error:', err.message);
    });

    redisClient.on('connect', () => {
      logger.info('[RateLimiter] Successfully connected to Redis rate limit store.');
    });
  } catch (err) {
    logger.warn('[RateLimiter] Failed to initialize Redis client:', err.message);
    redisClient = null;
  }
}

/**
 * Creates a rate limit store. Uses Redis if configured and reachable,
 * otherwise returns a CappedMemoryStore to force express-rate-limit to fall back
 * gracefully to a bounded memory store.
 *
 * @param {string} prefix The Redis key prefix to isolate limiters
 * @returns {RedisStore | CappedMemoryStore}
 */
export function createRateLimitStore(prefix) {
  if (redisClient) {
    return new RedisStore({
      // @ts-expect-error - rate-limit-redis v3 uses sendCommand with ioredis
      sendCommand: (...args) => redisClient.call(...args),
      prefix: prefix,
    });
  }
  return new CappedMemoryStore(10000);
}

// For testing purposes
export function _getRedisClient() {
  return redisClient;
}

export function _closeRedis() {
  if (redisClient) {
    redisClient.quit();
  }
}
