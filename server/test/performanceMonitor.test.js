import assert from 'node:assert/strict';
import test from 'node:test';
import {
  performanceMonitor,
  getMetrics,
  resetMetrics,
  checkErrorRateThreshold,
} from '../middleware/performanceMonitor.js';

test.beforeEach(() => {
  resetMetrics();
});

// Mock request and response objects
function createMockReq(method = 'GET', path = '/test', baseUrl = '') {
  return {
    method,
    path,
    baseUrl,
    route: {
      path,
    },
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    send: function (data) {
      this.lastSendData = data;
      return this;
    },
  };
  return res;
}

function createMockNext() {
  return function () {};
}

test('performanceMonitor tracks basic request metrics', async () => {
  const req = createMockReq();
  const res = createMockRes();
  const next = createMockNext();

  // Call the middleware
  performanceMonitor(req, res, next);

  // Simulate sending a response
  res.send('test response');

  // Get metrics
  const metrics = getMetrics();

  // Should have tracked the endpoint
  assert.ok(metrics.endpoints['GET /test']);
  const endpointMetrics = metrics.endpoints['GET /test'];

  // Should have 5min, 1hr, 24hr windows
  assert.ok(endpointMetrics['5min']);
  assert.ok(endpointMetrics['1hr']);
  assert.ok(endpointMetrics['24hr']);

  // Each window should have 1 request
  assert.strictEqual(endpointMetrics['5min'].count, 1);
  assert.strictEqual(endpointMetrics['1hr'].count, 1);
  assert.strictEqual(endpointMetrics['24hr'].count, 1);

  // Error rate should be 0% (successful request)
  assert.strictEqual(endpointMetrics['5min'].errorRate, 0);
  assert.strictEqual(endpointMetrics['1hr'].errorRate, 0);
  assert.strictEqual(endpointMetrics['24hr'].errorRate, 0);
});

test('performanceMonitor tracks error requests correctly', async () => {
  const req = createMockReq();
  const res = createMockRes();
  res.statusCode = 500; // Simulate error
  const next = createMockNext();

  // Call the middleware
  performanceMonitor(req, res, next);

  // Simulate sending a response
  res.send('error response');

  // Get metrics
  const metrics = getMetrics();
  const endpointMetrics = metrics.endpoints['GET /test'];

  // Should have 1 request with 1 error
  assert.strictEqual(endpointMetrics['5min'].count, 1);
  assert.strictEqual(endpointMetrics['5min'].errorCount, 1);
  assert.strictEqual(endpointMetrics['5min'].errorRate, 100);
});

test('performanceMonitor tracks request duration', async () => {
  const req = createMockReq();
  const res = createMockRes();
  const next = createMockNext();

  // Call the middleware
  performanceMonitor(req, res, next);

  // Simulate some processing time
  await new Promise((resolve) => setTimeout(resolve, 10)); // 10ms delay

  // Simulate sending a response
  res.send('test response');

  // Get metrics
  const metrics = getMetrics();
  const endpointMetrics = metrics.endpoints['GET /test'];

  // Should have tracked some time (at least 10ms)
  assert.ok(endpointMetrics['5min'].totalTime >= 10);
  assert.ok(endpointMetrics['5min'].avgTime >= 10);
});

test('performanceMonitor handles multiple requests to same endpoint', async () => {
  const req = createMockReq();
  const res = createMockRes();
  const next = createMockNext();

  // Make 5 requests
  for (let i = 0; i < 5; i++) {
    performanceMonitor(req, res, next);
    res.send(`response ${i}`);
  }

  // Get metrics
  const metrics = getMetrics();
  const endpointMetrics = metrics.endpoints['GET /test'];

  // Should have 5 requests
  assert.strictEqual(endpointMetrics['5min'].count, 5);
  assert.strictEqual(endpointMetrics['1hr'].count, 5);
  assert.strictEqual(endpointMetrics['24hr'].count, 5);

  // Error rate should still be 0%
  assert.strictEqual(endpointMetrics['5min'].errorRate, 0);
});

test('performanceMonitor handles different endpoints separately', async () => {
  const next = createMockNext();

  // Call middleware for first endpoint
  const req1 = createMockReq('GET', '/endpoint1');
  const res1 = createMockRes();
  performanceMonitor(req1, res1, next);
  res1.send('response 1');

  // Call middleware for second endpoint
  const req2 = createMockReq('GET', '/endpoint2');
  const res2 = createMockRes();
  performanceMonitor(req2, res2, next);
  res2.send('response 2');

  // Get metrics
  const metrics = getMetrics();

  // Should have both endpoints tracked
  assert.ok(metrics.endpoints['GET /endpoint1']);
  assert.ok(metrics.endpoints['GET /endpoint2']);

  // Each should have 1 request
  assert.strictEqual(metrics.endpoints['GET /endpoint1']['5min'].count, 1);
  assert.strictEqual(metrics.endpoints['GET /endpoint2']['5min'].count, 1);
});

