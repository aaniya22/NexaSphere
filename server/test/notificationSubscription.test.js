import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';

process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.ADMIN_EVENT_PASSWORD = 'StrongEventPassword123!';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'secret_super_long_secret_key_that_is_safe_and_long_enough_for_256bit';
process.env.PORT = '0';

import { setWithDbOverride } from '../repositories/db.js';
const { adminAuthMiddleware } = await import('../middleware/adminAuthMiddleware.js');

const mockClient = {
  query: async (sql, params) => {
    const sqlLower = sql.toLowerCase();
    if (sqlLower.includes('select token_hash')) {
      return {
        rows: [
          {
            token_hash: 'mock_hash',
            username: 'admin',
            metadata: { role: 'SuperAdmin', scopes: ['events:read', 'events:write'] },
            created_at: new Date(),
            last_seen_at: new Date(),
            expires_at: new Date(Date.now() + 3600000),
          },
        ],
        rowCount: 1,
      };
    }
    return { rows: [], rowCount: 1 };
  },
  release: () => {},
};

setWithDbOverride(async (fn) => {
  return await fn(mockClient);
});

// Mock requireAdmin to bypass Redis during tests
adminAuthMiddleware.requireAdmin = (req, res, next) => {
  if (req.headers.authorization === 'Bearer mock-token') {
    req.adminSession = { username: 'admin' };
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};
test('Push Subscription Validation and Memory Safety', async (t) => {
  setWithDbOverride(async (fn) => {
    const mockClient = {
      query: async (sql, params) => {
        if (sql.includes('admin_sessions')) {
          return {
            rows: [
              {
                username: 'admin',
                metadata: { role: 'SuperAdmin' },
                created_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 3600000).toISOString(),
              },
            ],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 1 };
      },
    };
    return fn(mockClient);
  });

  const { default: app } = await import('../index.js');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const sendRequest = (path, body, extraHeaders = {}) => {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
          ...extraHeaders,
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const body = JSON.parse(data || '{}');
          if (res.statusCode === 500) console.error('500 ERROR:', body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      });

      req.write(JSON.stringify(body));
      req.end();
    });
  };

  const validSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
    keys: {
      p256dh: 'BNcRdreALRFG-OydA...',
      auth: 'A_test_auth_key',
    },
  };

  try {
    // Perform login to get admin cookie
    let adminCookie = '';
    const loginRes = await sendRequest('/api/admin/login', {
      username: 'admin',
      password: 'StrongPassword123!',
    });

    if (loginRes.headers && loginRes.headers['set-cookie']) {
      adminCookie = loginRes.headers['set-cookie'][0].split(';')[0];
    }

    await t.test('1. Valid subscription is accepted', async () => {
      const res = await sendRequest(
        '/api/notifications/subscribe',
        {
          subscription: validSubscription,
        },
        { Cookie: adminCookie }
      );
      assert.equal(res.status, 200, 'Expected 200 OK');
      assert.equal(res.body.success, true);
    });

    await t.test('2. Missing endpoint fails validation', async () => {
      const res = await sendRequest(
        '/api/notifications/subscribe',
        {
          subscription: { keys: validSubscription.keys },
        },
        { Cookie: adminCookie }
      );
      assert.equal(res.status, 400, 'Expected 400 Bad Request');
      assert.ok(res.body.error.includes('Invalid subscription payload'));
    });

    await t.test('3. Oversized string payload is rejected', async () => {
      const massiveEndpoint = 'https://fcm.googleapis.com/' + 'a'.repeat(3000);
      const res = await sendRequest(
        '/api/notifications/subscribe',
        {
          subscription: { endpoint: massiveEndpoint, keys: validSubscription.keys },
        },
        { Cookie: adminCookie }
      );
      assert.equal(res.status, 400, 'Expected 400 Bad Request');
    });

    await t.test('4. Unexpected structure fails validation', async () => {
      const res = await sendRequest(
        '/api/notifications/subscribe',
        {
          subscription: 'Not an object, just a string!',
        },
        { Cookie: adminCookie }
      );
      assert.equal(res.status, 400, 'Expected 400 Bad Request');
    });

    await t.test('5. Valid unsubscription is accepted', async () => {
      const res = await sendRequest(
        '/api/notifications/unsubscribe',
        {
          subscription: validSubscription,
        },
        { Cookie: adminCookie }
      );
      assert.equal(res.status, 200, 'Expected 200 OK');
    });
  } finally {
    setWithDbOverride(null);
    server.close();
  }
});
