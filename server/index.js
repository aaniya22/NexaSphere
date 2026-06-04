import 'dotenv/config';
import helmet from 'helmet';
import express from 'express';
import { body, validationResult } from 'express-validator';
import cors from 'cors';
import morgan from 'morgan';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminAuthMiddleware } from './middleware/adminAuthMiddleware.js';
import analyticsRouter from './routes/analytics.js';
import { initializeSocketIO } from './config/socket.js';
import adminStreamRouter from './routes/adminStream.js';
import documentationRouter from './routes/documentation.js';
import monitoringRouter from './routes/monitoring.js';
import { performanceMonitor } from './middleware/performanceMonitor.js';
import { tracingMiddleware } from './middleware/tracingMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { initializeSentry, addSentryErrorHandler } from './utils/sentry.js';
import {
  apiRateLimiter,
  formRateLimiter,
  notificationRateLimiter,
  validateLimiters,
} from './middleware/rateLimiter.js';
import {
  authRateLimiter,
  protectedActionRateLimiter,
  passwordResetRateLimiter,
} from './middleware/authRateLimiter.js';
import { portfolioRepository } from './repositories/portfolioRepository.js';
import { getPublicAppUrl } from './utils/publicAppUrl.js';
import * as eventsController from './controllers/eventsController.js';
import * as activityEventsController from './controllers/activityEventsController.js';
import * as coreTeamController from './controllers/coreTeamController.js';
import * as formsController from './controllers/formsController.js';
import { eventsService } from './services/eventsService.js';
import { coreTeamService } from './services/coreTeamService.js';
import notificationsService from './services/notificationsService.js';
import { supabaseRequest, HAS_SUPABASE } from './storage/supabaseClient.js';

validateLimiters();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_FILE = path.join(__dirname, 'data', 'content.json');

const app = express();

// Trust the first reverse proxy hop (e.g., Vercel, Render, Nginx, Cloudflare)
// to correctly populate req.ip and securely discard spoofed X-Forwarded-For headers
const proxyTrust = process.env.TRUST_PROXY || 1;
app.set(
  'trust proxy',
  proxyTrust === 'true'
    ? true
    : proxyTrust === 'false'
      ? false
      : !isNaN(proxyTrust)
        ? parseInt(proxyTrust, 10)
        : proxyTrust
);

initializeSentry(app);

if (!process.env.CORS_ORIGIN) {
  throw new Error('CORS_ORIGIN environment variable must be set.');
}

const allowedOrigins = process.env.CORS_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        process.env.FRONTEND_URL || "http://localhost:5173",
        `wss://${process.env.DOMAIN || 'localhost'}`,
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(tracingMiddleware);

app.use(express.json({ limit: '512kb' }));
app.use(morgan('combined'));
app.use(performanceMonitor);

// Global API rate limiter — protects all /api routes from request flooding
app.use('/api', apiRateLimiter);

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const { method, path, reqId } = req;

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.statusCode;
    const prefix = reqId ? `[${reqId}] ` : '';
    const message = `${prefix}[${method}] ${path} → ${status} (${Math.round(duration)}ms)`;

    if (status >= 500) {
      console.error(message);
    } else if (status >= 400) {
      console.warn(message);
    } else {
      console.log(message);
    }
  });

  next();
}

app.use(requestLogger);

// ── Health check (required by Render, Railway, and load balancers) ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nexasphere-api', timestamp: new Date().toISOString() });
});
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nexasphere-api', timestamp: new Date().toISOString() });
});

// Mount monitoring + API documentation routes
app.use('/api/monitoring', monitoringRouter);
app.use('/api', documentationRouter);

const adminAuth = adminAuthMiddleware.requireAdmin;

