import assert from 'node:assert/strict';
import test from 'node:test';

import {
  __portfolioRepositoryInternals,
  canonicalizeUsername,
} from '../repositories/portfolioRepository.js';

test('canonicalizeUsername maps case variants to the same portfolio identity', () => {
  assert.equal(canonicalizeUsername(' Alice '), 'alice');
  assert.equal(canonicalizeUsername('alice'), 'alice');
  assert.equal(canonicalizeUsername('ALICE'), 'alice');
});

test('ensureSchema repairs case-variant duplicates before adding unique lower(username) index', async () => {
  const queries = [];
  const client = {
    async query(sql) {
      queries.push(sql.replace(/\s+/g, ' ').trim());
      return { rows: [] };
    },
  };

  await __portfolioRepositoryInternals.ensureSchema(client);

  const backupQuery = queries.find(
    (query) =>
      query.includes('portfolio_username_case_duplicates_backup') &&
      query.includes('TO_JSONB(duplicate_rows)')
  );
  const deleteDuplicateQuery = queries.find(
    (query) =>
      query.includes('DELETE FROM portfolios p') &&
      query.includes('PARTITION BY LOWER(TRIM(username))')
  );
  const canonicalUpdateQuery = queries.find(
    (query) =>
      query.includes('UPDATE portfolios') && query.includes('SET username = LOWER(TRIM(username))')
  );
  const uniqueIndexQuery = queries.find(
    (query) =>
      query.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolios_username_lower_unique') &&
      query.includes('ON portfolios (LOWER(username))')
  );

  assert.ok(backupQuery, 'backs up Alice/alice style duplicate rows before repair');
  assert.ok(deleteDuplicateQuery, 'removes all but one row per canonical username');
  assert.ok(canonicalUpdateQuery, 'stores the canonical lowercase username');
  assert.ok(uniqueIndexQuery, 'enforces case-insensitive uniqueness in PostgreSQL');
  assert.ok(
    queries.indexOf(deleteDuplicateQuery) < queries.indexOf(uniqueIndexQuery),
    'duplicates are repaired before the unique index is created'
  );
});

test('database recovery triggers schema creation and succeeds', async () => {
  const originalDateNow = Date.now;
  let currentTime = 100000;
  Date.now = () => currentTime;

  let dbOnline = false;
  let queries = [];

  const { setWithDbOverride } = await import('../repositories/db.js');
  const { portfolioRepository } = await import('../repositories/portfolioRepository.js');

  setWithDbOverride(async (fn) => {
    if (!dbOnline) {
      throw new Error('Database connection failed');
    }
    const mockClient = {
      async query(sql, params) {
        queries.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
        return { rows: [] };
      }
    };
    return await fn(mockClient);
  });

  try {
    // 1. Initial attempt with database offline
    await portfolioRepository.getByUsername('alice');
    
    // Check that no queries were executed because database was offline
    assert.equal(queries.length, 0);

    // 2. Database comes online, but TTL (15s) has not elapsed yet
    dbOnline = true;
    currentTime += 5000; // only 5s passed
    await portfolioRepository.getByUsername('alice');
    
    // Still shouldn't execute queries because of TTL cache
    assert.equal(queries.length, 0);

    // 3. TTL elapses (15s elapsed)
    currentTime += 11000; // total 16s passed since last failure
    await portfolioRepository.getByUsername('alice');

    // Now it should retry, which means running ensureSchema AND then the SELECT query!
    const schemaCreated = queries.some(q => q.sql.includes('CREATE TABLE IF NOT EXISTS portfolios'));
    assert.ok(schemaCreated, 'ensureSchema should be run upon database recovery');

    const selectQuery = queries.some(q => q.sql.includes('SELECT * FROM portfolios'));
    assert.ok(selectQuery, 'SELECT * query should be run after database recovery');

  } finally {
    // Restore mocks
    Date.now = originalDateNow;
    setWithDbOverride(null);
  }
});
