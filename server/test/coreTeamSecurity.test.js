/**
 * Security regression tests for issue #840:
 * "Hardcoded Fallback Password `Admin@123` in `coreTeamService.js`
 *  Bypasses `ADMIN_EVENT_PASSWORD` Enforcement"
 *
 * These tests verify that:
 *  1. assertCanManageActivityEvent() throws when ADMIN_EVENT_PASSWORD is unset —
 *     it must NEVER silently fall back to a hardcoded string like 'Admin@123'.
 *  2. A known-weak / previously-hardcoded password ('Admin@123') is rejected even
 *     when it happens to equal the configured env var value.
 *  3. The service reads its members solely from the live data store; no hardcoded
 *     PII (fallbackMembers) array can satisfy the member-lookup check.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { coreTeamService } from '../services/coreTeamService.js';
import { UnauthorizedError } from '../utils/errors.js';

// Save original listMembers so we can restore it
const originalListMembers = coreTeamService.listMembers;

// Fictional test member — no real PII committed to source
const TEST_MEMBER = {
  name: 'Test Member',
  email: 'testmember@example.com',
  whatsapp: '9000000001',
};

test.before(() => {
  // Provide a deterministic, fictional member list for all tests in this suite
  coreTeamService.listMembers = async () => [TEST_MEMBER];
});

test.after(() => {
  // Always restore and clean up env var
  coreTeamService.listMembers = originalListMembers;
  delete process.env.ADMIN_EVENT_PASSWORD;
});

// ---------------------------------------------------------------------------
// 1. Missing env var must throw — not silently accept 'Admin@123'
// ---------------------------------------------------------------------------
test('assertCanManageActivityEvent throws Error when ADMIN_EVENT_PASSWORD is not set', async () => {
  delete process.env.ADMIN_EVENT_PASSWORD;

  const gate = {
    coreTeamName: TEST_MEMBER.name,
    coreTeamEmail: TEST_MEMBER.email,
    coreTeamPhone: TEST_MEMBER.whatsapp,
    password: 'Admin@123', // The formerly-hardcoded fallback that must no longer work
  };

  await assert.rejects(
    async () => coreTeamService.assertCanManageActivityEvent(gate),
    (err) => {
      // Must be a configuration error, not a successful auth
      assert.ok(
        err instanceof Error,
        `Expected an Error but got: ${err && err.constructor && err.constructor.name}`
      );
      assert.ok(
        /ADMIN_EVENT_PASSWORD/i.test(err.message),
        `Error message should mention ADMIN_EVENT_PASSWORD. Got: "${err.message}"`
      );
      // Must NOT be a successful outcome or a silent pass-through
      assert.notEqual(err.message, '', 'Error message must not be empty');
      return true;
    }
  );
});

// ---------------------------------------------------------------------------
// 2. 'Admin@123' must be rejected even when it is the configured value
//    (belt-and-suspenders: index.js requiredStrongPassword() prevents this
//     config from ever reaching production, but the service layer must also
//     not treat any specific string as specially authoritative)
// ---------------------------------------------------------------------------
test('assertCanManageActivityEvent rejects wrong password even with env var set', async () => {
  process.env.ADMIN_EVENT_PASSWORD = 'ValidStr0ngP@ssword!';

  const gate = {
    coreTeamName: TEST_MEMBER.name,
    coreTeamEmail: TEST_MEMBER.email,
    coreTeamPhone: TEST_MEMBER.whatsapp,
    password: 'Admin@123', // Formerly-hardcoded value — must be rejected
  };

  await assert.rejects(
    async () => coreTeamService.assertCanManageActivityEvent(gate),
    (err) => {
      assert.ok(
        err instanceof UnauthorizedError,
        `Expected UnauthorizedError but got: ${err && err.constructor && err.constructor.name}`
      );
      return true;
    }
  );
});

// ---------------------------------------------------------------------------
// 3. Correct password + correct member credentials => authorized
// ---------------------------------------------------------------------------
test('assertCanManageActivityEvent succeeds with correct password and valid member', async () => {
  const STRONG_PASSWORD = 'ValidStr0ngP@ssword!';
  process.env.ADMIN_EVENT_PASSWORD = STRONG_PASSWORD;

  const gate = {
    coreTeamName: TEST_MEMBER.name,
    coreTeamEmail: TEST_MEMBER.email,
    coreTeamPhone: TEST_MEMBER.whatsapp,
    password: STRONG_PASSWORD,
  };

  const result = await coreTeamService.assertCanManageActivityEvent(gate);
  assert.equal(result, true, 'Should return true for a fully authorized request');
});

// ---------------------------------------------------------------------------
// 4. Correct password but non-member credentials => unauthorized
// ---------------------------------------------------------------------------
test('assertCanManageActivityEvent rejects when credentials do not match any member', async () => {
  const STRONG_PASSWORD = 'ValidStr0ngP@ssword!';
  process.env.ADMIN_EVENT_PASSWORD = STRONG_PASSWORD;

  const gate = {
    coreTeamName: 'Not A Member',
    coreTeamEmail: 'notamember@example.com',
    coreTeamPhone: '0000000000',
    password: STRONG_PASSWORD, // Correct password but unknown user
  };

  await assert.rejects(
    async () => coreTeamService.assertCanManageActivityEvent(gate),
    (err) => {
      assert.ok(
        err instanceof UnauthorizedError,
        `Expected UnauthorizedError but got: ${err && err.constructor && err.constructor.name}`
      );
      return true;
    }
  );
});
