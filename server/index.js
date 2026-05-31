import { env } from './config/env.js';
import 'dotenv/config';
import helmet from 'helmet';
import express from 'express';
import { EventEmitter } from 'events';
import cors from 'cors';
import morgan from 'morgan';
import { google } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { sendWelcomeVerificationEmail } from './services/emailService.js';
import { ZodError } from 'zod';
import { normalizeFormSubmission } from './validators/formSchemas.js';
import { adminAuthMiddleware } from './middleware/adminAuthMiddleware.js';
import analyticsRouter from './routes/analytics.js';
import { initializeSocketIO, emitToRoom, getRoom } from './config/socket.js';
import adminStreamRouter from './routes/adminStream.js';
import { broadcastSSEEvent } from './services/sseService.js';
import documentationRouter from './routes/documentation.js';
import monitoringRouter from './routes/monitoring.js';
import { performanceMonitor } from './middleware/performanceMonitor.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { initializeSentry, addSentryErrorHandler } from './utils/sentry.js';
import {
  apiRateLimiter,
  authRateLimiter,
  formRateLimiter,
  notificationRateLimiter,
  activityAuthRateLimiter,
  portfolioRateLimiter,
  validateLimiters,
} from './middleware/rateLimiter.js';
import { portfolioRepository } from './repositories/portfolioRepository.js';
import { Mutex } from 'async-mutex';
import { getPublicAppUrl } from './utils/publicAppUrl.js';
import * as eventsController from './controllers/eventsController.js';
import * as activityEventsController from './controllers/activityEventsController.js';
import * as coreTeamController from './controllers/coreTeamController.js';
import * as formsController from './controllers/formsController.js';
import { eventsService } from './services/eventsService.js';
import { coreTeamService } from './services/coreTeamService.js';
import notificationsService from './services/notificationsService.js';

// Fail fast on startup if any rate limiter failed to export correctly.
validateLimiters();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_FILE = path.join(__dirname, 'data', 'content.json');

const app = express();
initializeSentry(app);

if (!process.env.CORS_ORIGIN) {
  throw new Error('CORS_ORIGIN environment variable must be set.');
}

const allowedOrigins = process.env.CORS_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json({ limit: '512kb' }));
app.use(morgan('combined'));
app.use(performanceMonitor);

// Global API rate limiter — protects all /api routes from request flooding
// Previously missing: the middleware was correctly defined in rateLimiter.js
// but never mounted, leaving every API endpoint without baseline protection.
app.use('/api', apiRateLimiter);

const adminEvents = new EventEmitter();

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const { method, path } = req;

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.statusCode;
    const message = `[${method}] ${path} → ${status} (${Math.round(duration)}ms)`;

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

// Mount monitoring + API documentation routes (previously implemented but never registered).
app.use('/api/monitoring', monitoringRouter);
app.use('/api', documentationRouter);

const adminAuth = adminAuthMiddleware.requireAdmin;
adminEvents.on('CORE_TEAM_MEMBER_ADDED', (event) =>
  console.log(`[EVENT] CORE_TEAM_MEMBER_ADDED:`, event)
);
adminEvents.on('CORE_TEAM_MEMBER_REMOVED', (event) =>
  console.log(`[EVENT] CORE_TEAM_MEMBER_REMOVED:`, event)
);

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

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

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

// Enforce admin event password format validation if it's set
const ADMIN_EVENT_PASSWORD = requiredStrongPassword('ADMIN_EVENT_PASSWORD');

getPublicAppUrl();

function normalizePrivateKey(k) {
  return k.includes('\\n') ? k.replace(/\\n/g, '\n') : k;
}

async function ensureContentFile() {
  const dir = path.dirname(CONTENT_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(CONTENT_FILE);
  } catch {
    await fs.writeFile(CONTENT_FILE, JSON.stringify(defaultContent, null, 2), 'utf8');
  }
}
const fileMutex = new Mutex();

export async function runWithFileLock(callback) {
  return await fileMutex.runExclusive(callback);
}

async function readContent() {
  await ensureContentFile();
  const raw = await fs.readFile(CONTENT_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeContent(content) {
  await ensureContentFile();
  await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2), 'utf8');
}

let contentLock = Promise.resolve();

function withContentLock(fn) {
  let release;
  const next = new Promise((resolve) => {
    release = resolve;
  });
  const current = contentLock;
  contentLock = next;
  return current.then(() => fn()).finally(() => release());
}

