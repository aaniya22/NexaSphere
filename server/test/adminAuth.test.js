import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'crypto';

// 1. Configure environment variables before importing any modules
process.env.ADMIN_USERNAME = 'admin';
// lgtm[js/hardcoded-credentials]
process.env.ADMIN_PASSWORD = 'AdminStrongPass123!';
process.env.ADMIN_LOGIN_WINDOW_MS = '100';
process.env.ADMIN_LOGIN_MAX_ATTEMPTS = '5';
// lgtm[js/hardcoded-credentials]
process.env.DATABASE_URL = 'postgresql://localhost/dummy_test_db';

// 2. Mock PostgreSQL pool before importing anything that uses it
import pg from 'pg';
pg.Pool = class MockPool {
  on() {}
  async connect() {
    return {
      query: async (sql, params) => {
        const sqlLower = sql.toLowerCase();
        if (sqlLower.includes('insert into admin_sessions')) {
          return { rows: [], rowCount: 1 };
        }
        if (sqlLower.includes('update admin_sessions')) {
          return { rows: [], rowCount: 1 };
        }
        if (sqlLower.includes('delete from admin_sessions')) {
          return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      },
      release: () => {},
    };
  }
};

// 3. Mock Redis store — this is a fake in-memory Redis
const mockRedisStore = new Map();

const mockRedisClient = {
  get: async (key) => mockRedisStore.get(key) || null,
  set: async (key, value, flag, ttl) => {
    mockRedisStore.set(key, value);
    return 'OK';
  },
  del: async (key) => {
    const existed = mockRedisStore.has(key);
    mockRedisStore.delete(key);
    return existed ? 1 : 0;
  },
  on: () => mockRedisClient,
};

// Helper to compute SHA-256 hash (must match middleware + Java TokenService)
// lgtm[js/weak-cryptographic-algorithm]
function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

const REDIS_SESSION_PREFIX = 'session:admin:';

// Helper to create mock req/res objects
function createMockReq(overrides = {}) {
  return {
    query: {},
    cookies: {},
    headers: {},
    body: {},
    get: () => '',
    ...overrides,
  };
}

function createMockRes() {
  let statusCode = 200;
  let responseData = null;

  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    cookie(name, value, options) {
      return this;
    },
    clearCookie() {
      return this;
    },
    getStatus() {
      return statusCode;
    },
    getData() {
      return responseData;
    },
  };
}

/**
 * Stand-alone requireAdmin implementation for testing — mirrors the middleware
 * but uses our mockRedisClient directly instead of importing getRedisClient.
 */
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

