import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  __portfolioRepositoryInternals,
  canonicalizeUsername,
  portfolioRepository,
} from '../repositories/portfolioRepository.js';
import { setWithDbOverride } from '../repositories/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORTFOLIOS_FILE = path.join(__dirname, '..', 'data', 'portfolios.json');

let originalFileContent = null;
let fileExisted = false;

before(async () => {
  try {
    originalFileContent = await fs.readFile(PORTFOLIOS_FILE, 'utf8');
    fileExisted = true;
  } catch {
    fileExisted = false;
  }
});

after(async () => {
  setWithDbOverride(null);
  if (fileExisted) {
    await fs.writeFile(PORTFOLIOS_FILE, originalFileContent, 'utf8');
  } else {
    try {
      await fs.unlink(PORTFOLIOS_FILE);
    } catch {}
  }
});

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

  const backupQuery = queries.find((query) =>
    query.includes('portfolio_username_case_duplicates_backup')
    && query.includes('TO_JSONB(duplicate_rows)')
  );
  const deleteDuplicateQuery = queries.find((query) =>
    query.includes('DELETE FROM portfolios p')
    && query.includes('PARTITION BY LOWER(TRIM(username))')
  );
  const canonicalUpdateQuery = queries.find((query) =>
    query.includes('UPDATE portfolios')
    && query.includes('SET username = LOWER(TRIM(username))')
  );
  const uniqueIndexQuery = queries.find((query) =>
    query.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolios_username_lower_unique')
    && query.includes('ON portfolios (LOWER(username))')
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

test('Case 1: Primary source succeeds', async () => {
  setWithDbOverride(async (fn) => {
    const mockClient = {
      query: async (sql, params) => {
        if (sql.includes('SELECT * FROM portfolios')) {
          return {
            rows: [{
              username: 'alice',
              theme: 'dark',
              visible_sections: '{"quests":true}',
              social_links: '{}',
              custom_domain: '',
              seo_metadata: '{}',
              skills: '[]',
              badges: '[]',
              projects: '[]',
              roadmaps: '[]',
              bio: 'Bio',
              title: 'Title',
              avatar_url: '',
              education: '[]',
              work_experience: '[]',
              created_at: new Date(),
              updated_at: new Date(),
            }],
          };
        }
        return { rows: [] };
      },
    };
    return fn(mockClient);
  });

  const result = await portfolioRepository.getByUsername('alice');
  assert.ok(result);
  assert.equal(result.username, 'alice');
  assert.equal(result.theme, 'dark');
});

test('Case 2: Primary source fails (triggers fallback)', async () => {
  // Clear file contents for test clean slate
  await fs.mkdir(path.dirname(PORTFOLIOS_FILE), { recursive: true });
  await fs.writeFile(PORTFOLIOS_FILE, JSON.stringify({
    alice: {
      username: 'alice',
      theme: 'glassmorphic',
      bio: 'Fallback bio',
      title: 'Fallback Title',
    },
  }, null, 2), 'utf8');

  setWithDbOverride(async (fn) => {
    throw new Error('Database connection failed catastrophically');
  });

  const result = await portfolioRepository.getByUsername('alice');
  assert.ok(result);
  assert.equal(result.username, 'alice');
  assert.equal(result.bio, 'Fallback bio');
});

test('Case 3, 4, 5: Fallback executes successfully, returns portfolio data, and does not throw ReferenceError', async () => {
  // Force db to fail/be offline
  setWithDbOverride(async (fn) => {
    throw new Error('Database is offline');
  });

  // Clear file contents for test clean slate
  await fs.mkdir(path.dirname(PORTFOLIOS_FILE), { recursive: true });
  await fs.writeFile(PORTFOLIOS_FILE, JSON.stringify({}, null, 2), 'utf8');

  const testData = {
    username: 'bob',
    passkey: 'secret-passkey-long-enough-123',
    theme: 'glassmorphic',
    bio: 'Hello Bob',
    title: 'Software Engineer',
  };

  // This will trigger local fallback and should not throw ReferenceError
  const saved = await portfolioRepository.createOrUpdate(testData);
  assert.ok(saved);
  assert.equal(saved.username, 'bob');
  assert.equal(saved.bio, 'Hello Bob');
  assert.equal(saved.title, 'Software Engineer');

  // Verify we can retrieve it
  const fetched = await portfolioRepository.getByUsername('bob');
  assert.ok(fetched);
  assert.equal(fetched.username, 'bob');
  assert.equal(fetched.bio, 'Hello Bob');

  // Verify passkey verify fallback
  const isMatch = await portfolioRepository.verifyPasskey('bob', 'secret-passkey-long-enough-123');
  assert.equal(isMatch, true);

  const isNotMatch = await portfolioRepository.verifyPasskey('bob', 'wrong-passkey');
  assert.equal(isNotMatch, false);
});

test('database recovery triggers schema creation and succeeds', async () => {
  __portfolioRepositoryInternals.resetState();
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