export async function supabaseRequest(pathname, { method = 'GET', body } = {}) {
  if (!HAS_SUPABASE) throw new Error('Supabase is not configured');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'GET' ? 'count=exact' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error (${res.status}): ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// Paginated variant: appends LIMIT/OFFSET to a PostgREST GET request and reads
// the total row count from the Content-Range response header (sent when
// Prefer: count=exact is set). Returns { rows, total } instead of a bare array.
async function supabasePaginatedRequest(pathname, page, limit) {
  if (!HAS_SUPABASE) throw new Error('Supabase is not configured');
  const offset = (page - 1) * limit;
  const separator = pathname.includes('?') ? '&' : '?';
  const url = `${SUPABASE_URL}/rest/v1/${pathname}${separator}limit=${limit}&offset=${offset}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'count=exact',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error (${res.status}): ${text}`);
  }
  const text = await res.text();
  const rows = text ? JSON.parse(text) : [];
  // Content-Range format from PostgREST: "0-19/150" or "*/0" when empty
  const contentRange = res.headers.get('content-range') || '';
  const totalMatch = contentRange.match(/\/(\d+)$/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : rows.length;
  return { rows, total };
}

// Parses ?page and ?limit from a request query object, clamps to safe bounds,
// and returns normalised integers. Defaults: page=1, limit=20, cap=100.
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit };
}

function toSafeString(value, max = 4000) {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

function validateWhatsApp(str) {
  const v = String(str || '').trim();
  if (!/^\d{10}$/.test(v)) throw new Error('WhatsApp must be exactly 10 digits');
  return v;
}

function validateSection(str) {
  const v = String(str || '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z]$/.test(v)) throw new Error('Section must be a single letter (A-Z)');
  return v;
}

function sanitizeEvent(input = {}) {
  const status = input.status === 'upcoming' ? 'upcoming' : 'completed';
  const tags = Array.isArray(input.tags)
    ? input.tags
        .map((t) => toSafeString(t, 40))
        .filter(Boolean)
        .slice(0, 12)
    : String(input.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12);

  return {
    id:
      toSafeString(input.id || input.shortName || input.name, 80)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `event-${Date.now()}`,
    name: toSafeString(input.name, 120),
    shortName: toSafeString(input.shortName || input.name, 60),
    date: toSafeString(input.date, 80),
    description: toSafeString(input.description, 1200),
    status,
    icon: toSafeString(input.icon || 'Pin', 32),
    tags,
  };
}

function normalizePhone(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

async function listEventsStore({ page = 1, limit = 20 } = {}) {
  if (HAS_SUPABASE) {
    const { rows, total } = await supabasePaginatedRequest(
      'events?select=*&order=created_at.desc',
      page,
      limit
    );
    return {
      events: rows.map((r) =>
        sanitizeEventRecord({
          id: r.id,
          name: r.name,
          shortName: r.short_name || r.shortName || r.name,
          date: r.date_text || r.date,
          description: r.description,
          status: r.status,
          icon: r.icon || 'Pin',
          tags: Array.isArray(r.tags) ? r.tags : [],
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })
      ),
      total,
    };
  }
  const content = await readContent();
  const all = (content.events || []).map((event) => sanitizeEventRecord(event));
  const total = all.length;
  const start = (page - 1) * limit;
  return { events: all.slice(start, start + limit), total };
}

function sanitizeEventRecord(event) {
  return event;
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
// Admin Auth Endpoints
app.post('/api/admin/login', authRateLimiter, adminAuthMiddleware.login);
app.post('/api/admin/logout', adminAuthMiddleware.logout);
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
        email = null; // hide personal emails entirely
      }
      return {
        ...m,
        email,
        whatsapp: 'https://chat.whatsapp.com/FhpJEaod2g419jFMfqrhGZ', // official community link
      };
    });
    return res.json({ members });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to load core team' });
  }
});

app.get('/api/content/core-team', async (req, res) => {
  try {
    const rawMembers = await coreTeamService.listMembers();
    const members = (rawMembers || []).map((m) => {
      let email = m.email || null;
      if (email && !email.toLowerCase().endsWith('@glbajajgroup.org')) {
        email = null; // hide personal emails entirely
      }
      return {
        ...m,
        email,
        whatsapp: 'https://chat.whatsapp.com/FhpJEaod2g419jFMfqrhGZ', // official community link
      };
    });
    return res.json({ members });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to load core team' });
  }
});

app.post('/api/content/activity-events/:activityKey', activityAuthRateLimiter, async (req, res) => {
  try {
    const activityKey = toSafeString(req.params.activityKey, 80);
    const body = req.body || {};
    const ip = String(req.ip || req.headers['x-forwarded-for'] || 'unknown')
      .split(',')[0]
      .trim();

    const lockout = checkActivityAuthLockout(ip);
    if (lockout) {
      return res.status(429).json({
        error: 'Too many failed attempts. Please try again later.',
      });
    }

    const auth = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: body.password,
    };
    if (!(await canManageActivityEvent(auth))) {
      recordFailedActivityAuth(ip);
      return res.status(401).json({
        error: 'Unauthorized. Core team details or password did not match.',
      });
    }
    clearActivityAuthAttempts(ip);

    const event = {
      id: `manual-${Date.now()}`,
      name: toSafeString(body.eventName, 120),
      date: toSafeString(body.eventDate, 80),
      tagline: toSafeString(body.eventTagline, 240),
      description: toSafeString(body.eventDescription, 1200),
      status: 'completed',
      createdAt: new Date().toISOString(),
      createdBy: {
        name: toSafeString(body.name, 120),
        email: toSafeString(body.email, 140),
        phone: normalizePhone(body.phone),
      },
    };
    if (!event.name || !event.date || !event.description) {
      return res.status(400).json({ error: 'Event name, date and description are required.' });
    }

    const content = await readContent();
    content.activityEvents = content.activityEvents || {};
    content.activityEvents[activityKey] = content.activityEvents[activityKey] || [];
    content.activityEvents[activityKey].unshift(event);
    await writeContent(content);
    return res.status(201).json({ ok: true, event });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unable to add activity event' });
  }
});

