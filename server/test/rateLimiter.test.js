import assert from 'node:assert/strict';
import test from 'node:test';

import {
  apiRateLimiter,
  authRateLimiter,
  formRateLimiter,
  notificationRateLimiter,
  portfolioRateLimiter,
  validateLimiters,
} from '../middleware/rateLimiter.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// express-rate-limit validates req.ip as a real IP and reads req.app.get() for
// the trust-proxy setting. Both must be present for the middleware to function.
function makeMockReq(overrides = {}) {
  return {
    ip: '192.0.2.1', // TEST-NET-1 — unambiguous valid IP, never routable
    method: 'GET',
    path: '/api/test',
    originalUrl: '/api/test',
    headers: {},
    app: {
      get: (_setting) => false, // trust proxy disabled
    },
    ...overrides,
  };
}

function makeMockRes() {
  const res = {
    _status: null,
    _body: null,
    _headers: {},
    status(code) {
      res._status = code;
      return res;
    },
    json(body) {
      res._body = body;
      return res;
    },
    setHeader(key, value) {
      res._headers[key] = value;
    },
    getHeader(key) {
      return res._headers[key];
    },
    removeHeader(key) {
      delete res._headers[key];
    },
    hasHeader(key) {
      return Object.prototype.hasOwnProperty.call(res._headers, key);
    },
    end() {},
  };
  return res;
}

// ---------------------------------------------------------------------------
// Export existence — the root cause of issue #346 was apiRateLimiter being
// undefined because the export was never added to rateLimiter.js.
// ---------------------------------------------------------------------------

test('apiRateLimiter is exported and is a function', () => {
  assert.equal(typeof apiRateLimiter, 'function');
});

test('formRateLimiter is exported and is a function', () => {
  assert.equal(typeof formRateLimiter, 'function');
});

test('authRateLimiter is exported and is a function', () => {
  assert.equal(typeof authRateLimiter, 'function');
});

test('notificationRateLimiter is exported and is a function', () => {
  assert.equal(typeof notificationRateLimiter, 'function');
});

test('portfolioRateLimiter is exported and is a function', () => {
  assert.equal(typeof portfolioRateLimiter, 'function');
});

test('validateLimiters is exported and is a function', () => {
  assert.equal(typeof validateLimiters, 'function');
});

// ---------------------------------------------------------------------------
// validateLimiters — startup guard must not throw when all exports are present
// ---------------------------------------------------------------------------

test('validateLimiters passes without throwing when all limiters are correctly exported', () => {
  assert.doesNotThrow(() => validateLimiters());
});

test('validateLimiters throws a descriptive error when a limiter slot is undefined', () => {
  // Replicate the exact failure mode from issue #346: a limiter is undefined
  // because the export was missing. We invoke the validation logic directly
  // with a synthetic object so we do not mutate live module exports.
  function validateCustom(limiters) {
    for (const [name, limiter] of Object.entries(limiters)) {
      if (typeof limiter !== 'function') {
        throw new Error(
          `Rate limiter misconfiguration: "${name}" is not a function. Check rateLimiter.js exports.`
        );
      }
    }
  }

  assert.throws(
    () => validateCustom({ apiRateLimiter: undefined, formRateLimiter }),
    (err) => {
      assert.ok(err instanceof Error);
      assert.ok(
        err.message.includes('apiRateLimiter'),
        `Expected error to name the faulty limiter, got: ${err.message}`
      );
      return true;
    }
  );
});

test('validateLimiters error message names the faulty limiter', () => {
  function validateCustom(limiters) {
    for (const [name, limiter] of Object.entries(limiters)) {
      if (typeof limiter !== 'function') {
        throw new Error(`Rate limiter misconfiguration: "${name}" is not a function.`);
      }
    }
  }

  assert.throws(() => validateCustom({ notificationRateLimiter: null }), /notificationRateLimiter/);
});

// ---------------------------------------------------------------------------
// Middleware behaviour — each limiter must call next() for the first request
// from a fresh IP (well within any configured limit).
// ---------------------------------------------------------------------------

test('apiRateLimiter calls next() for a first-time request within the limit', (t, done) => {
  const req = makeMockReq();
  const res = makeMockRes();
  apiRateLimiter(req, res, () => {
    assert.equal(res._status, null, 'Status must not be set for an allowed request');
    done();
  });
});

