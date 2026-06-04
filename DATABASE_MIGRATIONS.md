# Database Migrations

This document tracks database schema changes.

## Migrations Strategy

We use `node-pg-migrate` to manage PostgreSQL schema changes.

- To create a new migration: `npm run migrate:create <name>`
- To apply migrations: `npm run migrate:latest`
- To rollback: `npm run migrate:rollback`

See `server/migrations` for all active schema definitions.
