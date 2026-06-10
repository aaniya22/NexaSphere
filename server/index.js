import 'dotenv/config';
import helmet from 'helmet';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminAuthMiddleware } from './middleware/adminAuthMiddleware.js';
import analyticsRouter from './routes/analytics.js';
import apiRouter from './routes/api.js';
import { initializeSocketIO } from './config/socket.js';
import adminStreamRouter from './routes/adminStream.js';
import documentationRouter from './routes/documentation.js';
import monitoringRouter from './routes/monitoring.js';
import healthRouter from './routes/health.js';
import coreTeamRouter from './routes/coreTeam.js';
import formsRouter from './routes/forms.js';
import portfolioRouter from './routes/portfolio.js';
import notificationsRouter from './routes/notifications.js';
import adminRouter from './routes/admin.js';
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
import { portfolioContentSchema, portfolioPutSchema } from './validators/portfolioSchemas.js';
import { searchController } from './controllers/searchController.js';
import { pushSubscriptionsRepository } from './repositories/pushSubscriptionsRepository.js';
import { getPublicAppUrl } from './utils/publicAppUrl.js';
import * as eventsController from './controllers/eventsController.js';
import * as activityEventsController from './controllers/activityEventsController.js';
import * as coreTeamController from './controllers/coreTeamController.js';
import * as formsController from './controllers/formsController.js';
import { eventsService } from './services/eventsService.js';
import { coreTeamService } from './services/coreTeamService.js';
import notificationsService from './services/notificationsService.js';
import { notificationPreferencesRepository } from './repositories/notificationPreferencesRepository.js';
import { supabaseRequest, HAS_SUPABASE } from './storage/supabaseClient.js';
import cookieParser from 'cookie-parser';
import passport from './config/studentOAuth.js';
import { studentUsersRepository } from './repositories/studentUsersRepository.js';
import * as studentAuthController from './controllers/studentAuthController.js';
import { requireStudentAuth } from './middleware/studentAuthMiddleware.js';
import { xssSanitizer } from './middleware/xssSanitizer.js';
import { tierRateLimiter } from './middleware/tierRateLimiter.js';
import compression from 'compression';
import syncRouter from './routes/sync.js';

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
app.use(compression());

if (!process.env.CORS_ORIGIN) {
  throw new Error('CORS_ORIGIN environment variable must be set.');
}

const allowedOrigins = process.env.CORS_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  helmet({
    // Prevent MIME sniffing
    noSniff: true,

    // Prevent clickjacking
    frameguard: {
      action: 'deny',
    },

    // Hide X-Powered-By
    hidePoweredBy: true,

    // Disable old IE XSS filter
    xssFilter: false,

    // Restrict referrer leakage
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    // Enforce HTTPS in production
    hsts:
      process.env.NODE_ENV === 'production'
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,

    // Strict Content Security Policy
    contentSecurityPolicy: {
      useDefaults: false,

      directives: {
        // Default restriction
        defaultSrc: ["'self'"],

        // Prevent inline scripts + third-party execution
        scriptSrc: ["'self'"],

        // Allow styles from self only
        styleSrc: ["'self'", "'unsafe-inline'"],

        // Images
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],

        // Fonts
        fontSrc: ["'self'", 'https:', 'data:'],

        // API/WebSocket connections
        connectSrc: ["'self'", 'https:', 'wss:'],

        // Block Flash/object/embed
        objectSrc: ["'none'"],

        // Prevent <base> hijacking
        baseUri: ["'self'"],

        // Prevent iframe embedding
        frameAncestors: ["'none'"],

        // Restrict forms
        formAction: ["'self'"],

        // Prevent mixed content
        upgradeInsecureRequests: [],

        // Restrict workers
        workerSrc: ["'self'", 'blob:'],

        // Restrict manifests
        manifestSrc: ["'self'"],

        // Restrict media
        mediaSrc: ["'self'"],

        // Restrict frames
        frameSrc: ["'none'"],

        // Restrict child browsing contexts
        childSrc: ["'none'"],
      },
    },

    // Safer cross-origin behavior
    crossOriginEmbedderPolicy: false,

    crossOriginOpenerPolicy: {
      policy: 'same-origin',
    },

    crossOriginResourcePolicy: {
      policy: 'same-origin',
    },

    // Disable DNS prefetching
    dnsPrefetchControl: {
      allow: false,
    },

    // Prevent browser feature abuse
    permissionsPolicy: {
      features: {
        geolocation: [],
        microphone: [],
        camera: [],
        payment: [],
        usb: [],
        magnetometer: [],
        gyroscope: [],
      },
    },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS Policy: Origin not allowed.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // Cache preflight requests for 24 hours
  })
);
app.options('*', cors());

