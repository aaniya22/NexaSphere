exports.up = (pgm) => {
  // Add metadata columns to events table for ticketing support
  pgm.addColumns('events', {
    has_ticketing: { type: 'boolean', notNull: true, default: false },
    venue_floor_plan_url: { type: 'text' },
    organizer_payout_details: { type: 'jsonb' },
  });

  // Ticket Types definition (GA, VIP, etc.)
  pgm.createTable('ticket_types', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    event_id: { type: 'uuid', notNull: true, references: '"events"', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    base_price: { type: 'numeric(10,2)', notNull: true, default: 0 },
    quantity_available: { type: 'integer', notNull: true },
    max_per_order: { type: 'integer', default: 10 },
    is_transferable: { type: 'boolean', default: true },
    requires_verification: { type: 'boolean', default: false },
    start_sale_date: { type: 'timestamp' },
    end_sale_date: { type: 'timestamp' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Pricing Tiers for time-based or quantity-based dynamic pricing
  pgm.createTable('ticket_pricing_tiers', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    ticket_type_id: {
      type: 'uuid',
      notNull: true,
      references: '"ticket_types"',
      onDelete: 'CASCADE',
    },
    tier_name: { type: 'varchar(255)', notNull: true },
    price: { type: 'numeric(10,2)', notNull: true },
    start_date: { type: 'timestamp' },
    end_date: { type: 'timestamp' },
    min_quantity: { type: 'integer', default: 1 },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Discount codes and referral system
  pgm.createTable('discount_codes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    code: { type: 'varchar(50)', notNull: true, unique: true },
    type: { type: 'varchar(20)', notNull: true }, // 'percentage' | 'fixed_amount'
    value: { type: 'numeric(10,2)', notNull: true },
    usage_limit: { type: 'integer' },
    times_used: { type: 'integer', default: 0 },
    expires_at: { type: 'timestamp' },
    event_id: { type: 'uuid', references: '"events"', onDelete: 'CASCADE' },
    is_referral: { type: 'boolean', default: false },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // High-level Orders
  pgm.createTable('orders', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: '"users"' },
    event_id: { type: 'uuid', notNull: true, references: '"events"' },
    total_amount: { type: 'numeric(10,2)', notNull: true },
    status: { type: 'varchar(20)', notNull: true, default: 'pending' },
    payment_intent_id: { type: 'varchar(255)' },
    discount_code_id: { type: 'uuid', references: '"discount_codes"' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Physical Seats for venue assignment
  pgm.createTable('seats', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    event_id: { type: 'uuid', notNull: true, references: '"events"', onDelete: 'CASCADE' },
    seat_number: { type: 'varchar(50)', notNull: true },
    row_number: { type: 'varchar(50)' },
    section: { type: 'varchar(100)' },
    is_available: { type: 'boolean', default: true },
    venue_map_coords: { type: 'jsonb' }, // For frontend canvas mapping
  });

  // Individual Issued Tickets
  pgm.createTable('tickets', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    order_id: { type: 'uuid', notNull: true, references: '"orders"', onDelete: 'CASCADE' },
    ticket_type_id: { type: 'uuid', notNull: true, references: '"ticket_types"' },
    owner_user_id: { type: 'uuid', references: '"users"' },
    qr_code_data: { type: 'text', notNull: true, unique: true },
    status: { type: 'varchar(20)', notNull: true, default: 'valid' }, // 'valid', 'checked_in', 'refunded'
    check_in_time: { type: 'timestamp' },
    seat_id: { type: 'uuid', references: '"seats"' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  pgm.createIndex('tickets', 'qr_code_data');
};

exports.down = (pgm) => {
  pgm.dropTable('tickets');
  pgm.dropTable('seats');
  pgm.dropTable('orders');
  pgm.dropTable('discount_codes');
  pgm.dropTable('ticket_pricing_tiers');
  pgm.dropTable('ticket_types');
  pgm.dropColumns('events', ['has_ticketing', 'venue_floor_plan_url', 'organizer_payout_details']);
};
