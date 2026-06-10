/* Migration: Create Push Subscriptions Table
   Description: Stores Web Push API subscription endpoints for notifications
   Version: 1.0.0
   Date: 2026-06-09
*/

export const up = (pgm) => {
  pgm.createTable('push_subscriptions', {
    endpoint: { type: 'text', primaryKey: true, notNull: true },
    p256dh: { type: 'text', notNull: true },
    auth: { type: 'text', notNull: true },
    subscription: { type: 'jsonb', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
};

export const down = (pgm) => {
  pgm.dropTable('push_subscriptions', { ifExists: true, cascade: true });
};
