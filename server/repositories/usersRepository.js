import { withDb } from './db.js';

export const usersRepository = {
  async getAllPublicUsers() {
    return withDb(async (client) => {
      const { rows } = await client.query(`
        SELECT 
          id, 
          username, 
          display_name, 
          avatar_url, 
          bio, 
          created_at as joined_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 100
      `);
      return rows;
    });
  },

  async getAllUsersAdmin() {
    return withDb(async (client) => {
      const { rows } = await client.query(`
        SELECT 
          id, 
          username, 
          display_name, 
          avatar_url, 
          bio, 
          created_at as joined_at,
          email,
          admin_roles,
          last_login
        FROM users
        ORDER BY created_at DESC
      `);
      return rows;
    });
  },

  async createUser({ username, display_name, email, role }) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users (username, display_name, email, admin_roles, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, username, display_name, email, admin_roles, created_at as joined_at`,
        [username, display_name, email, role || 'member']
      );
      return rows[0];
    });
  },

  async updateUser(id, updates) {
    return withDb(async (client) => {
      const fields = [];
      const values = [];
      let i = 1;
      if (updates.display_name !== undefined) { fields.push(`display_name = $${i++}`); values.push(updates.display_name); }
      if (updates.email !== undefined) { fields.push(`email = $${i++}`); values.push(updates.email); }
      if (updates.admin_roles !== undefined) { fields.push(`admin_roles = $${i++}`); values.push(updates.admin_roles); }
      if (fields.length === 0) return null;
      values.push(id);
      const { rows } = await client.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, username, display_name, email, admin_roles, created_at as joined_at`,
        values
      );
      return rows[0] || null;
    });
  },

  async deactivateUser(id) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE users SET admin_roles = 'deactivated' WHERE id = $1
         RETURNING id, username, display_name, email, admin_roles`,
        [id]
      );
      return rows[0] || null;
    });
  },
};