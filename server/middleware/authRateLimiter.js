import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';
import { createRateLimitStore } from '../services/rateLimitService.js';

function parsePositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Configurable via environment variables
const AUTH_WINDOW_MS = parsePositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW, 15 * 60 * 1000);
const AUTH_MAX_ATTEMPTS = parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS, 5);

// Specific limit for password reset functionality (if applicable to future endpoints)
const RESET_WINDOW_MS = 15 * 60 * 1000;
const RESET_MAX_ATTEMPTS = 3;

/**
 * Standardized 429 response generator
 */
function createRateLimitHandler(type) {
  return (req, res, _next, options) => {
    logger.warn(`[Security] ${type} rate limit exceeded`, {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
      limit: options.max,
      windowMs: options.windowMs,
    });

    // Standardized 429 response
    res.status(429).json({
      error: 'Too many login attempts. Please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000), // Info on when to retry
    });
  };
}

// ---------------------------------------------------------------------------
// Strict Authentication Rate Limiter
// Applied to Login APIs and Admin Access Routes
// ---------------------------------------------------------------------------
export const authRateLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('auth-limit:'),
  handler: createRateLimitHandler('Authentication'),
});

// ---------------------------------------------------------------------------
// Protected Actions Rate Limiter
// Applied to Portfolio Passkey and Event Password verification
// ---------------------------------------------------------------------------
export const protectedActionRateLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('protected-action-limit:'),
  handler: createRateLimitHandler('Protected Action'),
});

// ---------------------------------------------------------------------------
// Password Reset Rate Limiter
// Stricter limits for password reset flows
// ---------------------------------------------------------------------------
export const passwordResetRateLimiter = rateLimit({
  windowMs: RESET_WINDOW_MS,
  max: RESET_MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('password-reset-limit:'),
  handler: (req, res, _next, options) => {
    const ipAddress = req.ip;
    const failedAttempts = getFailedAttempts(ipAddress);

    if (failedAttempts > 10) {
      blockIP(ipAddress);

      return res.status(429).json({
        error: 'IP temporarily blocked due to suspicious activity',
      });
    }
    logger.warn('[Security] Password Reset rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
    });
    res.status(429).json({
      error: 'Too many password reset requests. Please try again later.',
    });
  },
});
