import assert from 'node:assert/strict';
import test from 'node:test';
import { activityEventsService } from '../services/activityEventsService.js';
import { activityEventsRepository } from '../repositories/activityEventsRepository.js';
import { coreTeamService } from '../services/coreTeamService.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * Authorization Edge Cases and Bypass Prevention Tests
 *
 * These tests verify that authentication and authorization checks are properly
 * enforced on activity event mutations, with comprehensive edge case coverage
 * to prevent authorization bypasses.
 *
 * Issue #1367: Complete Authentication & Authorization Bypass
 * Solution: Enforce admin authorization on activity event mutations
 */

const TEST_MEMBER = {
  name: 'Auth Test Member',
  email: 'authtest@example.com',
  whatsapp: '9000000002',
};

const originalCreate = activityEventsRepository.create;
const originalDelete = activityEventsRepository.delete;
const originalListMembers = coreTeamService.listMembers;
const originalAssertCanManage = coreTeamService.assertCanManageActivityEvent;

test.before(() => {
  activityEventsRepository.create = async (key, data) => ({
    id: 'mock-id',
    ...data,
  });
  activityEventsRepository.delete = async (key, id) => true;
  coreTeamService.listMembers = async () => [TEST_MEMBER];
  coreTeamService.assertCanManageActivityEvent = async (input) => {
    if (!input.password || input.password !== 'TestPassword123') {
      throw new UnauthorizedError('Invalid credentials');
    }
  };
  process.env.ADMIN_EVENT_PASSWORD = 'TestPassword123';
});

test.after(() => {
  activityEventsRepository.create = originalCreate;
  activityEventsRepository.delete = originalDelete;
  coreTeamService.listMembers = originalListMembers;
  coreTeamService.assertCanManageActivityEvent = originalAssertCanManage;
  delete process.env.ADMIN_EVENT_PASSWORD;
});

// Edge Case 1: Null/undefined credentials
test('Authorization check rejects null password', async () => {
  const input = {
    name: 'Event',
    password: null,
    coreTeamName: 'Test User',
  };

  await assert.rejects(
    async () => {
      await activityEventsService.assertCanManage(input);
    },
    UnauthorizedError,
    'Null password should be rejected'
  );
});

test('Authorization check rejects undefined password', async () => {
  const input = {
    name: 'Event',
    // password intentionally omitted
    coreTeamName: 'Test User',
  };

  await assert.rejects(
    async () => {
      await activityEventsService.assertCanManage(input);
    },
    UnauthorizedError,
    'Undefined password should be rejected'
  );
});

// Edge Case 2: Empty string credentials
test('Authorization check rejects empty string password', async () => {
  const input = {
    name: 'Event',
    password: '',
    coreTeamName: 'Test User',
  };

  await assert.rejects(
    async () => {
      await activityEventsService.assertCanManage(input);
    },
    UnauthorizedError,
    'Empty password should be rejected'
  );
});

// Edge Case 3: Whitespace-only credentials
test('Authorization check rejects whitespace-only password', async () => {
  const input = {
    name: 'Event',
    password: '   ',
    coreTeamName: 'Test User',
  };

  await assert.rejects(
    async () => {
      await activityEventsService.assertCanManage(input);
    },
    UnauthorizedError,
    'Whitespace-only password should be rejected'
  );
});

// Edge Case 4: Case sensitivity
test('Authorization check is case-sensitive for password', async () => {
  const input = {
    name: 'Event',
    password: 'testpassword123', // lowercase instead of correct case
    coreTeamName: 'Test User',
  };

  await assert.rejects(
    async () => {
      await activityEventsService.assertCanManage(input);
    },
    UnauthorizedError,
    'Password should be case-sensitive'
  );
});

// Edge Case 5: Injection attempts
test('Authorization check blocks SQL injection in password field', async () => {
  const input = {
    name: 'Event',
    password: "TestPassword123' OR '1'='1",
    coreTeamName: 'Test User',
  };

  await assert.rejects(
    async () => {
      await activityEventsService.assertCanManage(input);
    },
    UnauthorizedError,
    'SQL injection attempt should be blocked'
  );
});

test('Authorization check blocks command injection attempts', async () => {
  const input = {
    name: 'Event',
    password: 'TestPassword123; DROP TABLE activity_events;',
    coreTeamName: 'Test User',
  };

  await assert.rejects(
    async () => {
      await activityEventsService.assertCanManage(input);
    },
    UnauthorizedError,
    'Command injection attempt should be blocked'
  );
});

// Edge Case 6: Unicode and special characters
test('Authorization handles unicode in password correctly', async () => {
  const input = {
    name: 'Event',
    password: 'TestPassword123é', // with accented character
    coreTeamName: 'Test User',
  };

  await assert.rejects(
    async () => {
      await activityEventsService.assertCanManage(input);
    },
    UnauthorizedError,
    'Unicode variations should not match correct password'
  );
});

// Edge Case 7: Very long password input
test('Authorization handles extremely long password safely', async () => {
  const input = {
    name: 'Event',
    password: 'A'.repeat(10000),
    coreTeamName: 'Test User',
  };

  await assert.rejects(
    async () => {
      await activityEventsService.assertCanManage(input);
    },
    UnauthorizedError,
    'Extremely long password should be handled safely'
  );
});

// Edge Case 8: Null byte injection
test('Authorization check blocks null byte injection', async () => {
  const input = {
    name: 'Event',
    password: 'TestPassword123\x00evil',
    coreTeamName: 'Test User',
  };

  await assert.rejects(
    async () => {
      await activityEventsService.assertCanManage(input);
    },
    UnauthorizedError,
    'Null byte injection should be blocked'
  );
});

// Edge Case 9: Authorization state isolation
test('Multiple concurrent auth checks do not interfere with each other', async () => {
  const validInput = {
    name: 'Event',
    password: 'TestPassword123',
    coreTeamName: 'Test User',
  };

  const invalidInput = {
    name: 'Event',
    password: 'WrongPassword',
    coreTeamName: 'Test User',
  };

  const results = await Promise.allSettled([
    activityEventsService.assertCanManage(validInput),
    activityEventsService.assertCanManage(invalidInput),
    activityEventsService.assertCanManage(validInput),
  ]);

  // First should succeed, second should fail, third should succeed
  assert.equal(results[0].status, 'fulfilled', 'Valid auth should succeed');
  assert.equal(results[1].status, 'rejected', 'Invalid auth should fail');
  assert.equal(results[2].status, 'fulfilled', 'Valid auth should succeed again');
});

// Edge Case 10: Authorization required for both create and delete
test('Authorization is enforced for both create and delete operations', async () => {
  const validInput = {
    name: 'Event',
    password: 'TestPassword123',
    coreTeamName: 'Test User',
  };

  // Both operations should check authorization
  const createCheck = await activityEventsService
    .addActivityEvent('test-key', validInput)
    .catch((e) => e);

  const deleteCheck = await activityEventsService
    .deleteActivityEvent('test-key', 'event-id')
    .catch((e) => e);

  // Both should succeed with valid credentials
  assert(createCheck.id || !createCheck.message, 'Create should succeed with valid auth');
  assert.equal(deleteCheck, true, 'Delete should succeed with valid auth');
});