const defaultContent = {
  events: [
    {
      id: 'kss-153',
      name: 'KSS #153 — Knowledge Sharing Session',
      shortName: 'KSS #153',
      date: 'March 14, 2025',
      description: "NexaSphere's inaugural Knowledge Sharing Session focused on the impact of AI.",
      status: 'completed',
      icon: 'Brain',
      tags: ['AI', 'Learning', 'Community'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  activityEvents: {},
  coreTeam: [],
};

function requiredStrongPassword(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  if (value.length < 12 || !hasLower || !hasUpper || !hasNumber || !hasSymbol) {
    throw new Error(
      `${name} must be at least 12 characters and include uppercase, lowercase, number, and symbol`
    );
  }

  return value;
}

const ADMIN_EVENT_PASSWORD = requiredStrongPassword('ADMIN_EVENT_PASSWORD');

getPublicAppUrl();

async function ensureContentFile() {
  const dir = path.dirname(CONTENT_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(CONTENT_FILE);
  } catch {
    await fs.writeFile(CONTENT_FILE, JSON.stringify(defaultContent, null, 2), 'utf8');
  }
}

// REST Endpoints
app.get('/healthz', async (req, res) => {
  try {
    const list = await eventsService.listEvents({ page: 1, limit: 1 });
    res.json({
      ok: true,
      events: list?.total ?? 0,
      storage: HAS_SUPABASE ? 'supabase' : 'file',
    });
  } catch (e) {
    res.status(503).json({
      ok: false,
      error: e?.message || 'Health check failed',
      storage: HAS_SUPABASE ? 'supabase' : 'file',
    });
  }
});

// Event channels/content
app.get('/api/content/events', eventsController.listEvents);
app.get('/api/content/activity-events/:activityKey', activityEventsController.listActivityEvents);
app.post(
  '/api/content/activity-events/:activityKey',
  protectedActionRateLimiter,
  activityEventsController.addActivityEvent
);
app.delete(
  '/api/content/activity-events/:activityKey/:eventId',
  protectedActionRateLimiter,
  activityEventsController.deleteActivityEvent
);

// Admin Auth Endpoints
app.post('/api/admin/login', authRateLimiter, adminAuthMiddleware.login);
app.post('/api/admin/logout', adminAuth, adminAuthMiddleware.logout);
app.use('/api/admin/analytics', adminAuth, analyticsRouter);
app.use('/api/admin/metrics', adminAuth, adminStreamRouter);

// Event Admin Management
app.get('/api/admin/events', adminAuth, eventsController.adminListEvents);
app.post('/api/admin/events', adminAuth, eventsController.adminCreateEvent);
app.put('/api/admin/events/:id', adminAuth, eventsController.adminUpdateEvent);
app.delete('/api/admin/events/:id', adminAuth, eventsController.adminDeleteEvent);

// Public listings
app.get('/api/content/team', async (req, res) => {
  try {
    const rawMembers = await coreTeamService.listMembers();
    const members = (rawMembers || []).map((m) => {
      let email = m.email || null;
      if (email && !email.toLowerCase().endsWith('@glbajajgroup.org')) {
        email = null;
      }
      return {
        ...m,
        email,
        whatsapp: 'https://chat.whatsapp.com/FhpJEaod2g419jFMfqrhGZ',
      };
    });
    return res.json({ members });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to load core team' });
  }
});

// Admin Team Management
app.get('/api/admin/core-team', adminAuth, coreTeamController.adminListCoreTeamMembers);
app.post('/api/admin/core-team', adminAuth, coreTeamController.adminAddCoreTeamMember);
app.delete('/api/admin/core-team/:id', adminAuth, coreTeamController.adminDeleteCoreTeamMember);

// Dynamic forms
app.post('/api/forms/membership', formRateLimiter, formsController.makeHandleForm('membership'));
app.post('/api/forms/recruitment', formRateLimiter, formsController.makeHandleForm('recruitment'));
app.post('/api/core-team/apply', formRateLimiter, formsController.makeHandleForm('core_team'));

app.post(
  '/api/submissions/membership',
  formRateLimiter,
  formsController.makeHandleForm('membership')
);
app.post(
  '/api/submissions/recruitment',
  formRateLimiter,
  formsController.makeHandleForm('recruitment')
);

// Admin membership responses
app.get('/api/admin/membership', adminAuth, async (req, res) => {
  const scriptUrl = process.env.MEMBERSHIP_SCRIPT_URL;
  const secret = process.env.MEMBERSHIP_SECRET;

  if (!scriptUrl || !secret) {
    return res.json({ responses: [] });
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getResponses', token: secret }),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script returned ${response.status}`);
    }

    const data = await response.json();
    return res.json({ responses: data.responses || [] });
  } catch (err) {
    console.error('[Membership] Failed to fetch responses:', err.message);
    return res.status(500).json({ error: 'Failed to fetch membership responses' });
  }
});

app.get('/api/admin/me', adminAuth, (req, res) => {
  return res.json({ username: req.adminSession.username });
});

// Real-time Push Subscriber channels
const pushSubscriptions = new Set();

const validatePushSubscription = [
  body('subscription').isObject().withMessage('subscription must be an object'),
  body('subscription.endpoint')
    .isURL()
    .withMessage('endpoint must be a valid URL')
    .isLength({ max: 2048 }),
  body('subscription.keys').isObject().withMessage('keys must be an object'),
  body('subscription.keys.p256dh')
    .isString()
    .isLength({ max: 256 })
    .withMessage('p256dh must be a string up to 256 chars'),
  body('subscription.keys.auth')
    .isString()
    .isLength({ max: 128 })
    .withMessage('auth must be a string up to 128 chars'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: 'Invalid subscription payload', details: errors.array() });
    }

    // Strict sanitization: reconstruct object to drop malicious properties and limit memory size
    const {
      endpoint,
      keys: { p256dh, auth },
    } = req.body.subscription;
    req.body.subscription = { endpoint, keys: { p256dh, auth } };

    next();
  },
];

