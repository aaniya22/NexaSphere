/**
 * Notification & Push Subscription Routes
 * Manages browser push subscriptions, notification CRUD,
 * and read-state tracking with rate limiting and admin auth.
 */

import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';
import { notificationRateLimiter } from '../middleware/rateLimiter.js';
import notificationsService from '../services/notificationsService.js';

const router = Router();
const adminAuth = adminAuthMiddleware.requireAdmin;

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