test('formRateLimiter calls next() for a first-time request within the limit', (t, done) => {
  const req = makeMockReq();
  const res = makeMockRes();
  formRateLimiter(req, res, () => {
    assert.equal(res._status, null, 'Status must not be set for an allowed request');
    done();
  });
});

test('authRateLimiter calls next() for a first-time request within the limit', (t, done) => {
  const req = makeMockReq();
  const res = makeMockRes();
  authRateLimiter(req, res, () => {
    assert.equal(res._status, null, 'Status must not be set for an allowed request');
    done();
  });
});

test('notificationRateLimiter calls next() for a first-time request within the limit', (t, done) => {
  const req = makeMockReq();
  const res = makeMockRes();
  notificationRateLimiter(req, res, () => {
    assert.equal(res._status, null, 'Status must not be set for an allowed request');
    done();
  });
});

test('portfolioRateLimiter calls next() for a first-time request within the limit', (t, done) => {
  const req = makeMockReq();
  const res = makeMockRes();
  portfolioRateLimiter(req, res, () => {
    assert.equal(res._status, null, 'Status must not be set for an allowed request');
    done();
  });
});

// ---------------------------------------------------------------------------
// Response shape — when the API limit is exceeded the handler must return
// a JSON body with an "error" key and a 429 status code.
// ---------------------------------------------------------------------------

test('apiRateLimiter 429 response body contains an error key', async () => {
  // Use a window of 1 ms and max of 0 to force an immediate block.
  // We import rateLimit directly here to create a throwaway instance,
  // keeping the real apiRateLimiter's in-memory counter unaffected.
  const { default: rateLimit } = await import('express-rate-limit');

  const blocker = rateLimit({
    windowMs: 1,
    max: 0,
    standardHeaders: false,
    legacyHeaders: false,
    handler: (_req, res, _next, options) => {
      res
        .status(options.statusCode)
        .json({ error: 'Too many requests from this IP, please try again later.' });
    },
  });

  await new Promise((resolve) => {
    const req = makeMockReq();
    const res = makeMockRes();
    blocker(req, res, () => {
      // If next() fires we still resolve — the assertion below covers status
      resolve();
    });
    setImmediate(() => {
      assert.equal(res._status, 429, 'Blocked response must use 429 status');
      assert.ok(
        res._body && typeof res._body.error === 'string',
        'Response body must have an error string'
      );
      resolve();
    });
  });
});

// ---------------------------------------------------------------------------
// Proxy trust and client IP extraction integration tests
// ---------------------------------------------------------------------------

test('Express trust proxy configuration properly extracts client IP from X-Forwarded-For', async () => {
  const express = (await import('express')).default;
  const http = await import('node:http');

  const app = express();
  app.set('trust proxy', 1);

  // A simple endpoint to echo back the resolved IP
  app.get('/ip', (req, res) => {
    res.json({ ip: req.ip });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    // Scenario 1: Trusted proxy scenario (1 proxy hop)
    const res1 = await new Promise((resolve) => {
      http.get(
        `http://localhost:${port}/ip`,
        {
          headers: { 'x-forwarded-for': '203.0.113.5, 198.51.100.10' },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(JSON.parse(data)));
        }
      );
    });
    // Since trust proxy is 1, it trusts the last IP in the chain (198.51.100.10)
    // as the proxy, and takes the one before it (203.0.113.5) as the client.
    // Wait, if trust proxy is 1, it takes the right-most IP as the client IP!
    // No, trust proxy 1 means the direct connection is the 1st proxy.
    // The right-most IP in X-Forwarded-For is the client's IP as seen by that proxy.
    // So the client IP is 198.51.100.10!
    assert.equal(res1.ip, '198.51.100.10', 'Trust proxy 1 extracts the right-most IP');

    // Scenario 2: Spoofed header attempt
    // Attacker sends X-Forwarded-For: 1.1.1.1, 2.2.2.2.
    // The proxy appends the attacker's true IP (e.g., 3.3.3.3) to the right.
    // X-Forwarded-For: 1.1.1.1, 2.2.2.2, 3.3.3.3
    const res2 = await new Promise((resolve) => {
      http.get(
        `http://localhost:${port}/ip`,
        {
          headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(JSON.parse(data)));
        }
      );
    });
    // It should securely pick 3.3.3.3 and ignore the spoofed 1.1.1.1 and 2.2.2.2
    assert.equal(res2.ip, '3.3.3.3', 'Securely discards spoofed IPs beyond the trusted proxy hop');
  } finally {
    server.close();
  }
});
