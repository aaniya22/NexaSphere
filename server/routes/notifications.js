/**
 * Notification & Push Subscription Routes
 * Manages browser push subscriptions, notification CRUD,
 * and read-state tracking with rate limiting and admin auth.
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';
import { notificationRateLimiter } from '../middleware/rateLimiter.js';
import notificationsService from '../services/notificationsService.js';

const router = Router();
const adminAuth = adminAuthMiddleware.requireAdmin;

// ── In-memory push subscription store ──────────────────────────────────────
const pushSubscriptions = new Set();

// ── Push subscription validation middleware ────────────────────────────────
const validatePushSubscription = [
  body('subscription').isObject().withMessage('subscription must be an object'),
  body('subscription.endpoint')
    .isURL()
    .withMessage('endpoint must be a valid URL')
    .isLength({ max: 2048 }),
  body('subscription.keys').isObject().withMessage('keys must be an object'),
  body('subscription.keys.p256dh')
    .isString()
    .isLength({ max: 256 })
    .withMessage('p256dh must be a string up to 256 chars'),
  body('subscription.keys.auth')
    .isString()
    .isLength({ max: 128 })
    .withMessage('auth must be a string up to 128 chars'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: 'Invalid subscription payload', details: errors.array() });
    }

    // Strict sanitization: reconstruct object to drop malicious properties
    const {
      endpoint,
      keys: { p256dh, auth },
    } = req.body.subscription;
    req.body.subscription = { endpoint, keys: { p256dh, auth } };

    next();
  },
];

/**
 * POST /api/notifications/subscribe — Register a push subscription.
 * Limits total stored subscriptions to 10 000 (FIFO eviction).
 */
router.post('/api/notifications/subscribe', validatePushSubscription, (req, res) => {
  try {
    const { subscription } = req.body;
    if (subscription) {
      pushSubscriptions.add(JSON.stringify(subscription));
      if (pushSubscriptions.size > 10000) {
        const oldest = pushSubscriptions.values().next().value;
        pushSubscriptions.delete(oldest);
      }
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/notifications/unsubscribe — Remove a push subscription.
 */
router.post('/api/notifications/unsubscribe', validatePushSubscription, (req, res) => {
  try {
    const { subscription } = req.body;
    if (subscription) pushSubscriptions.delete(JSON.stringify(subscription));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/notifications/mark-read — Mark a single notification as read.
 */
router.post(
  '/api/notifications/mark-read',
  adminAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const { id, userId } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const uid = userId || 'global';
      const ok = await notificationsService.markAsRead(uid, id);
      return res.json({ success: ok });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/notifications/mark-all-read — Mark all notifications as read.
 */
router.post(
  '/api/notifications/mark-all-read',
  adminAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const { userId } = req.body || {};
      await notificationsService.markAllAsRead(userId || 'global');
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * DELETE /api/notifications/:id — Remove a specific notification by ID.
 */
router.delete('/api/notifications/:id', adminAuth, notificationRateLimiter, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.query.userId || 'global';
    const removed = await notificationsService.removeNotification(userId, id);
    if (!removed) return res.status(404).json({ error: 'Notification not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/notifications — Clear all notifications for a user.
 */
router.delete('/api/notifications', adminAuth, notificationRateLimiter, async (req, res) => {
  try {
    const userId = req.query.userId || 'global';
    await notificationsService.clearAll(userId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/notifications — Create a new notification (admin).
 */
router.post('/api/notifications', adminAuth, notificationRateLimiter, async (req, res) => {
  try {
    const { userId, title, message, type, link } = req.body || {};
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }
    const note = await notificationsService.addNotification(userId || 'global', {
      title,
      message,
      type,
      link,
    });
    return res.json({ success: true, notification: note });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/notifications — Retrieve notifications for the authenticated user.
 * Requires a valid student token; query userId must match the token subject.
 */
router.get('/api/notifications', requireStudentAuth, notificationRateLimiter, async (req, res) => {
  try {
    const authenticatedUserId = req.studentUser?.sub || req.studentUser?.id;
    const requestedUserId = req.query.userId || 'global';

    if (requestedUserId !== 'global' && requestedUserId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const list = await notificationsService.getNotifications(
      requestedUserId === 'global' ? 'global' : authenticatedUserId
    );
    return res.json({ notifications: list });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
