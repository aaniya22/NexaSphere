/* Migration: Create sponsorships table
   Description: Creates the sponsors table for sponsorship & partnership management
   Version: 1.0.0
   Date: 2026-06-15
*/

export const up = (pgm) => {
  pgm.createTable('sponsors', {
    id: { type: 'serial', primaryKey: true },
    company_name: { type: 'varchar(255)', notNull: true },
    logo_url: { type: 'varchar(2048)', notNull: false },
    description: { type: 'text', notNull: false },
    website_url: { type: 'varchar(2048)', notNull: false },
    contact_person: { type: 'varchar(255)', notNull: false },
    contact_email: { type: 'varchar(255)', notNull: false },
    tier: { type: 'varchar(50)', notNull: true, default: 'bronze' },
    agreement_start: { type: 'date', notNull: false },
    agreement_end: { type: 'date', notNull: false },
    amount: { type: 'numeric(10,2)', notNull: false },
    benefits: { type: 'jsonb', notNull: true, default: '[]' },
    status: { type: 'varchar(20)', notNull: true, default: 'active' },
    is_featured: { type: 'boolean', notNull: true, default: false },
    sort_order: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('sponsors', 'tier');
  pgm.createIndex('sponsors', 'status');
  pgm.createIndex('sponsors', 'is_featured');
  pgm.createIndex('sponsors', 'sort_order');
};

export const down = (pgm) => {
  pgm.dropTable('sponsors');
};
