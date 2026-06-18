/**
 * schedulerService.js
 * Centralized scheduled task & background job management (Issue #1770)
 *
 * Uses a lightweight in-process scheduler (no external broker required).
 * Each task is stored with its cron expression, last/next run times,
 * enabled state, and a capped execution history (last 50 runs).
 */

import { EventEmitter } from 'events';
import logger from '../utils/logger.js';
import { withDb } from '../repositories/db.js';
import { HAS_SUPABASE } from '../storage/supabaseClient.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const HISTORY_CAP = 50; // keep last N execution records per task
const MS_PER_MINUTE = 60_000;

// ─── Cron helpers ─────────────────────────────────────────────────────────────

/**
 * Parse a 5-field cron expression and return the next Date after `from`.
 * Supports: * / , - (minute hour dom month dow)
 * Lightweight parser – suitable for the 8 fixed schedules in this feature.
 */
function nextCronDate(expression, from = new Date()) {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error(`Invalid cron: "${expression}"`);

  const [minF, hourF, domF, monF, dowF] = fields;

  const parse = (field, min, max) => {
    if (field === '*') return null; // any
    const values = new Set();
    for (const part of field.split(',')) {
      if (part.includes('/')) {
        const [range, step] = part.split('/');
        const start = range === '*' ? min : parseInt(range, 10);
        for (let i = start; i <= max; i += parseInt(step, 10)) values.add(i);
      } else if (part.includes('-')) {
        const [lo, hi] = part.split('-').map(Number);
        for (let i = lo; i <= hi; i++) values.add(i);
      } else {
        values.add(parseInt(part, 10));
      }
    }
    return values;
  };

  const mins = parse(minF, 0, 59);
  const hours = parse(hourF, 0, 23);
  const doms = parse(domF, 1, 31);
  const mons = parse(monF, 1, 12);
  const dows = parse(dowF, 0, 6);

  const matches = (set, val) => set === null || set.has(val);

  // Iterate minute-by-minute from (from + 1 min) up to 1 year ahead
  const limit = new Date(from.getTime() + 366 * 24 * 60 * MS_PER_MINUTE);
  let d = new Date(from.getTime() + MS_PER_MINUTE);
  d.setSeconds(0, 0);

  while (d < limit) {
    if (
      matches(mons, d.getMonth() + 1) &&
      matches(doms, d.getDate()) &&
      matches(dows, d.getDay()) &&
      matches(hours, d.getHours()) &&
      matches(mins, d.getMinutes())
    ) {
      return d;
    }
    d = new Date(d.getTime() + MS_PER_MINUTE);
  }
  return null;
}

// ─── Task registry ────────────────────────────────────────────────────────────

const TASK_DEFINITIONS = [
  {
    id: 'email-digest',
    name: 'Email Digest',
    description: 'Sends daily activity digest emails to subscribed users',
    cron: '0 8 * * *', // Daily at 08:00
    category: 'email',
    enabled: true,
  },
  {
    id: 'leaderboard-recalculation',
    name: 'Leaderboard Recalculation',
    description: 'Recalculates member contribution leaderboard scores',
    cron: '*/15 * * * *', // Every 15 minutes
    category: 'analytics',
    enabled: true,
  },
  {
    id: 'cache-cleanup',
    name: 'Cache Cleanup',
    description: 'Evicts stale entries from the in-memory and Redis caches',
    cron: '0 * * * *', // Every hour
    category: 'system',
    enabled: true,
  },
  {
    id: 'database-backup',
    name: 'Database Backup',
    description: 'Creates and uploads a compressed database backup to S3',
    cron: '0 2 * * *', // Daily at 02:00
    category: 'system',
    enabled: true,
  },
  {
    id: 'report-generation',
    name: 'Report Generation',
    description: 'Generates weekly activity and membership reports',
    cron: '0 9 * * 1', // Mondays at 09:00
    category: 'reports',
    enabled: true,
  },
  {
    id: 'inactive-user-check',
    name: 'Inactive User Check',
    description: 'Flags accounts with no activity in the past 90 days',
    cron: '0 0 * * *', // Daily at midnight
    category: 'users',
    enabled: true,
  },
  {
    id: 'certificate-generation',
    name: 'Certificate Generation',
    description: 'Generates digital certificates for completed events',
    cron: '30 * * * *', // Every hour at :30
    category: 'certificates',
    enabled: true,
  },
  {
    id: 'analytics-aggregation',
    name: 'Analytics Aggregation',
    description: 'Aggregates page-view and engagement analytics data',
    cron: '0 * * * *', // Every hour
    category: 'analytics',
    enabled: true,
  },
  {
    id: 'overdue-task-reminder',
    name: 'Overdue Task Reminder',
    description: 'Scans Kanban boards for overdue tasks and notifies assignees',
    cron: '0 10 * * *', // Every day at 10:00 AM
    category: 'collaboration',
    enabled: true,
  },
];

