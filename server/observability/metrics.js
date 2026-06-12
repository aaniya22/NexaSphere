/**
 * Prometheus metrics registry and custom collectors for NexaSphere API.
 */

import client from 'prom-client';
import { getPoolStats } from '../repositories/db.js';

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'nexasphere-api';

export const register = new client.Registry();

register.setDefaultLabels({ service: SERVICE_NAME });
client.collectDefaultMetrics({ register, prefix: 'nexasphere_' });

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total HTTP 5xx errors',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const pgPoolConnections = new client.Gauge({
  name: 'pg_pool_connections',
  help: 'PostgreSQL connection pool stats',
  labelNames: ['state'],
  registers: [register],
});

export const redisCacheHits = new client.Counter({
  name: 'redis_cache_hits_total',
  help: 'Redis cache hits',
  registers: [register],
});

export const redisCacheMisses = new client.Counter({
  name: 'redis_cache_misses_total',
  help: 'Redis cache misses',
  registers: [register],
});

export const eventsRegisteredTotal = new client.Counter({
  name: 'nexasphere_events_registered_total',
  help: 'Total event registrations',
  registers: [register],
});

export const eventsCreatedTotal = new client.Counter({
  name: 'nexasphere_events_created_total',
  help: 'Total events created',
  registers: [register],
});

export const activeUsersOnline = new client.Gauge({
  name: 'nexasphere_active_users_online',
  help: 'Currently connected users via Socket.IO',
  registers: [register],
});

export const pageLoadSeconds = new client.Histogram({
  name: 'nexasphere_page_load_seconds',
  help: 'Client-reported page load duration',
  buckets: [0.1, 0.25, 0.5, 1, 2, 3, 5, 10],
  registers: [register],
});

export const databaseUp = new client.Gauge({
  name: 'nexasphere_database_up',
  help: 'Database connectivity (1=up, 0=down)',
  registers: [register],
});

export function recordCacheHit() {
  redisCacheHits.inc();
}

export function recordCacheMiss() {
  redisCacheMisses.inc();
}

export function recordEventRegistration() {
  eventsRegisteredTotal.inc();
}

export function recordEventCreated() {
  eventsCreatedTotal.inc();
}

export function recordPageLoad(durationSeconds) {
  if (typeof durationSeconds === 'number' && durationSeconds >= 0) {
    pageLoadSeconds.observe(durationSeconds);
  }
}

export function updatePoolMetrics() {
  const stats = getPoolStats();
  if (!stats) {
    databaseUp.set(0);
    return;
  }
  databaseUp.set(1);
  pgPoolConnections.set({ state: 'total' }, stats.total);
  pgPoolConnections.set({ state: 'idle' }, stats.idle);
  pgPoolConnections.set({ state: 'waiting' }, stats.waiting);
}

export async function getMetricsText() {
  updatePoolMetrics();
  return register.metrics();
}

export function getMetricsContentType() {
  return register.contentType;
}
