export const up = (pgm) => {
  pgm.createTable('forum_categories', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(100)', notNull: true, unique: true },
    slug: { type: 'varchar(100)', notNull: true, unique: true },
    description: { type: 'text', notNull: false },
    icon: { type: 'varchar(50)', notNull: true, default: '📌' },
    display_order: { type: 'integer', notNull: true, default: 0 },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTable('forum_threads', {
    id: { type: 'serial', primaryKey: true },
    title: { type: 'varchar(255)', notNull: true },
    content: { type: 'text', notNull: true },
    category_id: {
      type: 'integer',
      notNull: true,
      references: 'forum_categories(id)',
      onDelete: 'CASCADE',
    },
    author_name: { type: 'varchar(255)', notNull: true },
    author_email: { type: 'varchar(255)' },
    is_pinned: { type: 'boolean', notNull: true, default: false },
    is_locked: { type: 'boolean', notNull: true, default: false },
    is_answered: { type: 'boolean', notNull: true, default: false },
    accepted_reply_id: { type: 'integer' },
    tags: { type: 'jsonb', notNull: true, default: '[]' },
    upvotes: { type: 'integer', notNull: true, default: 0 },
    reply_count: { type: 'integer', notNull: true, default: 0 },
    view_count: { type: 'integer', notNull: true, default: 0 },
    status: { type: 'varchar(20)', notNull: true, default: 'approved' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('forum_threads', 'category_id');
  pgm.createIndex('forum_threads', 'status');
  pgm.createIndex('forum_threads', 'created_at');
  pgm.createIndex('forum_threads', 'is_pinned');
  pgm.createIndex('forum_threads', 'author_email');

  pgm.createTable('forum_replies', {
    id: { type: 'serial', primaryKey: true },
    thread_id: {
      type: 'integer',
      notNull: true,
      references: 'forum_threads(id)',
      onDelete: 'CASCADE',
    },
    content: { type: 'text', notNull: true },
    author_name: { type: 'varchar(255)', notNull: true },
    author_email: { type: 'varchar(255)' },
    upvotes: { type: 'integer', notNull: true, default: 0 },
    is_accepted: { type: 'boolean', notNull: true, default: false },
    status: { type: 'varchar(20)', notNull: true, default: 'approved' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('forum_replies', 'thread_id');
  pgm.createIndex('forum_replies', 'created_at');

  pgm.createTable('forum_votes', {
    id: { type: 'serial', primaryKey: true },
    thread_id: {
      type: 'integer',
      notNull: false,
      references: 'forum_threads(id)',
      onDelete: 'CASCADE',
    },
    reply_id: {
      type: 'integer',
      notNull: false,
      references: 'forum_replies(id)',
      onDelete: 'CASCADE',
    },
    voter_email: { type: 'varchar(255)', notNull: true },
    vote_type: { type: 'varchar(10)', notNull: true, default: 'upvote' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('forum_votes', 'thread_id');
  pgm.createIndex('forum_votes', 'reply_id');
  pgm.createIndex('forum_votes', 'voter_email');

  pgm.createIndex('forum_votes', 'thread_id', {
    name: 'idx_votes_thread_voter',
    unique: true,
    where: 'voter_email IS NOT NULL AND thread_id IS NOT NULL AND reply_id IS NULL',
  });
  pgm.createIndex('forum_votes', 'reply_id', {
    name: 'idx_votes_reply_voter',
    unique: true,
    where: 'voter_email IS NOT NULL AND reply_id IS NOT NULL AND thread_id IS NULL',
  });

  pgm.sql(`
    INSERT INTO forum_categories (name, slug, description, icon, display_order) VALUES
      ('General', 'general', 'General discussions about the club and community', '💬', 1),
      ('Events', 'events', 'Questions and discussions about past and upcoming events', '📅', 2),
      ('Technical Help', 'technical-help', 'Get help with technical issues, code, and projects', '💻', 3),
      ('Projects', 'projects', 'Share and discuss community projects', '🚀', 4),
      ('Career', 'career', 'Career advice, internships, and professional development', '🎯', 5);
  `);
};

export const down = (pgm) => {
  pgm.dropTable('forum_votes');
  pgm.dropTable('forum_replies');
  pgm.dropTable('forum_threads');
  pgm.dropTable('forum_categories');
};
