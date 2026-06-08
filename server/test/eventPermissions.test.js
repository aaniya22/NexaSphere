/**
 * Tests for permission-based event filtering on SSE broadcasts and
 * Socket.IO admin room segmentation (issue #968).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveAdminPermissions,
  adminCanReceiveEvent,
  getRoomsForPermissions,
  PERMISSION_EVENTS,
  ROLE_PERMISSIONS,
} from '../config/eventPermissions.js';
import {
  addSSEClient,
  broadcastSSEEvent,
  getConnectedSSEClientsCount,
  _resetSSEClientsForTests,
} from '../services/sseService.js';

// ---------- helpers ----------

function createMockRes() {
  const written = [];
  const res = {
    headersSent: true,
    _heartbeat: null,
    _droppedWrites: 0,
    on(event, handler) {
      this[`_on_${event}`] = handler;
    },
    write(chunk) {
      written.push(chunk.toString());
      return true;
    },
    end() {
      this._ended = true;
    },
  };
  res._written = written;
  return res;
}

// ---------- eventPermissions ----------

test('resolveAdminPermissions defaults to super_admin when session is missing', () => {
  const perms = resolveAdminPermissions(null);
  assert.ok(perms.has('super_admin'));
});

test('resolveAdminPermissions reads permissions from metadata', () => {
  const perms = resolveAdminPermissions({
    username: 'alice',
    metadata: { permissions: ['membership:read', 'events:read'] },
  });
  assert.ok(perms.has('membership:read'));
  assert.ok(perms.has('events:read'));
  assert.ok(!perms.has('core_team:read'));
});

test('resolveAdminPermissions reads role from metadata', () => {
  const perms = resolveAdminPermissions({
    username: 'bob',
    metadata: { role: 'membership_admin' },
  });
  assert.ok(perms.has('membership:read'));
  assert.ok(perms.has('membership:write'));
  assert.ok(!perms.has('events:read'));
});

test('resolveAdminPermissions ignores unknown permission strings', () => {
  const perms = resolveAdminPermissions({
    username: 'eve',
    metadata: { permissions: ['membership:read', 'totally:bogus'] },
  });
  assert.ok(perms.has('membership:read'));
  assert.ok(!perms.has('totally:bogus'));
});

test('adminCanReceiveEvent blocks events outside the permission scope', () => {
  const perms = new Set(['membership:read']);
  assert.ok(adminCanReceiveEvent('registration', perms));
  assert.ok(adminCanReceiveEvent('admin:new-registration', perms));
  assert.ok(!adminCanReceiveEvent('event_registration', perms));
  assert.ok(!adminCanReceiveEvent('admin:event-registration', perms));
});

test('adminCanReceiveEvent allows unknown events for any admin (backward compat)', () => {
  const perms = new Set(['membership:read']);
  assert.ok(adminCanReceiveEvent('some:unknown:event', perms));
});

test('adminCanReceiveEvent allows super_admin to receive every event', () => {
  const perms = new Set(['super_admin']);
  for (const eventName of [
    'registration',
    'event_registration',
    'admin:new-registration',
    'admin:event-registration',
  ]) {
    assert.ok(adminCanReceiveEvent(eventName, perms));
  }
});

test('getRoomsForPermissions returns shared admin-room for super_admin', () => {
  const rooms = getRoomsForPermissions(new Set(['super_admin']));
  assert.ok(rooms.includes('admin-room'));
});

test('getRoomsForPermissions returns role-scoped room for matching permissions', () => {
  const perms = new Set(['membership:read', 'membership:write', 'audit:read']);
  const rooms = getRoomsForPermissions(perms);
  assert.ok(rooms.includes('admin-room:membership_admin'));
  assert.ok(!rooms.includes('admin-room:events_admin'));
});

test('PERMISSION_EVENTS table covers all PII-carrying admin events', () => {
  const covered = new Set();
  for (const events of Object.values(PERMISSION_EVENTS)) {
    for (const e of events) covered.add(e);
  }
  for (const event of [
    'registration',
    'event_registration',
    'admin:new-registration',
    'admin:event-registration',
  ]) {
    assert.ok(covered.has(event), `${event} should be in PERMISSION_EVENTS`);
  }
});

test('ROLE_PERMISSIONS defines bounded permission sets (no super_admin duplication)', () => {
  for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
    if (role === 'super_admin') continue;
    assert.ok(perms.size > 0, `${role} should have at least one permission`);
    assert.ok(!perms.has('super_admin'), `${role} should not contain super_admin`);
  }
});

// ---------- sseService filtering ----------

test('SSE broadcast delivers events only to clients with matching permissions', () => {
  _resetSSEClientsForTests();

  const membershipAdmin = {
    username: 'alice',
    metadata: { permissions: ['membership:read'] },
  };
  const eventsAdmin = {
    username: 'bob',
    metadata: { permissions: ['events:read'] },
  };
  const auditor = {
    username: 'carol',
    metadata: { permissions: ['audit:read'] },
  };

  const resMembership = createMockRes();
  const resEvents = createMockRes();
  const resAuditor = createMockRes();

  addSSEClient(resMembership, membershipAdmin);
  addSSEClient(resEvents, eventsAdmin);
  addSSEClient(resAuditor, auditor);

  assert.equal(getConnectedSSEClientsCount(), 3);

  broadcastSSEEvent('registration', { formType: 'membership', fullName: 'Test User' });

  // membership admin should receive, events/audit should not
  assert.equal(resMembership._written.length, 1);
  assert.equal(resEvents._written.length, 0);
  assert.equal(resAuditor._written.length, 0);
  assert.match(resMembership._written[0], /event: registration/);

  broadcastSSEEvent('event_registration', { eventId: 'evt-1', fullName: 'Test User' });

  assert.equal(resEvents._written.length, 1);
  assert.equal(
    resMembership._written.length,
    1,
    'membership admin should not receive event_registration'
  );
  assert.match(resEvents._written[0], /event: event_registration/);

  _resetSSEClientsForTests();
});

test('SSE broadcast delivers to super_admin regardless of event type', () => {
  _resetSSEClientsForTests();

  const superAdmin = { username: 'root', metadata: { role: 'super_admin' } };
  const res = createMockRes();
  addSSEClient(res, superAdmin);

  broadcastSSEEvent('registration', { fullName: 'X' });
  broadcastSSEEvent('event_registration', { eventId: 'e1' });
  broadcastSSEEvent('admin:new-registration', { userName: 'X' });
  broadcastSSEEvent('admin:event-registration', { eventId: 'e1' });

  assert.equal(res._written.length, 4);
  _resetSSEClientsForTests();
});

test('SSE broadcast delivers unknown events to all clients (backward compat)', () => {
  _resetSSEClientsForTests();

  const limitedAdmin = { username: 'limited', metadata: { permissions: ['membership:read'] } };
  const res = createMockRes();
  addSSEClient(res, limitedAdmin);

  broadcastSSEEvent('custom:unknown:event', { foo: 'bar' });
  assert.equal(res._written.length, 1);
  _resetSSEClientsForTests();
});

test('addSSEClient is idempotent for the same response', () => {
  _resetSSEClientsForTests();

  const res = createMockRes();
  const admin = { username: 'alice', metadata: { permissions: ['membership:read'] } };

  addSSEClient(res, admin);
  addSSEClient(res, admin);
  addSSEClient(res, admin);

  assert.equal(getConnectedSSEClientsCount(), 1);
  _resetSSEClientsForTests();
});

test('addSSEClient gracefully handles null session (defaults to super_admin)', () => {
  _resetSSEClientsForTests();

  const res = createMockRes();
  addSSEClient(res, null);

  assert.equal(getConnectedSSEClientsCount(), 1);
  broadcastSSEEvent('registration', { fullName: 'X' });
  assert.equal(res._written.length, 1);
  _resetSSEClientsForTests();
});
