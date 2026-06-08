/**
 * Event Permissions Configuration
 *
 * Maps event types emitted over SSE / Socket.IO to the admin permissions
 * required to receive them.  When `ADMIN_PERMISSIONS` is not configured
 * (e.g. during local development) every admin gets the `super_admin` role
 * which has access to all events.  This keeps the existing behaviour for
 * single-admin deployments.
 */

export const ALL_PERMISSIONS = 'super_admin';

const KNOWN_PERMISSIONS = new Set([
  'membership:read',
  'membership:write',
  'events:read',
  'events:write',
  'core_team:read',
  'core_team:write',
  'audit:read',
  'monitoring:read',
]);

/**
 * Permission → set of event names the permission unlocks.
 * Edit this table to add a new permission or change scope.
 */
export const PERMISSION_EVENTS = {
  'membership:read': ['registration', 'admin:new-registration'],
  'events:read': [
    'event_registration',
    'admin:event-registration',
    'admin:waitlist-promotion',
    'admin:attendance-marked',
  ],
  'core_team:read': ['core_team:update', 'admin:core-team-update'],
  'audit:read': ['audit:event'],
  'monitoring:read': ['monitoring:alert', 'admin:error-rate-threshold'],
};

/**
 * Reverse mapping: event name → set of required permissions.
 * Computed once at module load.
 */
export const EVENT_REQUIRED_PERMISSIONS = (() => {
  const map = new Map();
  for (const [permission, events] of Object.entries(PERMISSION_EVENTS)) {
    for (const eventName of events) {
      if (!map.has(eventName)) map.set(eventName, new Set());
      map.get(eventName).add(permission);
    }
  }
  return map;
})();

/**
 * Role → set of permissions.  A role is a named bundle of permissions.
 * Use `super_admin` for the catch-all legacy single-admin role.
 */
export const ROLE_PERMISSIONS = {
  super_admin: new Set([...KNOWN_PERMISSIONS]),
  membership_admin: new Set(['membership:read', 'membership:write', 'audit:read']),
  events_admin: new Set(['events:read', 'events:write', 'audit:read']),
  core_team_admin: new Set(['core_team:read', 'core_team:write']),
  auditor: new Set(['audit:read', 'monitoring:read']),
  monitor: new Set(['monitoring:read']),
};

/**
 * Permission set → list of Socket.IO room names the admin should join.
 * The room naming convention is `admin-room:<role>`.
 */
export function getRoomsForPermissions(permissions) {
  if (!permissions || permissions.size === 0) return [];
  const rooms = [];
  if (permissions.has(ALL_PERMISSIONS) || permissions.size === KNOWN_PERMISSIONS.size) {
    rooms.push('admin-room');
  }
  for (const [role, rolePerms] of Object.entries(ROLE_PERMISSIONS)) {
    if (role === 'super_admin') continue;
    const allMatch = [...rolePerms].every((p) => permissions.has(p));
    if (allMatch) rooms.push(`admin-room:${role}`);
  }
  return rooms;
}

/**
 * Resolve the effective permission set for an admin session.
 * Looks at `metadata.permissions` first, then `metadata.role`, then the
 * legacy `ADMIN_PERMISSIONS` environment variable, finally falls back to
 * `super_admin` so single-admin deployments keep working.
 */
export function resolveAdminPermissions(adminSession) {
  if (!adminSession || typeof adminSession !== 'object') {
    return new Set([ALL_PERMISSIONS]);
  }
  const meta =
    adminSession.metadata && typeof adminSession.metadata === 'object' ? adminSession.metadata : {};

  if (Array.isArray(meta.permissions) && meta.permissions.length > 0) {
    return new Set(
      meta.permissions.filter((p) => KNOWN_PERMISSIONS.has(p) || p === ALL_PERMISSIONS)
    );
  }
  if (typeof meta.role === 'string' && ROLE_PERMISSIONS[meta.role]) {
    return new Set(ROLE_PERMISSIONS[meta.role]);
  }
  return new Set([ALL_PERMISSIONS]);
}

/**
 * Check whether a permission set satisfies the requirements for an event.
 * If the event has no registered required permissions, every admin
 * receives it (preserves backward compatibility for unknown events).
 */
export function adminCanReceiveEvent(eventName, permissions) {
  const required = EVENT_REQUIRED_PERMISSIONS.get(eventName);
  if (!required || required.size === 0) return true;
  if (permissions.has(ALL_PERMISSIONS)) return true;
  for (const perm of required) {
    if (permissions.has(perm)) return true;
  }
  return false;
}
