/* Migration: Create Users Table
   Description: Creates users table for notification preferences and auth
   Version: 1.0.0
   Date: 2026-06-09
*/

export const up = (pgm) => {
  pgm.createTable('users', {
    id: { type: 'text', primaryKey: true, notNull: true },
    username: { type: 'text', notNull: true },
    email: { type: 'text' },
    display_name: { type: 'text' },
    role: { type: 'text', notNull: true, default: 'user' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('users', 'username', { unique: true });
  pgm.createIndex('users', 'email');
};

export const down = (pgm) => {
  pgm.dropTable('users', { ifExists: true, cascade: true });
};
