import {
  createAdminSession,
  getAdminSession,
  listAdminSessions,
  revokeAdminSession,
  revokeAdminSessionById,
  revokeOtherAdminSessions,
  startAdminSessionCleanup,
} from '../repositories/adminSessionsRepository.js';
import {
  assessSuspiciousLogin,
  describeDevice,
  describeLocation,
  enableAdminTwoFactor,
  getOrCreateAdminSecurityAccount,
  listAdminLoginHistory,
  recordAdminLoginAttempt,
  verifyAndConsumeBackupCode,
} from '../repositories/adminSecurityRepository.js';
import {
  buildOtpAuthUrl,
  generateBackupCodes,
  generateTotpSecret,
  verifyTotpCode,
} from '../utils/adminTotp.js';
import { getRedisClient } from '../utils/redis.js';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { getScopesForRole } from '../config/rbac.js';

// lgtm[js/weak-cryptographic-algorithm]
function safeEqual(a, b) {
  if (!a || !b) return false;
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();

  return crypto.timingSafeEqual(hashA, hashB);
}

let adminUsers = [];
try {
  if (process.env.ADMIN_USERS_JSON) {
    adminUsers = JSON.parse(process.env.ADMIN_USERS_JSON);
  } else {
    adminUsers = [
      {
        username: requiredEnv('ADMIN_USERNAME'),
        password: requiredStrongPassword('ADMIN_PASSWORD'),
        role: 'SuperAdmin',
      },
    ];
  }
} catch (err) {
  console.error('Failed to parse ADMIN_USERS_JSON', err);
  process.exit(1);
}
const LOGIN_WINDOW_MS = parsePositiveInteger(process.env.ADMIN_LOGIN_WINDOW_MS, 15 * 60 * 1000);
const LOGIN_MAX_ATTEMPTS = parsePositiveInteger(process.env.ADMIN_LOGIN_MAX_ATTEMPTS, 5);
const LOGIN_MAX_TRACKED_IPS = parsePositiveInteger(process.env.ADMIN_LOGIN_MAX_TRACKED_IPS, 10000);
const LOGIN_CLEANUP_INTERVAL_MS = parsePositiveInteger(
  process.env.ADMIN_LOGIN_CLEANUP_INTERVAL_MS,
  15 * 60 * 1000
);

const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours — must match Java TokenService.SESSION_TTL
const REDIS_SESSION_PREFIX = 'session:admin:'; // Shared namespace with Java backend

const loginAttemptsByIp = new Map();
const pendingTwoFactorSetups = new Map();
const pendingTwoFactorChallenges = new Map();
const PENDING_2FA_TTL_MS = 10 * 60 * 1000;

// Periodic background cleanup of expired IPs to prevent memory exhaustion
const cleanupAttemptsTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttemptsByIp.entries()) {
    if (entry.expiresAt <= now) {
      loginAttemptsByIp.delete(ip);
    }
  }
}, LOGIN_CLEANUP_INTERVAL_MS);

