import { withDb, HAS_SUPABASE } from '../storage/supabaseClient.js';

export const registrationsRepository = {
  async findByEventId(eventId) {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM event_registrations WHERE event_id = $1 ORDER BY created_at ASC',
        [eventId]
      );
      return rows;
    });
  },

  async findByEmailAndEvent(email, eventId) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM event_registrations WHERE email = $1 AND event_id = $2 LIMIT 1',
        [email, eventId]
      );
      return rows[0] || null;
    });
  },

  async create({
    eventId,
    fullName,
    email,
    department,
    year,
    teamName,
    teamSize,
    customFields,
    waitlist,
  }) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO event_registrations (event_id, full_name, email, department, year, team_name, team_size, custom_fields, waitlist, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          eventId,
          fullName,
          email,
          department || null,
          year || null,
          teamName || null,
          teamSize || null,
          customFields ? JSON.stringify(customFields) : null,
          waitlist || false,
          waitlist ? 'waitlisted' : 'confirmed',
        ]
      );
      return rows[0];
    });
  },

  async updateStatus(id, status) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        'UPDATE event_registrations SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      return rows[0] || null;
    });
  },

  async promoteFromWaitlist(eventId) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE event_registrations SET status = 'confirmed', waitlist = false
         WHERE id = (
           SELECT id FROM event_registrations
           WHERE event_id = $1 AND waitlist = true AND status = 'waitlisted'
           ORDER BY created_at ASC LIMIT 1
         )
         RETURNING *`,
        [eventId]
      );
      return rows[0] || null;
    });
  },

  async markAttendance(id) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `UPDATE event_registrations SET attended = true, attended_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );
      return rows[0] || null;
    });
  },

  async findByTicketToken(token) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM event_registrations WHERE ticket_token = $1 LIMIT 1',
        [token]
      );
      return rows[0] || null;
    });
  },

  async updateTicketToken(id, token) {
    if (!HAS_SUPABASE) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        'UPDATE event_registrations SET ticket_token = $1 WHERE id = $2 RETURNING *',
        [token, id]
      );
      return rows[0];
    });
  },

  async getRegistrationStats(eventId) {
    if (!HAS_SUPABASE) return { total: 0, confirmed: 0, waitlisted: 0, attended: 0 };
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
           COUNT(*) FILTER (WHERE waitlist = true) AS waitlisted,
           COUNT(*) FILTER (WHERE attended = true) AS attended
         FROM event_registrations WHERE event_id = $1`,
        [eventId]
      );
      return rows[0] || { total: 0, confirmed: 0, waitlisted: 0, attended: 0 };
    });
  },

  async getDepartmentBreakdown(eventId) {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT department, COUNT(*) AS count
         FROM event_registrations WHERE event_id = $1 AND department IS NOT NULL
         GROUP BY department ORDER BY count DESC`,
        [eventId]
      );
      return rows;
    });
  },

  async getYearBreakdown(eventId) {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT year, COUNT(*) AS count
         FROM event_registrations WHERE event_id = $1 AND year IS NOT NULL
         GROUP BY year ORDER BY year`,
        [eventId]
      );
      return rows;
    });
  },

  async getWaitlist(eventId) {
    if (!HAS_SUPABASE) return [];
    return withDb(async (client) => {
      const { rows } = await client.query(
        `SELECT * FROM event_registrations
         WHERE event_id = $1 AND waitlist = true AND status = 'waitlisted'
         ORDER BY created_at ASC`,
        [eventId]
      );
      return rows;
    });
  },
};
