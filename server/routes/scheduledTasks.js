/**
 * routes/scheduledTasks.js
 * REST API for Scheduled Task & Job Management (Issue #1770)
 *
 * Endpoints (all require admin auth):
 *   GET    /api/admin/scheduled-tasks          – list all tasks + stats
 *   GET    /api/admin/scheduled-tasks/stats    – aggregate stats only
 *   GET    /api/admin/scheduled-tasks/:id      – single task detail
 *   GET    /api/admin/scheduled-tasks/:id/history – execution history
 *   PATCH  /api/admin/scheduled-tasks/:id      – update enabled / cron
 *   POST   /api/admin/scheduled-tasks/:id/run  – manual trigger
 */

import { Router } from 'express';
import { schedulerService } from '../services/schedulerService.js';

const router = Router();

// ─── Middleware: basic input sanitiser ───────────────────────────────────────
function sanitizeId(req, res, next) {
  const { id } = req.params;
  if (!/^[a-z0-9-]+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid task id' });
  }
  next();
}

// ─── GET /api/admin/scheduled-tasks ─────────────────────────────────────────
router.get('/', (_req, res) => {
  try {
    const tasks = schedulerService.getAllTasks();
    const stats = schedulerService.getStats();
    res.json({ tasks, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/scheduled-tasks/stats ────────────────────────────────────
router.get('/stats', (_req, res) => {
  try {
    res.json(schedulerService.getStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/scheduled-tasks/:id ──────────────────────────────────────
router.get('/:id', sanitizeId, (req, res) => {
  try {
    const task = schedulerService.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/scheduled-tasks/:id/history ──────────────────────────────
router.get('/:id/history', sanitizeId, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const history = schedulerService.getHistory(req.params.id, limit);
    res.json({ history });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/admin/scheduled-tasks/:id ────────────────────────────────────
router.patch('/:id', sanitizeId, (req, res) => {
  try {
    const { enabled, cron } = req.body;
    let task = schedulerService.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (typeof enabled === 'boolean') {
      task = schedulerService.setEnabled(req.params.id, enabled);
    }

    if (typeof cron === 'string') {
      task = schedulerService.setCron(req.params.id, cron);
    }

    res.json(task);
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ error: err.message });
    if (err.message.toLowerCase().includes('invalid cron')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/admin/scheduled-tasks/:id/run ─────────────────────────────────
router.post('/:id/run', sanitizeId, async (req, res) => {
  try {
    const task = await schedulerService.triggerNow(req.params.id);
    res.json({ message: 'Task executed successfully', task });
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ error: err.message });
    if (err.message.includes('already running'))
      return res.status(409).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

export default router;
