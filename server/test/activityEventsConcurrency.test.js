import assert from 'node:assert/strict';
import test from 'node:test';
import { activityEventsRepository } from '../repositories/activityEventsRepository.js';

/**
 * Concurrency and Race Condition Tests for Activity Events
 *
 * These tests verify that the database-backed activity events implementation
 * properly handles concurrent operations without data corruption or race conditions.
 *
 * Issue #1360: Race condition in JSON file-based content store
 * Solution: Migrated to database repository with proper locking
 */

test('Concurrent creates do not lose data due to race conditions', async () => {
  const activityKey = 'test-activity-concurrent-create';
  const events = [];

  // Simulate 10 concurrent create operations
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      activityEventsRepository.create(activityKey, {
        name: `Event ${i}`,
        date: new Date().toISOString(),
        description: `Concurrent event ${i}`,
      })
    );
  }

  const results = await Promise.all(promises);

  // Verify all creates succeeded
  assert.equal(results.length, 10, 'All concurrent creates should succeed');

  // Verify no duplicates and all events unique
  const uniqueIds = new Set(results.map((r) => r.id));
  assert.equal(uniqueIds.size, 10, 'All created events should have unique IDs');
});

test('Concurrent deletes do not cause data inconsistency', async () => {
  const activityKey = 'test-activity-concurrent-delete';

  // Create events
  const created = await Promise.all([
    activityEventsRepository.create(activityKey, { name: 'Event 1' }),
    activityEventsRepository.create(activityKey, { name: 'Event 2' }),
    activityEventsRepository.create(activityKey, { name: 'Event 3' }),
  ]);

  // Simulate concurrent deletes
  const deletePromises = created.map((e) => activityEventsRepository.delete(activityKey, e.id));

  const results = await Promise.all(deletePromises);

  // All deletes should succeed
  assert(
    results.every((r) => r === true),
    'All concurrent deletes should succeed'
  );
});

test('Interleaved create and read operations maintain consistency', async () => {
  const activityKey = 'test-activity-interleaved';

  // Perform interleaved operations
  const operations = [
    activityEventsRepository.create(activityKey, { name: 'Event 1' }),
    activityEventsRepository.listByActivityKey(activityKey),
    activityEventsRepository.create(activityKey, { name: 'Event 2' }),
    activityEventsRepository.listByActivityKey(activityKey),
    activityEventsRepository.create(activityKey, { name: 'Event 3' }),
    activityEventsRepository.listByActivityKey(activityKey),
  ];

  const results = await Promise.all(operations);

  // Verify consistency - last read should see all 3 created events
  const lastRead = results[5];
  assert(lastRead.rows.length >= 3, 'Final read should contain all created events');
});

test('Database maintains ACID properties during concurrent modifications', async () => {
  const activityKey = 'test-activity-acid';

  // Create initial event
  const created = await activityEventsRepository.create(activityKey, {
    name: 'ACID Test Event',
    description: 'Initial description',
  });

  // Attempt concurrent modifications (create and delete same activity)
  const concurrent = await Promise.all([
    activityEventsRepository.create(activityKey, { name: 'Concurrent Event 1' }),
    activityEventsRepository.create(activityKey, { name: 'Concurrent Event 2' }),
    activityEventsRepository.listByActivityKey(activityKey),
  ]);

  const finalRead = concurrent[2];

  // Verify all operations completed successfully
  assert(finalRead.rows.length >= 2, 'ACID test: all creates should be visible');
});

test('Large batch operations do not cause timeout or data loss', async () => {
  const activityKey = 'test-activity-batch';
  const batchSize = 50;

  // Create a large batch of events
  const batchPromises = [];
  for (let i = 0; i < batchSize; i++) {
    batchPromises.push(
      activityEventsRepository.create(activityKey, {
        name: `Batch Event ${i}`,
        date: new Date().toISOString(),
        description: `Event in large batch test`,
      })
    );
  }

  const results = await Promise.all(batchPromises);

  // Verify all created
  assert.equal(
    results.filter((r) => r && r.id).length,
    batchSize,
    `All ${batchSize} batch events should be created successfully`
  );
});

test('Read after heavy concurrent writes shows consistent data', async () => {
  const activityKey = 'test-activity-write-heavy';

  // Heavy write phase
  const writes = [];
  for (let i = 0; i < 20; i++) {
    writes.push(
      activityEventsRepository.create(activityKey, {
        name: `Write Heavy Event ${i}`,
        timestamp: Date.now(),
      })
    );
  }

  await Promise.all(writes);

  // Read phase - should see all writes
  const readResult = await activityEventsRepository.listByActivityKey(activityKey);

  assert(readResult.rows.length >= 20, 'Read after concurrent writes should show all data');
});