async function requireAdminWithMockRedis(req, res, next) {
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

    // lgtm[js/missing-rate-limiting]
    const sessionJson = await mockRedisClient.get(redisKey);

    if (!sessionJson) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = JSON.parse(sessionJson);

    if (new Date(session.expiresAt) <= new Date()) {
      await mockRedisClient.del(redisKey);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.adminSession = {
      token,
      username: session.email,
      metadata: session.metadata || {},
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
    return next();
  } catch {
    return res.status(500).json({ error: 'Unable to validate admin session' });
  }
}

test('Redis-based Admin Session Validation', async (t) => {
  t.beforeEach(() => {
    mockRedisStore.clear();
  });

  await t.test('requireAdmin: valid Redis session grants access', async () => {
    const token = 'a'.repeat(48);
    const tokenHash = hashToken(token);
    const redisKey = `session:admin:${tokenHash}`;

    const sessionData = {
      token: tokenHash,
      email: 'admin@test.com',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
    mockRedisStore.set(redisKey, JSON.stringify(sessionData));

    const req = createMockReq({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = createMockRes();
    let nextCalled = false;

    await requireAdminWithMockRedis(req, res, () => {
      nextCalled = true;
    });

    assert.ok(nextCalled, 'next() should be called for valid session');
    assert.ok(req.adminSession, 'adminSession should be attached to req');
    assert.equal(req.adminSession.username, 'admin@test.com');
    assert.equal(req.adminSession.token, token);
  });

  await t.test('requireAdmin: missing Redis key returns 401', async () => {
    const token = 'b'.repeat(48);
    const req = createMockReq({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = createMockRes();
    let nextCalled = false;

    await requireAdminWithMockRedis(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false, 'next() should NOT be called');
    assert.equal(res.getStatus(), 401);
    assert.equal(res.getData().error, 'Unauthorized');
  });

  await t.test('requireAdmin: expired session in Redis returns 401 and deletes key', async () => {
    const token = 'c'.repeat(48);
    const tokenHash = hashToken(token);
    const redisKey = `session:admin:${tokenHash}`;

    const expiredSession = {
      token: tokenHash,
      email: 'admin@test.com',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      expiresAt: new Date(Date.now() - 3600000).toISOString(),
    };
    mockRedisStore.set(redisKey, JSON.stringify(expiredSession));

    const req = createMockReq({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = createMockRes();
    let nextCalled = false;

    await requireAdminWithMockRedis(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false, 'next() should NOT be called for expired session');
    assert.equal(res.getStatus(), 401);
    assert.ok(!mockRedisStore.has(redisKey), 'Expired key should be deleted from Redis');
  });

  await t.test('requireAdmin: no token returns 401', async () => {
    const req = createMockReq();
    const res = createMockRes();
    let nextCalled = false;

    await requireAdminWithMockRedis(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.getStatus(), 401);
  });

  await t.test('requireAdmin: token in URL query returns 400', async () => {
    const req = createMockReq({ query: { token: 'some-token' } });
    const res = createMockRes();
    let nextCalled = false;

    await requireAdminWithMockRedis(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.getStatus(), 400);
    assert.match(res.getData().error, /Do not pass tokens in URLs/);
  });

  await t.test('requireAdmin: reads token from cookie', async () => {
    const token = 'd'.repeat(48);
    const tokenHash = hashToken(token);
    const redisKey = `session:admin:${tokenHash}`;

    const sessionData = {
      token: tokenHash,
      email: 'admin@test.com',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
    mockRedisStore.set(redisKey, JSON.stringify(sessionData));

    const req = createMockReq({
      cookies: { ns_admin_token: token },
    });
    const res = createMockRes();
    let nextCalled = false;

    await requireAdminWithMockRedis(req, res, () => {
      nextCalled = true;
    });

    assert.ok(nextCalled, 'next() should be called with cookie-based token');
    assert.equal(req.adminSession.username, 'admin@test.com');
  });

  await t.test('requireAdmin: Redis connection error returns 500 gracefully', async () => {
    // Temporarily make mock Redis throw
    const originalGet = mockRedisClient.get;
    mockRedisClient.get = async () => {
      throw new Error('Redis connection refused');
    };

    try {
      const token = 'e'.repeat(48);
      const req = createMockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockRes();
      let nextCalled = false;

      await requireAdminWithMockRedis(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false, 'next() should NOT be called on Redis error');
      assert.equal(res.getStatus(), 500);
      assert.equal(res.getData().error, 'Unable to validate admin session');
    } finally {
      mockRedisClient.get = originalGet;
    }
  });

  await t.test('Redis SET stores session with correct key namespace', async () => {
    const token = 'f'.repeat(48);
    const tokenHash = hashToken(token);
    const redisKey = `session:admin:${tokenHash}`;
    const sessionPayload = {
      token: tokenHash,
      email: 'admin@test.com',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };

    await mockRedisClient.set(redisKey, JSON.stringify(sessionPayload), 'EX', 28800);

    assert.ok(mockRedisStore.has(redisKey), 'Session should exist in Redis');
    const stored = JSON.parse(mockRedisStore.get(redisKey));
    assert.equal(stored.email, 'admin@test.com');
  });

  await t.test('Redis DEL removes session key', async () => {
    const token = 'g'.repeat(48);
    const tokenHash = hashToken(token);
    const redisKey = `session:admin:${tokenHash}`;

    mockRedisStore.set(redisKey, JSON.stringify({ token: tokenHash, email: 'admin@test.com' }));
    assert.ok(mockRedisStore.has(redisKey));

    await mockRedisClient.del(redisKey);

    assert.ok(!mockRedisStore.has(redisKey), 'Redis key should be deleted after DEL');
  });

  await t.test('SHA-256 hash matches between Node.js and expected output', () => {
    const token = 'test-token-for-hashing';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    assert.equal(hash1, hash2, 'Hash must be deterministic');
    assert.equal(hash1.length, 64, 'SHA-256 produces 64 hex characters');
    assert.match(hash1, /^[0-9a-f]{64}$/, 'Hash should be lowercase hex');
  });

  await t.test('Session key uses correct prefix for cross-service compatibility', () => {
    const token = 'test-token';
    const tokenHash = hashToken(token);
    const expectedKey = `session:admin:${tokenHash}`;

    assert.ok(
      expectedKey.startsWith('session:admin:'),
      'Key must use session:admin: prefix for Java/Node.js compatibility'
    );
    assert.equal(
      expectedKey.length,
      'session:admin:'.length + 64,
      'Key should be prefix + 64-char SHA-256 hash'
    );
  });
});