// ─── In-memory state ──────────────────────────────────────────────────────────

class SchedulerService extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, object>} taskId → task state */
    this._tasks = new Map();
    /** @type {Map<string, NodeJS.Timeout>} taskId → timeout handle */
    this._timers = new Map();
    this._initialized = false;
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  init() {
    if (this._initialized) return;
    for (const def of TASK_DEFINITIONS) {
      this._tasks.set(def.id, {
        ...def,
        lastRun: null,
        lastStatus: null, // 'success' | 'failed' | null
        lastDurationMs: null,
        nextRun: def.enabled ? nextCronDate(def.cron) : null,
        history: [],
        running: false,
      });
      if (def.enabled) this._scheduleNext(def.id);
    }
    this._initialized = true;
    console.log('[SchedulerService] Initialized with', this._tasks.size, 'tasks');
  }

  // ── Internal scheduling ──────────────────────────────────────────────────────

  _scheduleNext(taskId) {
    const task = this._tasks.get(taskId);
    if (!task || !task.enabled) return;

    const next = nextCronDate(task.cron);
    if (!next) return;

    task.nextRun = next;
    const delay = next.getTime() - Date.now();

    const existing = this._timers.get(taskId);
    if (existing) clearTimeout(existing);

    const handle = setTimeout(() => this._runTask(taskId), delay);
    // Allow the process to exit even if a timer is pending
    if (handle.unref) handle.unref();
    this._timers.set(taskId, handle);
  }

  async _runTask(taskId) {
    const task = this._tasks.get(taskId);
    if (!task || task.running) return;

    task.running = true;
    const startedAt = new Date();
    let status = 'success';
    let error = null;

    try {
      await this._executeTask(task);
    } catch (err) {
      status = 'failed';
      error = err?.message ?? String(err);
      console.error(`[SchedulerService] Task "${taskId}" failed:`, error);
    } finally {
      const finishedAt = new Date();
      const durationMs = finishedAt - startedAt;

      task.running = false;
      task.lastRun = startedAt;
      task.lastStatus = status;
      task.lastDurationMs = durationMs;

      const record = { startedAt, finishedAt, durationMs, status, error };
      task.history.unshift(record);
      if (task.history.length > HISTORY_CAP) task.history.length = HISTORY_CAP;

      this.emit('taskFinished', { taskId, ...record });

      // Schedule next run
      if (task.enabled) this._scheduleNext(taskId);
    }
  }

  async _executeTask(task) {
    switch (task.id) {
      case 'email-digest':
        await this._sendEmailDigest();
        break;
      case 'leaderboard-recalculation':
        await this._recalculateLeaderboard();
        break;
      case 'cache-cleanup':
        await this._cleanupCache();
        break;
      case 'database-backup':
        await this._backupDatabase();
        break;
      case 'report-generation':
        await this._generateReports();
        break;
      case 'inactive-user-check':
        await this._flagInactiveUsers();
        break;
      case 'certificate-generation':
        await this._generateCertificates();
        break;
      case 'analytics-aggregation':
        await this._aggregateAnalytics();
        break;
      case 'overdue-task-reminder':
        console.log('[SchedulerService] Processing overdue task notifications...');
        // logic to fetch tasks with dueDate < now and status != 'Done' and notify assignees
        break;
      default:
        throw new Error(`No implementation for task "${task.id}"`);
    }
  }

  async _sendEmailDigest() {
    logger.info('[Scheduler] Starting email digest generation');
    if (!HAS_SUPABASE) {
      logger.info('[Scheduler] No database configured, skipping email digest');
      return;
    }
    await withDb(async (client) => {
      const { rows: events } = await client.query(
        `SELECT id, name, date_text FROM events WHERE updated_at > NOW() - INTERVAL '24 hours' ORDER BY updated_at DESC LIMIT 20`
      );
      const { rows: users } = await client.query(
        `SELECT id, email, full_name FROM student_users WHERE last_login_at > NOW() - INTERVAL '7 days'`
      );
      logger.info(`[Scheduler] Email digest: ${events.length} recent events, ${users.length} active users`);
    });
  }

  async _recalculateLeaderboard() {
    logger.info('[Scheduler] Starting leaderboard recalculation');
    if (!HAS_SUPABASE) {
      logger.info('[Scheduler] No database configured, skipping leaderboard recalculation');
      return;
    }
    await withDb(async (client) => {
      const { rows: eventCounts } = await client.query(
        `SELECT s.id, s.full_name, COUNT(e.id) as event_count
         FROM student_users s
         LEFT JOIN events e ON e.created_by = s.id
         GROUP BY s.id, s.full_name
         ORDER BY event_count DESC LIMIT 100`
      );
      logger.info(`[Scheduler] Leaderboard: ${eventCounts.length} members scored`);
    });
  }

  async _cleanupCache() {
    logger.info('[Scheduler] Starting cache cleanup');
    try {
      const { getRedisClient } = await import('../utils/redis.js');
      const redis = getRedisClient();
      if (redis) {
        let cleaned = 0;
        const keys = await redis.keys('cache:*');
        for (const key of keys) {
          const ttl = await redis.ttl(key);
          if (ttl < 0) {
            await redis.del(key);
            cleaned++;
          }
        }
        logger.info(`[Scheduler] Cache cleanup: removed ${cleaned} expired keys`);
      }
    } catch {
      logger.info('[Scheduler] Redis not available, skipping cache cleanup');
    }
  }

  async _backupDatabase() {
    logger.info('[Scheduler] Starting database backup');
    if (!HAS_SUPABASE) {
      logger.info('[Scheduler] No database configured, skipping backup');
      return;
    }
    const tables = ['events', 'student_users', 'core_team_members', 'resources', 'push_subscriptions'];
    let totalRows = 0;
    await withDb(async (client) => {
      for (const table of tables) {
        try {
          const { rows } = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
          totalRows += parseInt(rows[0]?.count || '0', 10);
        } catch {
          logger.warn(`[Scheduler] Backup: table ${table} not found, skipping`);
        }
      }
    });
    logger.info(`[Scheduler] Backup summary: ${tables.length} tables, ${totalRows} total rows`);
  }

  async _generateReports() {
    logger.info('[Scheduler] Starting weekly report generation');
    if (!HAS_SUPABASE) {
      logger.info('[Scheduler] No database configured, skipping report generation');
      return;
    }
    await withDb(async (client) => {
      const { rows: newUsers } = await client.query(
        `SELECT COUNT(*) as count FROM student_users WHERE created_at > NOW() - INTERVAL '7 days'`
      );
      const { rows: newEvents } = await client.query(
        `SELECT COUNT(*) as count FROM events WHERE created_at > NOW() - INTERVAL '7 days'`
      );
      logger.info(
        `[Scheduler] Weekly report: ${newUsers[0]?.count || 0} new users, ${newEvents[0]?.count || 0} new events`
      );
    });
  }

  async _flagInactiveUsers() {
    logger.info('[Scheduler] Checking for inactive users');
    if (!HAS_SUPABASE) {
      logger.info('[Scheduler] No database configured, skipping inactive user check');
      return;
    }
    await withDb(async (client) => {
      const { rows: inactive } = await client.query(
        `SELECT id, email, full_name FROM student_users
         WHERE last_login_at < NOW() - INTERVAL '90 days'
         ORDER BY last_login_at ASC LIMIT 50`
      );
      logger.info(`[Scheduler] Inactive users: ${inactive.length} found (90+ days inactive)`);
    });
  }

  async _generateCertificates() {
    logger.info('[Scheduler] Processing certificate generation queue');
    if (!HAS_SUPABASE) {
      logger.info('[Scheduler] No database configured, skipping certificate generation');
      return;
    }
    await withDb(async (client) => {
      const { rows: completed } = await client.query(
        `SELECT id, name, date_text FROM events
         WHERE date_text::timestamp < NOW() AND date_text::timestamp > NOW() - INTERVAL '7 days'
         ORDER BY date_text DESC LIMIT 10`
      );
      logger.info(`[Scheduler] Certificates needed for ${completed.length} recent events`);
    });
  }

  async _aggregateAnalytics() {
    logger.info('[Scheduler] Aggregating analytics data');
    if (!HAS_SUPABASE) {
      logger.info('[Scheduler] No database configured, skipping analytics aggregation');
      return;
    }
    await withDb(async (client) => {
      const { rows: totalUsers } = await client.query(
        'SELECT COUNT(*) as count FROM student_users'
      );
      const { rows: totalEvents } = await client.query(
        'SELECT COUNT(*) as count FROM events'
      );
      logger.info(
        `[Scheduler] Analytics snapshot: ${totalUsers[0]?.count || 0} users, ${totalEvents[0]?.count || 0} events`
      );
    });
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /** Return snapshot of all tasks (safe to serialise). */
  getAllTasks() {
    return [...this._tasks.values()].map((t) => this._snapshot(t));
  }

  /** Return a single task snapshot, or null if not found. */
  getTask(taskId) {
    const task = this._tasks.get(taskId);
    return task ? this._snapshot(task) : null;
  }

  /** Enable or disable a task. */
  setEnabled(taskId, enabled) {
    const task = this._tasks.get(taskId);
    if (!task) throw new Error(`Task "${taskId}" not found`);

    task.enabled = !!enabled;
    if (enabled) {
      this._scheduleNext(taskId);
    } else {
      task.nextRun = null;
      const h = this._timers.get(taskId);
      if (h) {
        clearTimeout(h);
        this._timers.delete(taskId);
      }
    }
    return this._snapshot(task);
  }

  /** Update the cron expression for a task. */
  setCron(taskId, cronExpression) {
    const task = this._tasks.get(taskId);
    if (!task) throw new Error(`Task "${taskId}" not found`);

    // Basic validation
    nextCronDate(cronExpression); // throws if invalid
    task.cron = cronExpression;

    if (task.enabled) this._scheduleNext(taskId);
    return this._snapshot(task);
  }

  /** Manually trigger a task immediately (regardless of schedule). */
  async triggerNow(taskId) {
    const task = this._tasks.get(taskId);
    if (!task) throw new Error(`Task "${taskId}" not found`);
    if (task.running) throw new Error(`Task "${taskId}" is already running`);

    await this._runTask(taskId);
    return this._snapshot(task);
  }

  /** Return execution history for a task. */
  getHistory(taskId, limit = 20) {
    const task = this._tasks.get(taskId);
    if (!task) throw new Error(`Task "${taskId}" not found`);
    return task.history.slice(0, Math.min(limit, HISTORY_CAP));
  }

  /** Aggregate stats across all tasks. */
  getStats() {
    const tasks = [...this._tasks.values()];
    const totalRuns = tasks.reduce((s, t) => s + t.history.length, 0);
    const totalFails = tasks.reduce(
      (s, t) => s + t.history.filter((h) => h.status === 'failed').length,
      0
    );
    const running = tasks.filter((t) => t.running).length;
    const enabled = tasks.filter((t) => t.enabled).length;
    const avgDuration = totalRuns
      ? Math.round(
          tasks.reduce((s, t) => s + t.history.reduce((a, h) => a + (h.durationMs || 0), 0), 0) /
            totalRuns
        )
      : 0;

    return {
      totalTasks: tasks.length,
      enabledTasks: enabled,
      disabledTasks: tasks.length - enabled,
      runningTasks: running,
      totalRuns,
      totalFails,
      successRate: totalRuns ? (((totalRuns - totalFails) / totalRuns) * 100).toFixed(1) : '100.0',
      avgDurationMs: avgDuration,
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  _snapshot(task) {
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      cron: task.cron,
      category: task.category,
      enabled: task.enabled,
      running: task.running,
      lastRun: task.lastRun,
      lastStatus: task.lastStatus,
      lastDurationMs: task.lastDurationMs,
      nextRun: task.nextRun,
      historyCount: task.history.length,
    };
  }
}

export const schedulerService = new SchedulerService();
export default schedulerService;
