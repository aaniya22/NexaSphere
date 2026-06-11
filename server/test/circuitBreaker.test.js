import test from 'node:test';
import assert from 'node:assert';
import { CircuitBreaker } from '../utils/circuitBreaker.js';

// Helper to wait
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('Circuit Breaker - Initial State and Normal Operation', async () => {
  const mockFn = async (x) => x * 2;
  const breaker = new CircuitBreaker(mockFn, {
    failureThreshold: 3,
    coolDownPeriod: 100
  });

  assert.strictEqual(breaker.state, 'CLOSED');
  
  const result = await breaker.execute(5);
  assert.strictEqual(result, 10);
  assert.strictEqual(breaker.successCount, 1);
  assert.strictEqual(breaker.failureCount, 0);
});

test('Circuit Breaker - Tripping to OPEN state', async () => {
  const errorMsg = 'Service failure';
  const mockFn = async () => {
    throw new Error(errorMsg);
  };

  const breaker = new CircuitBreaker(mockFn, {
    failureThreshold: 2,
    coolDownPeriod: 100
  });

  // First failure
  await assert.rejects(breaker.execute(), { message: errorMsg });
  assert.strictEqual(breaker.state, 'CLOSED');
  assert.strictEqual(breaker.failureCount, 1);

  // Second failure (trips threshold)
  await assert.rejects(breaker.execute(), { message: errorMsg });
  assert.strictEqual(breaker.state, 'OPEN');
  assert.strictEqual(breaker.failureCount, 2);
  assert.strictEqual(breaker.tripCount, 1);

  // Immediate subsequent request should be blocked and fail with breaker error
  await assert.rejects(breaker.execute(), { message: 'Circuit breaker is OPEN. Request blocked.' });
});

test('Circuit Breaker - Cooldown and HALF_OPEN Recovery', async () => {
  let fail = true;
  const mockFn = async () => {
    if (fail) throw new Error('Failed');
    return 'Success';
  };

  const breaker = new CircuitBreaker(mockFn, {
    failureThreshold: 1,
    coolDownPeriod: 50
  });

  // Trip it
  await assert.rejects(breaker.execute(), { message: 'Failed' });
  assert.strictEqual(breaker.state, 'OPEN');

  // Request should fail immediately
  await assert.rejects(breaker.execute(), { message: 'Circuit breaker is OPEN. Request blocked.' });

  // Wait for cooldown
  await sleep(60);

  // Allow one request (half-open test)
  fail = false;
  const result = await breaker.execute();
  assert.strictEqual(result, 'Success');
  assert.strictEqual(breaker.state, 'CLOSED');
  assert.strictEqual(breaker.failureCount, 0);
  assert.strictEqual(breaker.successCount, 0); // reset clears successCount
});

test('Circuit Breaker - HALF_OPEN Failure and Backoff', async () => {
  let fail = true;
  const mockFn = async () => {
    if (fail) throw new Error('Failed');
    return 'Success';
  };

  const breaker = new CircuitBreaker(mockFn, {
    failureThreshold: 1,
    coolDownPeriod: 50,
    maxCoolDownPeriod: 200
  });

  // Trip it
  await assert.rejects(breaker.execute(), { message: 'Failed' });
  assert.strictEqual(breaker.state, 'OPEN');

  // Cooldown
  await sleep(60);

  // In HALF_OPEN, it fails again
  await assert.rejects(breaker.execute(), { message: 'Failed' });
  assert.strictEqual(breaker.state, 'OPEN');
  assert.strictEqual(breaker.currentCoolDown, 100); // Backoff: 50 * 2 = 100
});

test('Circuit Breaker - Manual Reset', async () => {
  const mockFn = async () => {
    throw new Error('Failed');
  };

  const breaker = new CircuitBreaker(mockFn, {
    failureThreshold: 1,
    coolDownPeriod: 100
  });

  await assert.rejects(breaker.execute(), { message: 'Failed' });
  assert.strictEqual(breaker.state, 'OPEN');

  breaker.reset();
  assert.strictEqual(breaker.state, 'CLOSED');
  assert.strictEqual(breaker.failureCount, 0);
  assert.strictEqual(breaker.tripCount, 1); // tripCount persists, others reset
});
