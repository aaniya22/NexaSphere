import { withDb } from './db.js';

function mapStreamRow(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    description: row.description,
    streamUrl: row.stream_url,
    hlsUrl: row.hls_url,
    status: row.status,
    scheduledStart: row.scheduled_start,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    recordingUrl: row.recording_url,
    recordingDuration: row.recording_duration,
    chatEnabled: row.chat_enabled,
    pollsEnabled: row.polls_enabled,
    viewerCount: row.viewer_count,
    maxViewers: row.max_viewers,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapChatRow(row) {
  return {
    id: row.id,
    streamId: row.stream_id,
    userName: row.user_name,
    userEmail: row.user_email,
    message: row.message,
    isModerated: row.is_moderated,
    createdAt: row.created_at,
  };
}

function mapPollRow(row) {
  return {
    id: row.id,
    streamId: row.stream_id,
    question: row.question,
    options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
    votes: typeof row.votes === 'string' ? JSON.parse(row.votes) : (row.votes || {}),
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export const streamRepository = {
  async listStreams({ page = 1, limit = 20, status, event_id } = {}) {
    if (!process.env.DATABASE_URL) return { rows: [], total: 0 };
    return withDb(async (client) => {
      const conditions = [];
      const params = [];
      let paramIdx = 1;

      if (status) {
        conditions.push(`s.status = $${paramIdx++}`);
        params.push(status);
      }
      if (event_id) {
        conditions.push(`s.event_id = $${paramIdx++}`);
        params.push(event_id);
      }

      const where = conditions.length ? `where ${conditions.join(' AND ')}` : '';
      const offset = (page - 1) * limit;

      const listSql = `select s.* from streams s ${where} order by s.scheduled_start desc nulls last, s.created_at desc limit $${paramIdx} offset $${paramIdx + 1}`;
      const countSql = `select count(*)::int as total from streams s ${where}`;

      const { rows } = await client.query(listSql, [...params, limit, offset]);
      const countResult = await client.query(countSql, params);

      return { rows: rows.map(mapStreamRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },

  async getStreamById(id) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const { rows } = await client.query('select * from streams where id = $1', [id]);
      return rows.length ? mapStreamRow(rows[0]) : null;
    });
  },

  async getStreamByEventId(eventId) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const { rows } = await client.query('select * from streams where event_id = $1 order by created_at desc limit 1', [eventId]);
      return rows.length ? mapStreamRow(rows[0]) : null;
    });
  },

  async createStream(input) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into streams (event_id, title, description, stream_url, hls_url, scheduled_start, max_viewers, chat_enabled, polls_enabled) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
        [input.event_id, input.title, input.description || '', input.stream_url || '', input.hls_url || '', input.scheduled_start ? new Date(input.scheduled_start) : null, input.max_viewers || null, input.chat_enabled !== false, input.polls_enabled !== false]
      );
      return rows.length ? mapStreamRow(rows[0]) : null;
    });
  },

  async updateStream(id, input) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const sets = ['updated_at = now()'];
      const params = [];
      let paramIdx = 1;

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          const column = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          sets.push(`${column} = $${paramIdx++}`);
          params.push(value);
        }
      }

      params.push(id);
      const updateSql = `update streams set ${sets.join(', ')} where id = $${paramIdx} returning *`;
      const { rows } = await client.query(updateSql, params);
      return rows.length ? mapStreamRow(rows[0]) : null;
    });
  },

  async setStreamStatus(id, status) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      let extraClause = '';
      if (status === 'live') extraClause = ', started_at = now()';
      else if (status === 'ended' || status === 'archived') extraClause = ', ended_at = now()';
      const updateSql = `update streams set status = $1, updated_at = now()${extraClause} where id = $2 returning *`;
      const { rows } = await client.query(updateSql, [status, id]);
      return rows.length ? mapStreamRow(rows[0]) : null;
    });
  },

  async incrementViewerCount(id) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const incrementSql = 'update streams set viewer_count = viewer_count + 1 where id = $1 returning viewer_count';
      const { rows } = await client.query(incrementSql, [id]);
      return rows.length ? rows[0].viewer_count : null;
    });
  },

  async deleteStream(id) {
    if (!process.env.DATABASE_URL) return false;
    return withDb(async (client) => {
      const { rowCount } = await client.query('delete from streams where id = $1', [id]);
      return (rowCount ?? 0) > 0;
    });
  },

  async addChatMessage(streamId, input) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into stream_chat_messages (stream_id, user_name, user_email, message) values ($1, $2, $3, $4) returning *`,
        [streamId, input.user_name, input.user_email || '', input.message]
      );
      return rows.length ? mapChatRow(rows[0]) : null;
    });
  },

  async listChatMessages(streamId, { page = 1, limit = 100 } = {}) {
    if (!process.env.DATABASE_URL) return { rows: [], total: 0 };
    return withDb(async (client) => {
      const offset = (page - 1) * limit;
      const listSql = `select * from stream_chat_messages where stream_id = $1 order by created_at asc limit $2 offset $3`;
      const countSql = `select count(*)::int as total from stream_chat_messages where stream_id = $1`;

      const { rows } = await client.query(listSql, [streamId, limit, offset]);
      const countResult = await client.query(countSql, [streamId]);

      return { rows: rows.map(mapChatRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },

  async moderateChatMessage(messageId) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const { rows } = await client.query('update stream_chat_messages set is_moderated = true where id = $1 returning *', [messageId]);
      return rows.length ? mapChatRow(rows[0]) : null;
    });
  },

  async createPoll(streamId, input) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const votesInit = {};
      input.options.forEach((_, i) => { votesInit[String(i)] = 0; });
      const { rows } = await client.query(
        `insert into stream_polls (stream_id, question, options, votes) values ($1, $2, $3, $4) returning *`,
        [streamId, input.question, JSON.stringify(input.options), JSON.stringify(votesInit)]
      );
      return rows.length ? mapPollRow(rows[0]) : null;
    });
  },

  async listPolls(streamId) {
    if (!process.env.DATABASE_URL) return [];
    return withDb(async (client) => {
      const { rows } = await client.query('select * from stream_polls where stream_id = $1 order by created_at desc', [streamId]);
      return rows.map(mapPollRow);
    });
  },

  async votePoll(pollId, optionIndex) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const { rows } = await client.query('select * from stream_polls where id = $1', [pollId]);
      if (!rows.length) return null;

      const poll = rows[0];
      const votes = typeof poll.votes === 'string' ? JSON.parse(poll.votes) : (poll.votes || {});
      const key = String(optionIndex);
      votes[key] = (votes[key] || 0) + 1;

      const { rows: updated } = await client.query('update stream_polls set votes = $1 where id = $2 returning *', [JSON.stringify(votes), pollId]);
      return updated.length ? mapPollRow(updated[0]) : null;
    });
  },

  async closePoll(pollId) {
    if (!process.env.DATABASE_URL) return null;
    return withDb(async (client) => {
      const { rows } = await client.query('update stream_polls set is_active = false where id = $1 returning *', [pollId]);
      return rows.length ? mapPollRow(rows[0]) : null;
    });
  },

  async adminListAll({ page = 1, limit = 50, status } = {}) {
    if (!process.env.DATABASE_URL) return { rows: [], total: 0 };
    return withDb(async (client) => {
      const conditions = [];
      const params = [];
      let paramIdx = 1;

      if (status) {
        conditions.push(`s.status = $${paramIdx++}`);
        params.push(status);
      }

      const where = conditions.length ? `where ${conditions.join(' AND ')}` : '';
      const offset = (page - 1) * limit;

      const listSql = `select s.* from streams s ${where} order by s.created_at desc limit $${paramIdx} offset $${paramIdx + 1}`;
      const countSql = `select count(*)::int as total from streams s ${where}`;

      const { rows } = await client.query(listSql, [...params, limit, offset]);
      const countResult = await client.query(countSql, params);

      return { rows: rows.map(mapStreamRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },
};
