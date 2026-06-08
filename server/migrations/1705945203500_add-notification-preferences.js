/* Migration: Add Notification Preferences Table
   Description: Per-user notification category opt-in/out settings
   Version: 1.0.0
   Date: 2026-06-06
*/

export const up = (pgm) => {
  pgm.createTable('notification_preferences', {
    id: { type: 'serial', primaryKey: true },
    user_id: { type: 'text', notNull: true },
    category: { type: 'text', notNull: true },
    email: { type: 'boolean', notNull: true, default: true },
    push: { type: 'boolean', notNull: true, default: true },
    in_app: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('notification_preferences', 'unique_user_category', {
    unique: ['user_id', 'category'],
  });

  pgm.createIndex('notification_preferences', 'user_id');
};

export const down = (pgm) => {
  pgm.dropTable('notification_preferences', { ifExists: true, cascade: true });
};
