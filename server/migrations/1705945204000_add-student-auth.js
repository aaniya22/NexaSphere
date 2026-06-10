/* Migration: Add Student Authentication tables
   Description: Creates student_users table for OAuth/SSO authentication
   Version: 1.0.0
   Date: 2026-06-06
*/

export const up = (pgm) => {
  pgm.createTable('student_users', {
    id: { type: 'serial', primaryKey: true },
    provider: { type: 'varchar(40)', notNull: true },
    provider_id: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true },
    full_name: { type: 'varchar(255)', notNull: false },
    avatar_url: { type: 'varchar(2048)' },
    role: { type: 'varchar(40)', notNull: true, default: 'student' },
    scopes: { type: 'jsonb', notNull: true, default: '[]' },
    last_login_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('student_users', 'unique_provider_account', {
    unique: ['provider', 'provider_id'],
  });

  pgm.createIndex('student_users', 'email');
};

export const down = (pgm) => {
  pgm.dropTable('student_users');
};
