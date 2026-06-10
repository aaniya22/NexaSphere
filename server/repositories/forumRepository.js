import { withDb } from './db.js';

function mapThreadRow(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    authorName: row.author_name,
    authorEmail: row.author_email,
    isPinned: row.is_pinned,
    isLocked: row.is_locked,
    isAnswered: row.is_answered,
    acceptedReplyId: row.accepted_reply_id,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
    upvotes: row.upvotes,
    replyCount: row.reply_count,
    viewCount: row.view_count,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReplyRow(row) {
  return {
    id: row.id,
    threadId: row.thread_id,
    content: row.content,
    authorName: row.author_name,
    authorEmail: row.author_email,
    upvotes: row.upvotes,
    isAccepted: row.is_accepted,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategoryRow(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    displayOrder: row.display_order,
    isActive: row.is_active,
    threadCount: row.thread_count || 0,
  };
}

export const forumRepository = {
  async getCategories() {
    if (!process.env.DATABASE_URL) {
      return [];
    }
    return withDb(async (client) => {
      const { rows } = await client.query(
        `select fc.*, count(ft.id)::int as thread_count
         from forum_categories fc
         left join forum_threads ft on ft.category_id = fc.id and ft.status = 'approved'
         where fc.is_active = true
         group by fc.id
         order by fc.display_order asc`
      );
      return rows.map(mapCategoryRow);
    });
  },

  async listThreads({ page = 1, limit = 20, category, q, sort = 'latest' } = {}) {
    if (!process.env.DATABASE_URL) {
      return { rows: [], total: 0 };
    }
    return withDb(async (client) => {
      const conditions = ["ft.status = 'approved'"];
      const params = [];
      let paramIdx = 1;

      if (category) {
        conditions.push(`fc.slug = $${paramIdx++}`);
        params.push(category);
      }

      if (q && q.trim().length >= 2) {
        conditions.push(`(ft.title ilike $${paramIdx} or ft.content ilike $${paramIdx})`);
        params.push(`%${q.trim()}%`);
        paramIdx++;
      }

      const where = conditions.join(' AND ');

      let orderBy;
      switch (sort) {
        case 'top':
          orderBy = 'ft.upvotes desc, ft.created_at desc';
          break;
        case 'unanswered':
          orderBy = 'ft.is_answered asc, ft.created_at desc';
          break;
        default:
          orderBy = 'ft.is_pinned desc, ft.created_at desc';
      }

      const offset = (page - 1) * limit;
      const listSql = `select ft.*, fc.name as category_name, fc.slug as category_slug
        from forum_threads ft
        join forum_categories fc on fc.id = ft.category_id
        where ${where}
        order by ${orderBy}
        limit $${paramIdx} offset $${paramIdx + 1}`;

      const countSql = `select count(*)::int as total
        from forum_threads ft
        join forum_categories fc on fc.id = ft.category_id
        where ${where}`;

      const { rows } = await client.query(listSql, [...params, limit, offset]);
      const countResult = await client.query(countSql, params);

      return { rows: rows.map(mapThreadRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },

  async getThreadById(id) {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    return withDb(async (client) => {
      const incrementViewSql = 'update forum_threads set view_count = view_count + 1 where id = $1';
      await client.query(incrementViewSql, [id]);
      const { rows } = await client.query(
        `select ft.*, fc.name as category_name, fc.slug as category_slug
         from forum_threads ft
         join forum_categories fc on fc.id = ft.category_id
         where ft.id = $1`,
        [id]
      );
      return rows.length ? mapThreadRow(rows[0]) : null;
    });
  },

  async createThread(input) {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    return withDb(async (client) => {
      const { title, content, category_id, author_name, author_email, tags } = input;
      const { rows } = await client.query(
        `insert into forum_threads (title, content, category_id, author_name, author_email, tags)
         values ($1, $2, $3, $4, $5, $6) returning *`,
        [title, content, category_id, author_name, author_email || null, JSON.stringify(tags || [])]
      );
      return rows.length ? mapThreadRow(rows[0]) : null;
    });
  },

  async updateThread(id, input) {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    return withDb(async (client) => {
      const sets = [];
      const params = [];
      let paramIdx = 1;

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          const column = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
          if (key === 'tags') {
            sets.push(`${column} = $${paramIdx++}`);
            params.push(JSON.stringify(value));
          } else {
            sets.push(`${column} = $${paramIdx++}`);
            params.push(value);
          }
        }
      }

      if (sets.length === 0) return null;
      sets.push(`updated_at = now()`);

      params.push(id);
      const updateSql = `update forum_threads set ${sets.join(', ')} where id = $${paramIdx} returning *`;
      const { rows } = await client.query(updateSql, params);
      return rows.length ? mapThreadRow(rows[0]) : null;
    });
  },

  async deleteThread(id) {
    if (!process.env.DATABASE_URL) {
      return false;
    }
    return withDb(async (client) => {
      const { rowCount } = await client.query('delete from forum_threads where id = $1', [id]);
      return (rowCount ?? 0) > 0;
    });
  },

  async listReplies(threadId, { page = 1, limit = 50 } = {}) {
    if (!process.env.DATABASE_URL) {
      return { rows: [], total: 0 };
    }
    return withDb(async (client) => {
      const offset = (page - 1) * limit;
      const listSql = `select * from forum_replies
        where thread_id = $1 and status = 'approved'
        order by is_accepted desc, upvotes desc, created_at asc
        limit $2 offset $3`;
      const countSql = `select count(*)::int as total from forum_replies
        where thread_id = $1 and status = 'approved'`;

      const { rows } = await client.query(listSql, [threadId, limit, offset]);
      const countResult = await client.query(countSql, [threadId]);
      return { rows: rows.map(mapReplyRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },

  async createReply(threadId, input) {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    return withDb(async (client) => {
      const { content, author_name, author_email } = input;
      const insertReplySql = `insert into forum_replies (thread_id, content, author_name, author_email)
        values ($1, $2, $3, $4) returning *`;
      const { rows } = await client.query(insertReplySql, [
        threadId,
        content,
        author_name,
        author_email || null,
      ]);
      const incrementReplyCountSql =
        'update forum_threads set reply_count = reply_count + 1, updated_at = now() where id = $1';
      await client.query(incrementReplyCountSql, [threadId]);
      return rows.length ? mapReplyRow(rows[0]) : null;
    });
  },

  async updateReply(id, content) {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    return withDb(async (client) => {
      const { rows } = await client.query(
        `update forum_replies set content = $1, updated_at = now() where id = $2 returning *`,
        [content, id]
      );
      return rows.length ? mapReplyRow(rows[0]) : null;
    });
  },

  async deleteReply(id) {
    if (!process.env.DATABASE_URL) {
      return false;
    }
    return withDb(async (client) => {
      const selectThreadSql = 'select thread_id from forum_replies where id = $1';
      const { rows } = await client.query(selectThreadSql, [id]);
      if (!rows.length) return false;

      const deleteReplySql = 'delete from forum_replies where id = $1';
      const { rowCount } = await client.query(deleteReplySql, [id]);
      if ((rowCount ?? 0) > 0) {
        const decrementReplySql =
          'update forum_threads set reply_count = greatest(0, reply_count - 1), updated_at = now() where id = $1';
        await client.query(decrementReplySql, [rows[0].thread_id]);
      }
      return (rowCount ?? 0) > 0;
    });
  },

  async voteThread(threadId, voterEmail, voteType = 'upvote') {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    return withDb(async (client) => {
      const selectVoteSql = `select id, vote_type from forum_votes
        where thread_id = $1 and voter_email = $2 and reply_id is null`;
      const existing = await client.query(selectVoteSql, [threadId, voterEmail]);

      if (existing.rows.length > 0) {
        const currentVote = existing.rows[0];
        if (currentVote.vote_type === voteType) {
          const deleteVoteSql = 'delete from forum_votes where id = $1';
          await client.query(deleteVoteSql, [currentVote.id]);
          const decrementThreadVoteSql =
            'update forum_threads set upvotes = greatest(0, upvotes - 1) where id = $1';
          await client.query(decrementThreadVoteSql, [threadId]);
          return { action: 'removed' };
        }
        const updateVoteSql = 'update forum_votes set vote_type = $1 where id = $2';
        await client.query(updateVoteSql, [voteType, currentVote.id]);
        const updateThreadVoteSql = `update forum_threads set upvotes = case when $1 = 'upvote' then upvotes + 1 else greatest(0, upvotes - 1) end where id = $2`;
        await client.query(updateThreadVoteSql, [voteType, threadId]);
        return { action: 'changed' };
      }

      const insertVoteSql =
        'insert into forum_votes (thread_id, voter_email, vote_type) values ($1, $2, $3)';
      await client.query(insertVoteSql, [threadId, voterEmail, voteType]);
      const incrementThreadVoteSql = 'update forum_threads set upvotes = upvotes + 1 where id = $1';
      await client.query(incrementThreadVoteSql, [threadId]);
      return { action: 'added' };
    });
  },

  async voteReply(replyId, voterEmail, voteType = 'upvote') {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    return withDb(async (client) => {
      const selectReplyVoteSql = `select id, vote_type from forum_votes
        where reply_id = $1 and voter_email = $2 and thread_id is null`;
      const existing = await client.query(selectReplyVoteSql, [replyId, voterEmail]);

      if (existing.rows.length > 0) {
        const currentVote = existing.rows[0];
        if (currentVote.vote_type === voteType) {
          const deleteVoteSql = 'delete from forum_votes where id = $1';
          await client.query(deleteVoteSql, [currentVote.id]);
          const decrementReplyVoteSql =
            'update forum_replies set upvotes = greatest(0, upvotes - 1) where id = $1';
          await client.query(decrementReplyVoteSql, [replyId]);
          return { action: 'removed' };
        }
        const updateVoteSql = 'update forum_votes set vote_type = $1 where id = $2';
        await client.query(updateVoteSql, [voteType, currentVote.id]);
        const updateReplyVoteSql = `update forum_replies set upvotes = case when $1 = 'upvote' then upvotes + 1 else greatest(0, upvotes - 1) end where id = $2`;
        await client.query(updateReplyVoteSql, [voteType, replyId]);
        return { action: 'changed' };
      }

      const insertReplyVoteSql =
        'insert into forum_votes (reply_id, voter_email, vote_type) values ($1, $2, $3)';
      await client.query(insertReplyVoteSql, [replyId, voterEmail, voteType]);
      const incrementReplyVoteSql = 'update forum_replies set upvotes = upvotes + 1 where id = $1';
      await client.query(incrementReplyVoteSql, [replyId]);
      return { action: 'added' };
    });
  },

  async acceptReply(threadId, replyId) {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    return withDb(async (client) => {
      await client.query(`update forum_replies set is_accepted = false where thread_id = $1`, [
        threadId,
      ]);
      await client.query(
        `update forum_replies set is_accepted = true where id = $1 and thread_id = $2`,
        [replyId, threadId]
      );
      await client.query(
        `update forum_threads set is_answered = true, accepted_reply_id = $1, updated_at = now() where id = $2`,
        [replyId, threadId]
      );
      return true;
    });
  },

  async moderateThread(id, status) {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    return withDb(async (client) => {
      const { rows } = await client.query(
        `update forum_threads set status = $1, updated_at = now() where id = $2 returning *`,
        [status, id]
      );
      return rows.length ? mapThreadRow(rows[0]) : null;
    });
  },

  async moderateReply(id, status) {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    return withDb(async (client) => {
      const { rows } = await client.query(
        `update forum_replies set status = $1, updated_at = now() where id = $2 returning *`,
        [status, id]
      );
      return rows.length ? mapReplyRow(rows[0]) : null;
    });
  },

  async adminListThreads({ page = 1, limit = 50, status, q } = {}) {
    if (!process.env.DATABASE_URL) {
      return { rows: [], total: 0 };
    }
    return withDb(async (client) => {
      const conditions = [];
      const params = [];
      let paramIdx = 1;

      if (status) {
        conditions.push(`ft.status = $${paramIdx++}`);
        params.push(status);
      }
      if (q && q.trim().length >= 2) {
        conditions.push(`(ft.title ilike $${paramIdx} or ft.content ilike $${paramIdx})`);
        params.push(`%${q.trim()}%`);
        paramIdx++;
      }

      const where = conditions.length ? `where ${conditions.join(' AND ')}` : '';
      const offset = (page - 1) * limit;

      const listSql = `select ft.*, fc.name as category_name, fc.slug as category_slug
        from forum_threads ft
        join forum_categories fc on fc.id = ft.category_id
        ${where}
        order by ft.created_at desc
        limit $${paramIdx} offset $${paramIdx + 1}`;

      const countSql = `select count(*)::int as total
        from forum_threads ft
        join forum_categories fc on fc.id = ft.category_id
        ${where}`;

      const { rows } = await client.query(listSql, [...params, limit, offset]);
      const countResult = await client.query(countSql, params);

      return { rows: rows.map(mapThreadRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },
};
