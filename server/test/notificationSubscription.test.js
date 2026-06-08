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

test('Push Subscription Validation and Memory Safety', async (t) => {
  const { default: app } = await import('../index.js');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const sendRequest = (path, body) => {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: path,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data || '{}') }));
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
    await t.test('1. Valid subscription is accepted', async () => {
      const res = await sendRequest('/api/notifications/subscribe', {
        subscription: validSubscription,
      });
      assert.equal(res.status, 200, 'Expected 200 OK');
      assert.equal(res.body.success, true);
    });

    await t.test('2. Missing endpoint fails validation', async () => {
      const res = await sendRequest('/api/notifications/subscribe', {
        subscription: { keys: validSubscription.keys },
      });
      assert.equal(res.status, 400, 'Expected 400 Bad Request');
      assert.ok(res.body.error.includes('Invalid subscription payload'));
    });

    await t.test('3. Oversized string payload is rejected', async () => {
      const massiveEndpoint = 'https://fcm.googleapis.com/' + 'a'.repeat(3000);
      const res = await sendRequest('/api/notifications/subscribe', {
        subscription: { endpoint: massiveEndpoint, keys: validSubscription.keys },
      });
      assert.equal(res.status, 400, 'Expected 400 Bad Request');
    });

    await t.test('4. Unexpected structure fails validation', async () => {
      const res = await sendRequest('/api/notifications/subscribe', {
        subscription: 'Not an object, just a string!',
      });
      assert.equal(res.status, 400, 'Expected 400 Bad Request');
    });

    await t.test('5. Valid unsubscription is accepted', async () => {
      const res = await sendRequest('/api/notifications/unsubscribe', {
        subscription: validSubscription,
      });
      assert.equal(res.status, 200, 'Expected 200 OK');
    });
  } finally {
    server.close();
  }
});
