import { withDb } from './db.js';

export const usersRepository = {
  async getAllPublicUsers() {
    return withDb(async (client) => {
      // Security Improvement: Only SELECT necessary public fields from DB
      // rather than fetching password_hash, reset_tokens, etc.
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
      // Admin gets more fields, but still avoids raw SELECT *
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
};