test('performanceMonitor tracks different HTTP methods separately', async () => {
  const next = createMockNext();

  // Call middleware for GET
  const reqGet = createMockReq('GET', '/test');
  const resGet = createMockRes();
  performanceMonitor(reqGet, resGet, next);
  resGet.send('get response');

  // Call middleware for POST
  const reqPost = createMockReq('POST', '/test');
  const resPost = createMockRes();
  performanceMonitor(reqPost, resPost, next);
  resPost.send('post response');

  // Get metrics
  const metrics = getMetrics();

  // Should have different endpoints for different methods
  assert.ok(metrics.endpoints['GET /test']);
  assert.ok(metrics.endpoints['POST /test']);

  // Each should have 1 request
  assert.strictEqual(metrics.endpoints['GET /test']['5min'].count, 1);
  assert.strictEqual(metrics.endpoints['POST /test']['5min'].count, 1);
});

test('resetMetrics clears all data', async () => {
  const req = createMockReq();
  const res = createMockRes();
  const next = createMockNext();

  // Make a request
  performanceMonitor(req, res, next);
  res.send('test response');

  // Verify data exists
  let metrics = getMetrics();
  assert.ok(metrics.endpoints['GET /test']);
  assert.strictEqual(metrics.endpoints['GET /test']['5min'].count, 1);

  // Reset metrics
  resetMetrics();

  // Verify data is cleared
  metrics = getMetrics();
  assert.strictEqual(Object.keys(metrics.endpoints).length, 0);
});

test('checkErrorRateThreshold detects high error rates', async () => {
  const next = createMockNext();

  // Create 9 successful requests and 1 failed request (10% error rate)
  for (let i = 0; i < 9; i++) {
    const req = createMockReq();
    const res = createMockRes();
    performanceMonitor(req, res, next);
    res.statusCode = 200;
    res.send(`success ${i}`);
  }

  // One failed request
  const req = createMockReq();
  const res = createMockRes();
  performanceMonitor(req, res, next);
  res.statusCode = 500;
  res.send('failure');

  // Check threshold at 15% (should not trigger)
  let exceeded = checkErrorRateThreshold(15);
  assert.strictEqual(exceeded, false); // 10% < 15%

  // Check threshold at 5% (should trigger)
  exceeded = checkErrorRateThreshold(5);
  assert.strictEqual(exceeded, true); // 10% > 5%
});

test('checkErrorRateThreshold returns false for low error rates', async () => {
  const req = createMockReq();
  const res = createMockRes();
  const next = createMockNext();

  // Create only successful requests
  for (let i = 0; i < 10; i++) {
    performanceMonitor(req, res, next);
    res.statusCode = 200;
    res.send(`success ${i}`);
  }

  // Check threshold (should not trigger)
  const exceeded = checkErrorRateThreshold(5);
  assert.strictEqual(exceeded, false); // 0% < 5%
});

test('endpoint normalization works for UUIDs', async () => {
  const req = createMockReq('GET', '/api/users/123e4567-e89b-12d3-a456-426614174000');
  const res = createMockRes();
  const next = createMockNext();

  performanceMonitor(req, res, next);
  res.send('user data');

  const metrics = getMetrics();
  // Should normalize UUID to :id
  assert.ok(metrics.endpoints['GET /api/users/:id']);
  assert.strictEqual(metrics.endpoints['GET /api/users/:id']['5min'].count, 1);
});

test('endpoint normalization works for numeric IDs', async () => {
  const next = createMockNext();

  const req = createMockReq('GET', '/api/posts/123/comments/456');
  const res = createMockRes();
  performanceMonitor(req, res, next);
  res.send('comment data');

  const metrics = getMetrics();
  // Should normalize numeric IDs to :id
  assert.ok(metrics.endpoints['GET /api/posts/:id/comments/:id']);
  assert.strictEqual(metrics.endpoints['GET /api/posts/:id/comments/:id']['5min'].count, 1);
});

test('trailing slash consolidation works', async () => {
  const next = createMockNext();

  const req1 = createMockReq('GET', '/api/test/');
  const res1 = createMockRes();
  performanceMonitor(req1, res1, next);
  res1.send('response 1');

  const req2 = createMockReq('GET', '/api/test');
  const res2 = createMockRes();
  performanceMonitor(req2, res2, next);
  res2.send('response 2');

  const metrics = getMetrics();
  // Should consolidate to same endpoint
  assert.ok(metrics.endpoints['GET /api/test']);
  assert.strictEqual(metrics.endpoints['GET /api/test']['5min'].count, 2);
});

test('handle missing route gracefully', async () => {
  const req = createMockReq('GET', '/unknown/path');
  // No route property
  delete req.route;
  const res = createMockRes();
  const next = createMockNext();

  performanceMonitor(req, res, next);
  res.send('404 response');

  const metrics = getMetrics();
  // Should still track the endpoint
  assert.ok(metrics.endpoints['GET /unknown/path']);
  assert.strictEqual(metrics.endpoints['GET /unknown/path']['5min'].count, 1);
});
