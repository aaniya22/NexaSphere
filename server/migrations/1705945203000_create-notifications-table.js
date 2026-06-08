/* Migration: Create Notifications Table
   Description: Persistent storage for user notifications with TTL-based expiration
   Version: 1.0.3
   Date: 2026-05-26
   Author: NexaSphere Core Team

   Tables:
   - notifications: user-scoped notification records with 30-day TTL
*/

export const up = (pgm) => {
  pgm.createTable('notifications', {
    id: { type: 'text', primaryKey: true, notNull: true },
    user_id: { type: 'text', notNull: true, default: 'global' },
    type: { type: 'text', notNull: true, default: 'system' },
    title: { type: 'text', notNull: true, default: 'Notification' },
    message: { type: 'text', notNull: true, default: '' },
    link: { type: 'text' },
    is_read: { type: 'boolean', notNull: true, default: false },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    expires_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func("now() + interval '30 days'"),
    },
  });

  pgm.createIndex('notifications', ['user_id', 'created_at'], {
    name: 'idx_notifications_user_created',
    direction: { created_at: 'DESC' },
  });
  pgm.createIndex('notifications', 'expires_at', {
    name: 'idx_notifications_expires_at',
  });
};

export const down = (pgm) => {
  pgm.dropTable('notifications', { ifExists: true, cascade: true });
};