app.use(tracingMiddleware);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(xssSanitizer);
app.use(morgan('combined'));
app.use(performanceMonitor);
app.use(cookieParser());

// Global API rate limiter — protects all /api routes from request flooding
app.use('/api', tierRateLimiter());

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

// Mount route modules
app.use('/api/monitoring', monitoringRouter);
app.use('/api', documentationRouter);
app.use('/', apiRouter);
app.use('/', healthRouter);
app.use('/', coreTeamRouter);
app.use('/api', formsRouter);
app.use('/api', portfolioRouter);
app.use('/api', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/', syncRouter);

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

// Admin Analytics & Metrics (mounted with admin auth)
app.use('/api/admin/analytics', adminAuth, analyticsRouter);
app.use('/api/admin/metrics', adminAuth, adminStreamRouter);

// OAuth / SSO Student Auth Endpoints
app.get('/api/auth/google', studentAuthController.googleAuth);
app.get('/api/auth/google/callback', studentAuthController.googleCallback);
app.get('/api/auth/github', studentAuthController.githubAuth);
app.get('/api/auth/github/callback', studentAuthController.githubCallback);
app.get('/api/auth/me', requireStudentAuth, studentAuthController.getMe);
app.post('/api/auth/logout', studentAuthController.logout);

// ── Push subscription persistence ──────────────────────────────────────────
// The in-memory Set is a fast local mirror. When a PostgreSQL database is
// configured (DATABASE_URL present), subscriptions are also persisted to the
// push_subscriptions table so they survive server restarts, deploys, and
// crashes. When no database is configured the store degrades to memory-only,
// preserving the previous behavior for local development.
const pushSubscriptions = new Set();

const PUSH_PERSISTENCE_ENABLED = Boolean(process.env.DATABASE_URL);

// Load any previously persisted subscriptions into the in-memory mirror at
// startup so a restart does not silently drop registered subscribers.
async function loadPersistedPushSubscriptions() {
  if (!PUSH_PERSISTENCE_ENABLED) return;
  try {
    const rows = await pushSubscriptionsRepository.list({ limit: 10000 });
    for (const sub of rows) {
      pushSubscriptions.add(JSON.stringify(sub));
    }
    console.log(`Loaded ${rows.length} persisted push subscription(s).`);
  } catch (err) {
    console.error('Failed to load persisted push subscriptions:', err.message);
  }
}

async function persistPushSubscription(subscription) {
  if (!PUSH_PERSISTENCE_ENABLED) return;
  try {
    await pushSubscriptionsRepository.add(subscription);
  } catch (err) {
    console.error('Failed to persist push subscription:', err.message);
  }
}

async function removePersistedPushSubscription(subscription) {
  if (!PUSH_PERSISTENCE_ENABLED) return;
  try {
    await pushSubscriptionsRepository.remove(subscription.endpoint);
  } catch (err) {
    console.error('Failed to remove persisted push subscription:', err.message);
  }
}

// Notification Preferences
app.get('/api/notifications/preferences', async (req, res) => {
  try {
    const userId = req.query.userId || 'global';
    const prefs = await notificationPreferencesRepository.list(userId);
    return res.json({ preferences: prefs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/preferences', async (req, res) => {
  try {
    const userId = req.body.userId || 'global';
    const { category, email, push, in_app } = req.body;
    if (!category) return res.status(400).json({ error: 'category is required' });
    const pref = await notificationPreferencesRepository.set(userId, category, {
      email,
      push,
      in_app,
    });
    return res.json({ preference: pref });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/preferences/bulk', async (req, res) => {
  try {
    const userId = req.body.userId || 'global';
    const { preferences } = req.body;
    if (!Array.isArray(preferences) || !preferences.length) {
      return res.status(400).json({ error: 'preferences array is required' });
    }
    const results = await notificationPreferencesRepository.setBulk(userId, preferences);
    return res.json({ preferences: results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Search, Discovery & Recommendation Engine ──
app.get('/api/search', searchController.search);
app.get('/api/search/trending', searchController.trending);
app.get('/api/recommendations', searchController.recommendations);
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

if (process.env.NODE_ENV !== 'test') {
  if (!process.env.VERCEL) {
    const boot = HAS_SUPABASE ? studentUsersRepository.ensureSchema() : ensureContentFile();
    boot.then(() => {
      server = app.listen(port, () => {
        console.log(`NexaSphere server listening on http://localhost:${port}`);
      });
    });
  } else {
    loadPersistedPushSubscriptions();
    server = app.listen(port, () => {
      console.log(`NexaSphere server listening on http://localhost:${port}`);
    });
    initializeSocketIO(server);
  }
}

export default app;
