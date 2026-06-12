import test from 'node:test';
import assert from 'node:assert';
import { CircuitBreaker, circuitBreakerRegistry } from '../utils/circuitBreaker.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('Circuit Breaker - Initial State and Normal Operation', async () => {
  const mockFn = async (x) => x * 2;
  const breaker = new CircuitBreaker(mockFn, {
    failureThreshold: 3,
    coolDownPeriod: 100,
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
    coolDownPeriod: 100,
  });

  await assert.rejects(breaker.execute(), { message: errorMsg });
  assert.strictEqual(breaker.state, 'CLOSED');
  assert.strictEqual(breaker.failureCount, 1);

  await assert.rejects(breaker.execute(), { message: errorMsg });
  assert.strictEqual(breaker.state, 'OPEN');
  assert.strictEqual(breaker.failureCount, 2);
  assert.strictEqual(breaker.tripCount, 1);

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
    coolDownPeriod: 50,
  });

  await assert.rejects(breaker.execute(), { message: 'Failed' });
  assert.strictEqual(breaker.state, 'OPEN');

  await assert.rejects(breaker.execute(), { message: 'Circuit breaker is OPEN. Request blocked.' });

  await sleep(60);

  fail = false;
  const result = await breaker.execute();
  assert.strictEqual(result, 'Success');
  assert.strictEqual(breaker.state, 'CLOSED');
  assert.strictEqual(breaker.failureCount, 0);
  assert.strictEqual(breaker.successCount, 0);
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
    maxCoolDownPeriod: 200,
  });

  await assert.rejects(breaker.execute(), { message: 'Failed' });
  assert.strictEqual(breaker.state, 'OPEN');

  await sleep(60);

  await assert.rejects(breaker.execute(), { message: 'Failed' });
  assert.strictEqual(breaker.state, 'OPEN');
  assert.strictEqual(breaker.currentCoolDown, 100);
});

test('Circuit Breaker - Manual Reset', async () => {
  const mockFn = async () => {
    throw new Error('Failed');
  };

  const breaker = new CircuitBreaker(mockFn, {
    failureThreshold: 1,
    coolDownPeriod: 100,
  });

  await assert.rejects(breaker.execute(), { message: 'Failed' });
  assert.strictEqual(breaker.state, 'OPEN');

  breaker.reset();
  assert.strictEqual(breaker.state, 'CLOSED');
  assert.strictEqual(breaker.failureCount, 0);
  assert.strictEqual(breaker.tripCount, 1);
});

test('Circuit Breaker - successThreshold requires N successes in HALF_OPEN', async () => {
  let callCount = 0;
  const mockFn = async () => {
    callCount++;
    if (callCount <= 2) throw new Error('Failed');
    return 'Success';
  };

  const breaker = new CircuitBreaker(mockFn, {
    failureThreshold: 2,
    successThreshold: 2,
    coolDownPeriod: 50,
  });

  await assert.rejects(breaker.execute(), { message: 'Failed' });
  await assert.rejects(breaker.execute(), { message: 'Failed' });
  assert.strictEqual(breaker.state, 'OPEN');

  await sleep(60);

  const r1 = await breaker.execute();
  assert.strictEqual(r1, 'Success');
  assert.strictEqual(breaker.state, 'HALF_OPEN');
  assert.strictEqual(breaker.successCount, 1);

  const r2 = await breaker.execute();
  assert.strictEqual(r2, 'Success');
  assert.strictEqual(breaker.state, 'CLOSED');
  assert.strictEqual(breaker.successCount, 0);
});

test('Circuit Breaker - manualRetry forces a call even when OPEN', async () => {
  let fail = true;
  const mockFn = async () => {
    if (fail) throw new Error('Failed');
    return 'Success';
  };

  const breaker = new CircuitBreaker(mockFn, {
    failureThreshold: 1,
    coolDownPeriod: 5000,
  });

  await assert.rejects(breaker.execute(), { message: 'Failed' });
  assert.strictEqual(breaker.state, 'OPEN');

  fail = false;
  const result = await breaker.manualRetry();
  assert.strictEqual(result, 'Success');
  assert.strictEqual(breaker.state, 'CLOSED');
});

test('Circuit Breaker - manualRetry when CLOSED', async () => {
  const mockFn = async (x) => x * 2;
  const breaker = new CircuitBreaker(mockFn, {
    failureThreshold: 3,
    coolDownPeriod: 100,
  });

  const result = await breaker.manualRetry(5);
  assert.strictEqual(result, 10);
  assert.strictEqual(breaker.state, 'CLOSED');
});

test('Circuit Breaker Registry - register and getMetrics', async () => {
  const mockFn = async () => 'ok';
  const breaker = new CircuitBreaker(mockFn, {
    name: 'test-service',
    failureThreshold: 3,
    coolDownPeriod: 100,
  });

  circuitBreakerRegistry.register('test-service', breaker);

  const metrics = circuitBreakerRegistry.getAllMetrics();
  assert.strictEqual(metrics.length >= 1, true);
  const own = metrics.find((m) => m.name === 'test-service');
  assert.ok(own);
  assert.strictEqual(own.state, 'CLOSED');
});

test('Circuit Breaker Registry - reset and manualRetry', async () => {
  const mockFn = async () => {
    throw new Error('Failed');
  };

  const breaker = new CircuitBreaker(mockFn, {
    name: 'registry-test',
    failureThreshold: 1,
    coolDownPeriod: 5000,
  });

  circuitBreakerRegistry.register('registry-test', breaker);

  await assert.rejects(breaker.execute(), { message: 'Failed' });
  assert.strictEqual(breaker.state, 'OPEN');

  const resetResult = circuitBreakerRegistry.reset('registry-test');
  assert.strictEqual(resetResult, true);
  assert.strictEqual(breaker.state, 'CLOSED');
});

test('Circuit Breaker - forceReset', async () => {
  const mockFn = async () => {
    throw new Error('Failed');
  };

  const breaker = new CircuitBreaker(mockFn, {
    failureThreshold: 1,
    coolDownPeriod: 5000,
  });

  await assert.rejects(breaker.execute(), { message: 'Failed' });
  assert.strictEqual(breaker.state, 'OPEN');

  breaker.forceReset();
  assert.strictEqual(breaker.state, 'CLOSED');
});

test('Circuit Breaker - error code CIRCUIT_OPEN', async () => {
  const mockFn = async () => {
    throw new Error('Failed');
  };

  const breaker = new CircuitBreaker(mockFn, {
    failureThreshold: 1,
    coolDownPeriod: 5000,
  });

  await assert.rejects(breaker.execute(), { message: 'Failed' });
  try {
    await breaker.execute();
  } catch (err) {
    assert.strictEqual(err.code, 'CIRCUIT_OPEN');
  }
});

test('Circuit Breaker - event emission', async () => {
  const mockFn = async () => {
    throw new Error('Failed');
  };

  const breaker = new CircuitBreaker(mockFn, {
    name: 'event-test',
    failureThreshold: 1,
    coolDownPeriod: 50,
  });

  const events = [];
  breaker.on('open', (data) => events.push({ type: 'open', ...data }));
  breaker.on('closed', (data) => events.push({ type: 'closed', ...data }));

  await assert.rejects(breaker.execute(), { message: 'Failed' });
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].type, 'open');

  // Reset to trigger 'closed' event
  breaker.reset();
  assert.strictEqual(events.length, 2);
  assert.strictEqual(events[1].type, 'closed');
});