app.post('/api/notifications/subscribe', validatePushSubscription, (req, res) => {
  try {
    const { subscription } = req.body;
    if (subscription) {
      pushSubscriptions.add(JSON.stringify(subscription));
      if (pushSubscriptions.size > 10000) {
        const oldest = pushSubscriptions.values().next().value;
        pushSubscriptions.delete(oldest);
      }
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/unsubscribe', validatePushSubscription, (req, res) => {
  try {
    const { subscription } = req.body;
    if (subscription) pushSubscriptions.delete(JSON.stringify(subscription));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/mark-read', adminAuth, notificationRateLimiter, async (req, res) => {
  try {
    const { id, userId } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const uid = userId || 'global';
    const ok = await notificationsService.markAsRead(uid, id);
    return res.json({ success: ok });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post(
  '/api/notifications/mark-all-read',
  adminAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const { userId } = req.body || {};
      await notificationsService.markAllAsRead(userId || 'global');
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

app.delete('/api/notifications/:id', adminAuth, notificationRateLimiter, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.query.userId || 'global';
    const removed = await notificationsService.removeNotification(userId, id);
    if (!removed) return res.status(404).json({ error: 'Notification not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications', adminAuth, notificationRateLimiter, async (req, res) => {
  try {
    const userId = req.query.userId || 'global';
    await notificationsService.clearAll(userId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications', adminAuth, notificationRateLimiter, async (req, res) => {
  try {
    const { userId, title, message, type, link } = req.body || {};
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }
    const note = await notificationsService.addNotification(userId || 'global', {
      title,
      message,
      type,
      link,
    });
    return res.json({ success: true, notification: note });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Portfolio routing support
app.get('/api/portfolio/:username', async (req, res) => {
  try {
    const username = String(req.params.username || '').trim();
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    const portfolio = await portfolioRepository.getByUsername(username);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    return res.json(portfolio);
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Hard cap on tracked entries. When the limit is reached, the
// oldest inserted entry is evicted before adding a new one, preventing the
// Map from growing without bound when an attacker rotates through many
// distinct usernames from the same or different IP addresses.
const MAX_PASSKEY_TRACKED_KEYS = 10_000;
const failedPasskeyAttemptsByIp = new Map();
const failedPasskeyAttemptsByUsername = new Map();

// Periodic sweep every 30 minutes: remove entries whose lockout period has
// expired and whose attempt count has already been reset to 0, so they do
// not accumulate for keys that are never visited again.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of failedPasskeyAttemptsByIp) {
      if (entry.count === 0 && now > entry.lockoutUntil) {
        failedPasskeyAttemptsByIp.delete(key);
      }
    }
    for (const [key, entry] of failedPasskeyAttemptsByUsername) {
      if (now > entry.lockoutUntil) {
        failedPasskeyAttemptsByUsername.delete(key);
      }
    }
  },
  30 * 60 * 1000
).unref();

function checkPasskeyLockout(username, ip) {
  const ipKey = String(ip || 'unknown');
  const userKey = String(username || '').toLowerCase();

  const ipEntry = failedPasskeyAttemptsByIp.get(ipKey);
  const userEntry = failedPasskeyAttemptsByUsername.get(userKey);

  const now = Date.now();

  if (ipEntry && ipEntry.lockoutUntil !== 0 && now <= ipEntry.lockoutUntil) {
    return true;
  }

  if (userEntry && userEntry.lockoutUntil !== 0 && now <= userEntry.lockoutUntil) {
    return true;
  }

  // Cleanup expired entries proactively
  if (ipEntry && ipEntry.lockoutUntil !== 0 && now > ipEntry.lockoutUntil) {
    failedPasskeyAttemptsByIp.delete(ipKey);
  }
  if (userEntry && userEntry.lockoutUntil !== 0 && now > userEntry.lockoutUntil) {
    failedPasskeyAttemptsByUsername.delete(userKey);
  }

  return false;
}

function recordFailedPasskeyAttempt(username, ip) {
  const ipKey = String(ip || 'unknown');
  const userKey = String(username || '').toLowerCase();

  // IP tracking
  if (
    !failedPasskeyAttemptsByIp.has(ipKey) &&
    failedPasskeyAttemptsByIp.size >= MAX_PASSKEY_TRACKED_KEYS
  ) {
    failedPasskeyAttemptsByIp.delete(failedPasskeyAttemptsByIp.keys().next().value);
  }
  const ipEntry = failedPasskeyAttemptsByIp.get(ipKey) || { count: 0, lockoutUntil: 0 };
  ipEntry.count += 1;
  if (ipEntry.count >= 5) {
    ipEntry.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 mins
    ipEntry.count = 0; // Reset count so they need 5 more AFTER lockout to be locked again
  }
  failedPasskeyAttemptsByIp.set(ipKey, ipEntry);

  // Username tracking (Exponential backoff)
  if (
    !failedPasskeyAttemptsByUsername.has(userKey) &&
    failedPasskeyAttemptsByUsername.size >= MAX_PASSKEY_TRACKED_KEYS
  ) {
    failedPasskeyAttemptsByUsername.delete(failedPasskeyAttemptsByUsername.keys().next().value);
  }
  const userEntry = failedPasskeyAttemptsByUsername.get(userKey) || { count: 0, lockoutUntil: 0 };
  userEntry.count += 1;
  if (userEntry.count >= 5) {
    // 5 attempts = 1 min, 6 = 2 mins, 7 = 4 mins, 8 = 8 mins, 9+ = 15 mins
    const factor = Math.pow(2, Math.max(0, userEntry.count - 5));
    const delayMinutes = Math.min(15, factor);
    userEntry.lockoutUntil = Date.now() + delayMinutes * 60 * 1000;
  }
  failedPasskeyAttemptsByUsername.set(userKey, userEntry);

  return { ipEntry, userEntry };
}

function clearPasskeyAttempts(username, ip) {
  const ipKey = String(ip || 'unknown');
  const userKey = String(username || '').toLowerCase();

  failedPasskeyAttemptsByIp.delete(ipKey);
  failedPasskeyAttemptsByUsername.delete(userKey);
}

app.get('/api/notifications', async (req, res) => {
  try {
    const userId = req.query.userId || 'global';
    const list = await notificationsService.getNotifications(userId);
    return res.json({ notifications: list });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/portfolio', protectedActionRateLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const username = String(body.username || '').trim();
    const passkey = String(body.passkey || '').trim();
    const ip = req.ip || 'unknown';

    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({
        error: 'Username can only contain alphanumeric characters, underscores, and hyphens',
      });
    }
    if (!passkey || passkey.length < 12) {
      return res.status(400).json({ error: 'Passkey must be at least 12 characters long' });
    }

    const existingPortfolio = await portfolioRepository.getByUsername(username);
    const isNewRegistration = !existingPortfolio;

    const lockout = checkPasskeyLockout(username, ip);
    if (lockout) {
      return res.status(429).json({
        error: 'Too many failed passkey attempts. Please try again later.',
      });
    }

    const isAuthorized = await portfolioRepository.verifyPasskey(username, passkey, {
      allowNew: isNewRegistration,
    });
    if (!isAuthorized) {
      recordFailedPasskeyAttempt(username, ip);
      return res.status(401).json({ error: 'Incorrect passkey for this username' });
    }

    clearPasskeyAttempts(username, ip);

    const saved = await portfolioRepository.createOrUpdate(body, isNewRegistration);
    return res.json({ ok: true, portfolio: saved });
  } catch (err) {
    if (err.code === '23505') {
      return res
        .status(409)
        .json({ error: 'Username already exists. Another request may have just created it.' });
    }
    console.error('Error saving portfolio:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Must be registered after all routes.
app.use(notFoundHandler);
addSentryErrorHandler(app);
app.use(errorHandler);

process.on('unhandledRejection', (reason) => {
  console.error(
    '[Process] Unhandled rejection:',
    reason instanceof Error ? reason.message : reason
  );
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception:', err instanceof Error ? err.message : err);
  if (err && err.stack) console.error(err.stack);
  process.exit(1);
});

const port = Number(process.env.PORT || 8787);
let server;

if (!process.env.VERCEL) {
  const boot = HAS_SUPABASE ? Promise.resolve() : ensureContentFile();
  boot.then(() => {
    server = app.listen(port, () => {
      console.log(`NexaSphere server listening on http://localhost:${port}`);
    });
    initializeSocketIO(server);
  });
} else {
  server = app.listen(port, () => {
    console.log(`NexaSphere server listening on http://localhost:${port}`);
  });
  initializeSocketIO(server);
}

export default app;
