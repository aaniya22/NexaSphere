import assert from 'node:assert/strict';
import test from 'node:test';
import { _resetCircuitBreaker, _resetPools } from '../repositories/db.js';

// Mock pg to test failover logic
import pg from 'pg';

let primaryConnectShouldFail = false;
let replicaConnectShouldFail = false;

pg.Pool = class MockPool {
  constructor(config) {
    this.config = config;
    this.isReplica = config.connectionString && config.connectionString.includes('replica');
  }
  on() {}
  async connect() {
    if (this.isReplica && replicaConnectShouldFail) {
      throw new Error('Replica connection error');
    }
    if (!this.isReplica && primaryConnectShouldFail) {
      throw new Error('Primary connection error');
    }
    return {
      isReplica: this.isReplica,
      release: () => {},
    };
  }
};

// Now import db.js (it will use the mocked pg)
import { withDb } from '../repositories/db.js';

test.beforeEach(() => {
  process.env.DATABASE_URL = 'postgres://primary';
  process.env.DATABASE_URL_REPLICA = 'postgres://replica';
  process.env.PG_CIRCUIT_BREAKER_COOLDOWN_MS = '1000';
  _resetCircuitBreaker();
  _resetPools();
  primaryConnectShouldFail = false;
  replicaConnectShouldFail = false;
});

test('withDb connects to primary when healthy', async () => {
  await withDb(async (client) => {
    assert.equal(client.isReplica, false, 'Should connect to primary');
  });
});

test('withDb falls back to replica when primary fails and opens circuit', async () => {
  primaryConnectShouldFail = true;

  // First request: primary fails, falls back to replica
  await withDb(async (client) => {
    assert.equal(client.isReplica, true, 'Should connect to replica upon primary failure');
  });

  // Circuit should now be open, so next request directly uses replica even if primary "recovers"
  primaryConnectShouldFail = false;
  await withDb(async (client) => {
    assert.equal(client.isReplica, true, 'Should use replica directly because circuit is open');
  });
});

test('withDb closes circuit after cooldown', async () => {
  process.env.PG_CIRCUIT_BREAKER_COOLDOWN_MS = '100';
  primaryConnectShouldFail = true;

  // First request: primary fails, circuit opens
  await withDb(async (client) => {
    assert.equal(client.isReplica, true);
  });

  primaryConnectShouldFail = false;

  // Wait for cooldown
  await new Promise((r) => setTimeout(r, 150));

  // Second request: cooldown elapsed, should try primary and succeed (circuit closes)
  await withDb(async (client) => {
    assert.equal(client.isReplica, false, 'Should reconnect to primary after cooldown');
  });

  // Third request: circuit is closed, uses primary directly
  await withDb(async (client) => {
    assert.equal(client.isReplica, false);
  });
});

test('withDb throws when both primary and replica fail', async () => {
  primaryConnectShouldFail = true;
  replicaConnectShouldFail = true;

  await assert.rejects(async () => {
    await withDb(async () => {});
  }, /Primary connection error/);
});

test('withDb throws when primary fails and no replica is configured', async () => {
  delete process.env.DATABASE_URL_REPLICA;
  primaryConnectShouldFail = true;

  await assert.rejects(async () => {
    await withDb(async () => {});
  }, /Primary connection error/);
});
