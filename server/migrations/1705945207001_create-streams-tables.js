export const up = (pgm) => {
  pgm.createTable('streams', {
    id: { type: 'serial', primaryKey: true },
    event_id: { type: 'text', notNull: true },
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text', notNull: false },
    stream_url: { type: 'text', notNull: false },
    hls_url: { type: 'text', notNull: false },
    status: { type: 'varchar(20)', notNull: true, default: 'scheduled' },
    scheduled_start: { type: 'timestamptz', notNull: false },
    started_at: { type: 'timestamptz', notNull: false },
    ended_at: { type: 'timestamptz', notNull: false },
    recording_url: { type: 'text', notNull: false },
    recording_duration: { type: 'integer', notNull: false },
    chat_enabled: { type: 'boolean', notNull: true, default: true },
    polls_enabled: { type: 'boolean', notNull: true, default: true },
    viewer_count: { type: 'integer', notNull: true, default: 0 },
    max_viewers: { type: 'integer', notNull: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('streams', 'event_id');
  pgm.createIndex('streams', 'status');

  pgm.createTable('stream_chat_messages', {
    id: { type: 'serial', primaryKey: true },
    stream_id: { type: 'integer', notNull: true, references: 'streams(id)', onDelete: 'CASCADE' },
    user_name: { type: 'varchar(255)', notNull: true },
    user_email: { type: 'varchar(255)', notNull: false },
    message: { type: 'text', notNull: true },
    is_moderated: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('stream_chat_messages', 'stream_id');
  pgm.createIndex('stream_chat_messages', 'created_at');

  pgm.createTable('stream_polls', {
    id: { type: 'serial', primaryKey: true },
    stream_id: { type: 'integer', notNull: true, references: 'streams(id)', onDelete: 'CASCADE' },
    question: { type: 'text', notNull: true },
    options: { type: 'jsonb', notNull: true, default: '[]' },
    votes: { type: 'jsonb', notNull: true, default: '{}' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('stream_polls', 'stream_id');
};

export const down = (pgm) => {
  pgm.dropTable('stream_polls');
  pgm.dropTable('stream_chat_messages');
  pgm.dropTable('streams');
};