// Allow Node process to exit cleanly if this timer is active
if (cleanupAttemptsTimer && typeof cleanupAttemptsTimer.unref === 'function') {
  cleanupAttemptsTimer.unref();
}

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function requiredStrongPassword(name) {
  const value = requiredEnv(name);
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

function getClientIp(req) {
  const ip = String(req.ip || 'unknown').trim();
  // Truncate to maximum 128 characters to prevent extremely large malicious headers from causing memory exhaustion
  return ip.slice(0, 128);
}

function recordLoginAttempt(ip) {
  const now = Date.now();

  // Enforce size-based bound to protect against memory exhaustion via distributed/IP-rotating brute force
  if (loginAttemptsByIp.size >= LOGIN_MAX_TRACKED_IPS && !loginAttemptsByIp.has(ip)) {
    // 1. Evict any expired entries
    for (const [key, entry] of loginAttemptsByIp.entries()) {
      if (entry.expiresAt <= now) {
        loginAttemptsByIp.delete(key);
      }
    }

    // 2. If still full, evict the oldest tracked entry (FIFO)
if (loginAttemptsByIp.size >= LOGIN_MAX_TRACKED_IPS) {
  const oldestKey = loginAttemptsByIp.keys().next().value;

  if (oldestKey) {
    loginAttemptsByIp.delete(oldestKey);
  }
}
}

  const existing = loginAttemptsByIp.get(ip);
  const attempts = existing && existing.expiresAt > now ? existing.attempts : 0;
  const entry = {
    attempts: attempts + 1,
    expiresAt: now + LOGIN_WINDOW_MS,
  };
  loginAttemptsByIp.set(ip, entry);
  return entry;
}

function getLoginAttemptState(ip) {
  const state = loginAttemptsByIp.get(ip);
  if (!state) return null;
  if (state.expiresAt <= Date.now()) {
    loginAttemptsByIp.delete(ip);
    return null;
  }
  return state;
}

function clearLoginAttempts(ip) {
  loginAttemptsByIp.delete(ip);
}

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getLoginUsername(body = {}) {
  return normalizeUsername(body.username || body.email);
}

function createPendingToken(store, payload) {
  const token = crypto.randomBytes(32).toString('hex');
  store.set(token, {
    ...payload,
    expiresAt: Date.now() + PENDING_2FA_TTL_MS,
  });
  return token;
}

function consumePendingToken(store, token) {
  const pending = store.get(token);
  store.delete(token);
  if (!pending || pending.expiresAt <= Date.now()) return null;
  return pending;
}

function prunePendingTokens(store) {
  const now = Date.now();
  for (const [token, pending] of store.entries()) {
    if (pending.expiresAt <= now) store.delete(token);
  }
}

/**
 * Compute the SHA-256 hash of a token string.
 * This MUST match the Java TokenService.hashToken() algorithm exactly
 * so both services generate identical Redis keys for the same token.
 */
// lgtm[js/weak-cryptographic-algorithm]
function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

startAdminSessionCleanup();

function parseBearer(authHeader = '') {
  if (!authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice(7).trim();
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) return value;
  }
  return null;
}

/**
 * Validates admin tokens by querying the shared Redis session store directly.
 * This eliminates the need for cross-service HTTP calls to the Java backend.
 * Both Java and Node.js write sessions under the same Redis namespace:
 * session:admin:{sha256(token)}
 */
