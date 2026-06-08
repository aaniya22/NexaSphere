import { withDb } from '../repositories/db.js';
import { HAS_SUPABASE } from '../storage/supabaseClient.js';

export const achievementsRepository = {
  async ensureSchema() {
    if (!HAS_SUPABASE) return;
    return withDb(async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS portfolio_achievements (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) NOT NULL REFERENCES portfolios(username) ON DELETE CASCADE,
          name VARCHAR(120) NOT NULL,
          description TEXT,
          tier VARCHAR(40) DEFAULT 'bronze',
          icon_url VARCHAR(2048),
          source VARCHAR(60),
          awarded_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(username, name)
        )
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_achievements_username ON portfolio_achievements(username)
      `);
    });
  },

  async getByUsername(username) {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM portfolio_achievements WHERE username = $1 ORDER BY awarded_at DESC',
        [username]
      );
      return rows;
    });
  },

  async award(username, { name, description, tier, iconUrl, source }) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO portfolio_achievements (username, name, description, tier, icon_url, source)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (username, name) DO UPDATE SET
           description = EXCLUDED.description,
           tier = EXCLUDED.tier,
           icon_url = EXCLUDED.icon_url,
           source = EXCLUDED.source,
           awarded_at = NOW()
         RETURNING *`,
        [username, name, description || null, tier || 'bronze', iconUrl || null, source || null]
      );
      return rows[0];
    });
  },

  async remove(username, achievementName) {
    if (!HAS_SUPABASE) return false;
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        'DELETE FROM portfolio_achievements WHERE username = $1 AND name = $2',
        [username, achievementName]
      );
      return rowCount > 0;
    });
  },

  async listAll() {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM portfolio_achievements ORDER BY awarded_at DESC'
      );
      return rows;
    });
  },
};
