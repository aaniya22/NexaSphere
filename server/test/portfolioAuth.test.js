process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.ADMIN_EVENT_PASSWORD = 'StrongEventPassword123!';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'secret_super_long_secret_key_that_is_safe_and_long_enough_for_256bit';
process.env.PORT = '0'; // Avoid EADDRINUSE from index.js starting automatically

import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';
import { portfolioRepository } from '../repositories/portfolioRepository.js';

test('Portfolio Passkey Brute Force Protection (Dual Tracking)', async (t) => {
  // Use a random username to avoid collisions
  const username = `authuser_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const passkey = 'CorrectPasskey123!';

  // Mock repository methods
  const originalVerifyPasskey = portfolioRepository.verifyPasskey;
  const originalCreateOrUpdate = portfolioRepository.createOrUpdate;
  const originalGetByUsername = portfolioRepository.getByUsername;

  portfolioRepository.getByUsername = async (u) => {
    if (u === username) return { username: u };
    return null;
  };

  portfolioRepository.verifyPasskey = async (u, p) => {
    return p === 'CorrectPasskey123!';
  };

  portfolioRepository.createOrUpdate = async (data) => {
    return { ...data, ok: true };
  };

  const { default: app } = await import('../index.js');
  app.set('trust proxy', 1);

  // Since index.js automatically calls app.listen, we shouldn't create a new server.
  // We can just use supertest or raw http directly to the random port it bound to,
  // but we can't easily get the port since index.js doesn't export `server`.
  // Wait! If we create a new server on port 0 it's fine as long as index.js bound to 0 as well.
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  // Helper to make requests with simulated IPs
  const makeAttempt = (ip, attemptPasskey, specificUser = username) => {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/api/portfolio',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip, // We rely on trust proxy = 1 from previous PR
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
      });

      req.write(
        JSON.stringify({ username: specificUser, passkey: attemptPasskey, bio: 'Updated bio' })
      );
      req.end();
    });
  };

  try {
    await t.test('1. Valid passkey update succeeds and resets nothing yet', async () => {
      const res = await makeAttempt('203.0.113.1', passkey);
      assert.equal(res.status, 200, 'Expected 200 OK');
    });

    await t.test('2. Invalid passkey update fails with 401', async () => {
      const res = await makeAttempt('203.0.113.2', 'WrongPasskey456!');
      assert.equal(res.status, 401, 'Expected 401 Unauthorized');
      assert.ok(res.body.error.includes('Incorrect passkey'));
    });

    await t.test('3. Repeated failed attempts trigger IP protection (5 attempts)', async () => {
      // 1 attempt already made from 203.0.113.2
      for (let i = 0; i < 3; i++) {
        const res = await makeAttempt('203.0.113.2', 'WrongPasskey456!');
        assert.equal(res.status, 401, `Expected 401 Unauthorized on attempt ${i + 2}`);
      }

      // 5th attempt
      const res5 = await makeAttempt('203.0.113.2', 'WrongPasskey456!');
      assert.equal(res5.status, 401, 'Expected 401 Unauthorized on attempt 5');

      // 6th attempt should trigger 429 Too Many Requests (Lockout)
      const res6 = await makeAttempt('203.0.113.2', 'WrongPasskey456!');
      assert.equal(
        res6.status,
        429,
        'Expected 429 Too Many Requests on attempt 6 due to IP lockout'
      );
    });

    await t.test('4. Protection persists for the same IP but allows different IP', async () => {
      // IP 2 is locked
      const resLocked = await makeAttempt('203.0.113.2', passkey); // even correct passkey is blocked
      assert.equal(resLocked.status, 429, 'Expected 429 Too Many Requests for locked IP');

      // But IP 3 can still attempt (until username lockout is triggered)
      // Note: We had 5 failed attempts on IP 2. The username counter is at 5.
      // A new attempt from a new IP should hit the Username exponential backoff!
      const resNew = await makeAttempt('203.0.113.3', 'WrongPasskey456!');
      // Username counter hit 5, so it is locked out for 1 min.
      assert.equal(resNew.status, 429, 'Expected 429 Too Many Requests due to username lockout');
    });

    await t.test('5. Lockout behavior is distinct per username', async () => {
      const newUsername = `authuser2_${Date.now()}`;

      portfolioRepository.getByUsername = async (u) => {
        if (u === newUsername) return { username: u };
        return null;
      };

      // Attempt for new username from new IP should not be locked
      const resNewUser = await makeAttempt('203.0.113.4', 'WrongPasskey456!', newUsername);
      assert.equal(resNewUser.status, 401, 'Expected 401 Unauthorized for new username, not 429');
    });
  } finally {
    // Restore mocks
    portfolioRepository.verifyPasskey = originalVerifyPasskey;
    portfolioRepository.createOrUpdate = originalCreateOrUpdate;
    portfolioRepository.getByUsername = originalGetByUsername;
    server.close();
  }
});