async function requireAdmin(req, res, next) {
  try {
    if (req.query.token) {
      return res.status(400).json({ error: 'Do not pass tokens in URLs.' });
    }

    const token =
      req.cookies?.ns_admin_token ||
      getCookie(req, 'ns_admin_token') ||
      parseBearer(req.headers.authorization || '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tokenHash = hashToken(token);
    const redisKey = REDIS_SESSION_PREFIX + tokenHash;

    const redis = getRedisClient();
    let session = null;
    if (redis) {
      // lgtm[js/missing-rate-limiting]
      const sessionJson = await redis.get(redisKey);
      if (sessionJson) session = JSON.parse(sessionJson);
    }

    if (!session) {
      session = await getAdminSession(token);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    // CRITICAL SECURITY FIX: Use constant-time comparison to prevent timing side-channel attacks on token validation
    if (!safeEqual(tokenHash, session.token)) {
      return res.status(401).json({ error: 'Unauthorized: Token signature mismatch' });
    }

    // Double-check expiry even though Redis TTL should auto-evict
    if (new Date(session.expiresAt) <= new Date()) {
      await redis?.del(redisKey);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.adminSession = {
      token,
      username: session.email || session.username,
      metadata: session.metadata || {},
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
    return next();
  } catch {
    return res.status(500).json({ error: 'Unable to validate admin session' });
  }
}

function requireRole(allowedRoles) {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new Error('requireRole must be initialized with a non-empty array of allowed roles');
  }

  return async (req, res, next) => {
    // Ensure the request is already authenticated (e.g. by requireAdmin)
    if (!req.adminSession) {
      return res.status(401).json({ error: 'Unauthorized: No session found' });
    }

    // Assume role is attached to the session metadata, defaulting to 'user' to prevent privilege escalation
    const userRole = req.adminSession.metadata?.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }

    next();
  };
}

function requireScope(requiredScope) {
  return async (req, res, next) => {
    // First, ensure they are authenticated
    await requireAdmin(req, res, (err) => {
      if (err) return next(err);

      if (!req.adminSession) {
        // Response already sent by requireAdmin
        return;
      }

      const sessionScopes = req.adminSession?.metadata?.scopes || [];
      if (!sessionScopes.includes(requiredScope)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      next();
    });
  };
}

async function login(req, res) {
  try {
    prunePendingTokens(pendingTwoFactorSetups);
    prunePendingTokens(pendingTwoFactorChallenges);

    const u = getLoginUsername(req.body);
    const p = String(req.body?.password || '');
    const ip = getClientIp(req);
    const userAgent = req.get('user-agent') || '';

    const state = getLoginAttemptState(ip);
    if (state && state.attempts > LOGIN_MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many login attempts. Please wait and try again.' });
    }

    const matchedUser = adminUsers.find(
      (user) => safeEqual(u, user.username) && safeEqual(p, user.password)
    );

    if (!matchedUser) {
      recordLoginAttempt(ip);
      await recordAdminLoginAttempt({
        username: u || 'unknown',
        ipAddress: ip,
        userAgent,
        success: false,
        suspicious: false,
        reason: 'invalid_credentials',
      }).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    clearLoginAttempts(ip);

    const role = matchedUser.role || 'SuperAdmin';
    const scopes = getScopesForRole(role);
    const securityAccount = await getOrCreateAdminSecurityAccount(u, matchedUser.email || u);
    const suspicious = await assessSuspiciousLogin({ username: u, ipAddress: ip, userAgent }).catch(
      () => ({ suspicious: false, reason: null })
    );

    if (!securityAccount?.two_factor_enabled) {
      const secret = generateTotpSecret();
      const backupCodes = generateBackupCodes(8);
      const otpAuthUrl = buildOtpAuthUrl({ username: u, secret });
      const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);
      const setupToken = createPendingToken(pendingTwoFactorSetups, {
        username: u,
        role,
        scopes,
        secret,
        backupCodes,
        ip,
        userAgent,
        suspicious,
      });

      return res.status(202).json({
        requiresTwoFactorSetup: true,
        setupToken,
        qrCodeDataUrl,
        otpAuthUrl,
        secret,
        backupCodes,
        graceEndsAt: securityAccount?.grace_ends_at,
      });
    }

    const challengeToken = createPendingToken(pendingTwoFactorChallenges, {
      username: u,
      role,
      scopes,
      secret: securityAccount.totp_secret,
      ip,
      userAgent,
      suspicious,
    });

    return res.status(202).json({
      requiresTwoFactor: true,
      challengeToken,
      suspicious: suspicious.suspicious,
      reason: suspicious.reason,
    });
  } catch (error) {
    console.error('[Admin Login] Failed before 2FA challenge:', error);
    return res.status(500).json({ error: 'Unable to create admin session' });
  }
}

async function completeAdminLogin({ res, username, role, scopes, ip, userAgent, suspicious }) {
  // Create session in PostgreSQL (audit trail + persistence)
  const session = await createAdminSession({
    username,
    metadata: {
      userAgent,
      ip,
      location: describeLocation(ip),
      device: describeDevice(userAgent),
      role,
      scopes,
      twoFactorVerified: true,
      suspiciousLogin: !!suspicious?.suspicious,
      suspiciousReason: suspicious?.reason || null,
    },
  });

  // Write session to shared Redis for cross-service validation
  try {
    const tokenHash = hashToken(session.token);
    const redisKey = REDIS_SESSION_PREFIX + tokenHash;
    const redisPayload = JSON.stringify({
      token: tokenHash,
      email: username,
      username,
      metadata: session.metadata || { userAgent, ip, role, scopes },
      createdAt: new Date().toISOString(),
      expiresAt: session.expiresAt,
    });
    const redis = getRedisClient();
    if (redis) await redis.set(redisKey, redisPayload, 'EX', SESSION_TTL_SECONDS);
  } catch (redisErr) {
    // Log but don't fail the login — PostgreSQL session is the fallback
    console.error('[Admin Login] Failed to write session to Redis:', redisErr);
  }

  res.cookie('ns_admin_token', session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(session.expiresAt),
  });

  await recordAdminLoginAttempt({
    username,
    ipAddress: ip,
    userAgent,
    success: true,
    suspicious: !!suspicious?.suspicious,
    reason: suspicious?.reason,
  }).catch(() => {});

  return res.json({
    username,
    email: username,
    expiresAt: session.expiresAt,
    role,
    scopes,
    suspicious: !!suspicious?.suspicious,
  });
}

async function verifyTwoFactor(req, res) {
  try {
    const { challengeToken, code } = req.body || {};
    const pending = consumePendingToken(pendingTwoFactorChallenges, challengeToken);
    if (!pending) {
      return res.status(400).json({ error: 'Two-factor challenge expired. Please sign in again.' });
    }

    const validTotp = verifyTotpCode(pending.secret, code);
    const validBackup = validTotp
      ? false
      : await verifyAndConsumeBackupCode(pending.username, code).catch(() => false);

    if (!validTotp && !validBackup) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    return completeAdminLogin({ res, ...pending });
  } catch {
    return res.status(500).json({ error: 'Unable to create admin session' });
  }
}

async function verifyTwoFactorSetup(req, res) {
  try {
    const { setupToken, code } = req.body || {};
    const pending = consumePendingToken(pendingTwoFactorSetups, setupToken);
    if (!pending) {
      return res.status(400).json({ error: 'Two-factor setup expired. Please sign in again.' });
    }

    if (!verifyTotpCode(pending.secret, code)) {
      return res.status(401).json({ error: 'Invalid authenticator code' });
    }

    await enableAdminTwoFactor({
      username: pending.username,
      secret: pending.secret,
      backupCodes: pending.backupCodes,
    });

    return completeAdminLogin({ res, ...pending });
  } catch (error) {
    console.error('[Admin 2FA] Setup verification failed:', error);
    return res.status(500).json({ error: 'Unable to verify two-factor setup' });
  }
}

async function logout(req, res) {
  try {
    const token = req.adminSession?.token;
    if (token) {
      // Revoke from PostgreSQL audit store
      await revokeAdminSession(token);

      // Delete from shared Redis immediately
      try {
        const tokenHash = hashToken(token);
        const redisKey = REDIS_SESSION_PREFIX + tokenHash;
        const redis = getRedisClient();
        await redis?.del(redisKey);
      } catch (redisErr) {
        console.error('[Admin Logout] Failed to delete session from Redis:', redisErr);
      }
    } else {
      // In case logout is called without authentication
      return res.status(401).json({ error: 'No active session to revoke' });
    }

    res.clearCookie('ns_admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Unable to revoke admin session' });
  }
}

async function getSecurityOverview(req, res) {
  try {
    const username = req.adminSession.username;
    const currentSessionId = hashToken(req.adminSession.token).slice(0, 16);
    const sessions = await listAdminSessions(username);
    const loginHistory = await listAdminLoginHistory(username, 10);

    return res.json({
      sessions: sessions.map((session) => ({
        ...session,
        current: session.id === currentSessionId,
      })),
      loginHistory,
      sessionTimeoutMinutes: Math.round(
        (Number(process.env.ADMIN_SESSION_IDLE_TIMEOUT_MS) || 30 * 60 * 1000) / 60000
      ),
    });
  } catch {
    return res.status(500).json({ error: 'Unable to load security overview' });
  }
}

async function revokeSession(req, res) {
  try {
    const sessionId = String(req.params.sessionId || '');
    const currentSessionId = hashToken(req.adminSession.token).slice(0, 16);
    if (sessionId === currentSessionId) {
      return res.status(400).json({ error: 'Use logout to end the current session.' });
    }

    const revokedTokenHash = await revokeAdminSessionById(req.adminSession.username, sessionId);
    if (revokedTokenHash) {
      const redis = getRedisClient();
      await redis?.del(REDIS_SESSION_PREFIX + revokedTokenHash);
    }

    return res.json({ revoked: !!revokedTokenHash });
  } catch {
    return res.status(500).json({ error: 'Unable to revoke session' });
  }
}

async function logoutOtherSessions(req, res) {
  try {
    const result = await revokeOtherAdminSessions(
      req.adminSession.username,
      req.adminSession.token
    );
    const redis = getRedisClient();
    if (redis) {
      await Promise.all(
        result.tokenHashes.map((tokenHash) => redis.del(REDIS_SESSION_PREFIX + tokenHash))
      );
    }

    return res.json({ revoked: result.count });
  } catch {
    return res.status(500).json({ error: 'Unable to logout other sessions' });
  }
}

export const adminAuthMiddleware = {
  login,
  verifyTwoFactor,
  verifyTwoFactorSetup,
  logout,
  getSecurityOverview,
  revokeSession,
  logoutOtherSessions,
  requireAdmin,
  requireRole,
  requireScope,
  // Private test exports for auditing & validation
  _getLoginAttemptsMapSize: () => loginAttemptsByIp.size,
  _clearAllLoginAttempts: () => loginAttemptsByIp.clear(),
  _cleanupExpiredAttempts: () => {
    const now = Date.now();
    for (const [ip, entry] of loginAttemptsByIp.entries()) {
      if (entry.expiresAt <= now) {
        loginAttemptsByIp.delete(ip);
      }
    }
  },
  _getAttemptsTimer: () => cleanupAttemptsTimer,
  _safeEqual: safeEqual,
};

export { login, logout, requireAdmin, requireRole, requireScope };

// DCO sign-off commit
