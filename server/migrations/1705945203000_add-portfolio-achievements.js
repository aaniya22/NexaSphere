/* Migration: Add Portfolio Achievements and enhanced portfolio fields
   Description: Adds achievements table and education/work/avatar fields to portfolios
   Version: 1.0.0
   Date: 2026-06-06
*/

export const up = (pgm) => {
  // Add new columns to portfolios table
  pgm.addColumns('portfolios', {
    avatar_url: { type: 'varchar(2048)', notNull: false, default: '' },
    education: { type: 'jsonb', notNull: false, default: '[]' },
    work_experience: { type: 'jsonb', notNull: false, default: '[]' },
  });

  // Create portfolio_achievements table
  pgm.createTable('portfolio_achievements', {
    id: { type: 'serial', primaryKey: true },
    username: {
      type: 'varchar(100)',
      notNull: true,
      references: 'portfolios(username)',
      onDelete: 'cascade',
    },
    name: { type: 'varchar(120)', notNull: true },
    description: { type: 'text' },
    tier: { type: 'varchar(40)', notNull: false, default: 'bronze' },
    icon_url: { type: 'varchar(2048)' },
    source: { type: 'varchar(60)' },
    awarded_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('portfolio_achievements', 'unique_achievement_per_user', {
    unique: ['username', 'name'],
  });

  pgm.createIndex('portfolio_achievements', 'username');
};

export const down = (pgm) => {
  pgm.dropTable('portfolio_achievements');
  pgm.dropColumns('portfolios', ['avatar_url', 'education', 'work_experience']);
};