app.delete(
  '/api/content/activity-events/:activityKey/:eventId',
  activityAuthRateLimiter,
  async (req, res) => {
    try {
      const activityKey = toSafeString(req.params.activityKey, 80);
      const eventId = toSafeString(req.params.eventId, 120);
      const body = req.body || {};
      const ip = String(req.ip || req.headers['x-forwarded-for'] || 'unknown')
        .split(',')[0]
        .trim();

      const lockout = checkActivityAuthLockout(ip);
      if (lockout) {
        return res.status(429).json({
          error: 'Too many failed attempts. Please try again later.',
        });
      }

      const auth = {
        name: body.name,
        email: body.email,
        phone: body.phone,
        password: body.password,
      };
      if (!(await canManageActivityEvent(auth))) {
        recordFailedActivityAuth(ip);
        return res.status(401).json({
          error: 'Unauthorized. Core team details or password did not match.',
        });
      }
      clearActivityAuthAttempts(ip);

      const content = await readContent();
      content.activityEvents = content.activityEvents || {};
      const list = content.activityEvents[activityKey] || [];
      const next = list.filter((e) => e.id !== eventId);
      if (next.length === list.length) {
        return res.status(404).json({ error: 'Event not found in manual activity events.' });
      }
      content.activityEvents[activityKey] = next;
      await writeContent(content);
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e?.message || 'Unable to delete activity event' });
    }
  }
);

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
app.post('/api/notifications/subscribe', (req, res) => {
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

app.post('/api/notifications/unsubscribe', (req, res) => {
  try {
    const { subscription } = req.body;
    if (subscription) pushSubscriptions.delete(JSON.stringify(subscription));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/mark-read', adminAuth, notificationRateLimiter, (req, res) => {
  try {
    const { id, userId } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const uid = userId || 'global';
    const ok = notificationsService.markAsRead(uid, id);
    return res.json({ success: ok });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/mark-all-read', adminAuth, notificationRateLimiter, (req, res) => {
  try {
    const { userId } = req.body || {};
    notificationsService.markAllAsRead(userId || 'global');
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications/:id', adminAuth, notificationRateLimiter, (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.query.userId || 'global';
    const removed = notificationsService.removeNotification(userId, id);
    if (!removed) return res.status(404).json({ error: 'Notification not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications', adminAuth, notificationRateLimiter, (req, res) => {
  try {
    const userId = req.query.userId || 'global';
    notificationsService.clearAll(userId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications', adminAuth, notificationRateLimiter, (req, res) => {
  try {
    const { userId, title, message, type, link } = req.body || {};
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }
    const note = notificationsService.addNotification(userId || 'global', {
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

const failedPasskeyAttempts = new Map();

function checkPasskeyLockout(username, ip) {
  const key = `${String(username || '').toLowerCase()}:${ip}`;
  const entry = failedPasskeyAttempts.get(key);
  if (!entry) return null;
  if (Date.now() > entry.lockoutUntil) {
    failedPasskeyAttempts.delete(key);
    return null;
  }
  return entry;
}

function recordFailedPasskeyAttempt(username, ip) {
  const key = `${String(username || '').toLowerCase()}:${ip}`;
  const entry = failedPasskeyAttempts.get(key) || { count: 0, lockoutUntil: 0 };
  entry.count += 1;
  if (entry.count >= 5) {
    entry.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 min lockout
    entry.count = 0;
  }
  failedPasskeyAttempts.set(key, entry);
  return entry;
}

function clearPasskeyAttempts(username, ip) {
  const key = `${String(username || '').toLowerCase()}:${ip}`;
  failedPasskeyAttempts.delete(key);
}

// Server-side notifications API (simple in-memory store)

app.get('/api/notifications', (req, res) => {
  try {
    // If user id provided via query or auth, use that; otherwise global
    const userId = req.query.userId || 'global';
    const list = notificationsService.getNotifications(userId);
    return res.json({ notifications: list });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/portfolio', portfolioRateLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const username = String(body.username || '').trim();
    const passkey = String(body.passkey || '').trim();
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

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

    const saved = await portfolioRepository.createOrUpdate(body);
    return res.json({ ok: true, portfolio: saved });
  } catch (err) {
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
