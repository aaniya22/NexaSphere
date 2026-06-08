import { withDb } from './db.js';

function mapRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link,
    isRead: row.is_read,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export const notificationsRepository = {
  async list({ userId = 'global', limit = 100, offset = 0 } = {}) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `select * from notifications
         where user_id = $1
         order by created_at desc
         limit $2 offset $3`,
        [userId, limit, offset]
      );
      return rows.map(mapRow);
    });
  },

  async create(note) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into notifications (id, user_id, type, title, message, link, is_read)
         values ($1,$2,$3,$4,$5,$6,$7)
         returning *`,
        [note.id, note.userId, note.type, note.title, note.message, note.link, note.isRead]
      );
      return mapRow(rows[0]);
    });
  },

  async markAsRead(userId, id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        'update notifications set is_read = true where user_id = $1 and id = $2',
        [userId, id]
      );
      return rowCount > 0;
    });
  },

  async markAllAsRead(userId) {
    return withDb(async (client) => {
      await client.query(
        'update notifications set is_read = true where user_id = $1 and is_read = false',
        [userId]
      );
    });
  },

  async remove(userId, id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        'delete from notifications where user_id = $1 and id = $2',
        [userId, id]
      );
      return rowCount > 0;
    });
  },

  async clearAll(userId) {
    return withDb(async (client) => {
      await client.query('delete from notifications where user_id = $1', [userId]);
    });
  },

  async deleteExpired() {
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        'delete from notifications where expires_at <= now()'
      );
      return rowCount;
    });
  },
};
