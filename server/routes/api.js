import { Router } from 'express';
import * as eventsController from '../controllers/eventsController.js';
import * as activityEventsController from '../controllers/activityEventsController.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import * as coreTeamController from '../controllers/coreTeamController.js';
import * as eventRegistrationController from '../controllers/eventRegistrationController.js';
import * as usersController from '../controllers/usersController.js';
import * as attendanceController from '../controllers/attendanceController.js';
import * as eventAnalyticsController from '../controllers/eventAnalyticsController.js';
import { adminAuditMiddleware, attachOldState } from '../middleware/adminAuditMiddleware.js';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { coreTeamService } from '../services/coreTeamService.js';
import { authRateLimiter, protectedActionRateLimiter } from '../middleware/authRateLimiter.js';
import { portfolioRepository } from '../repositories/portfolioRepository.js';
import { achievementsRepository } from '../repositories/achievementsRepository.js';
import { portfolioService } from '../services/portfolioService.js';
import * as sponsorshipsController from '../controllers/sponsorshipsController.js';

const router = Router();

// Public
router.get('/api/users', usersController.getPublicUsers);
router.get('/api/content/events', eventsController.listEvents);
router.post('/api/content/events/:eventId/register', eventRegistrationController.registerForEvent);
router.get('/api/content/events/:eventId/calendar', eventRegistrationController.getEventCalendar);
router.get(
  '/api/content/activity-events/:activityKey',
  activityEventsController.listActivityEvents
);
router.post(
  '/api/content/activity-events/:activityKey',
  protectedActionRateLimiter,
  adminAuthMiddleware.requireScope('events:write'),
  activityEventsController.addActivityEvent
);
router.delete(
  '/api/content/activity-events/:activityKey/:eventId',
  protectedActionRateLimiter,
  adminAuthMiddleware.requireScope('events:write'),
  activityEventsController.deleteActivityEvent
);
router.post('/account-recovery/request', async (req, res) => {
  const { email } = req.body;

  const recovery = await studentAuthService.createRecoveryRequest(email);

  return res.json({
    success: true,
    message: 'Recovery code generated',
    recovery,
  });
});
router.post('/account-recovery/verify', async (req, res) => {
  const { savedCode, enteredCode } = req.body;

  const valid = studentAuthService.verifyRecoveryCode(savedCode, enteredCode);

  return res.json({
    success: valid,
  });
});

// Admin auth
router.post(
  '/api/attendance/mark',
  adminAuthMiddleware.requireAdmin,
  attendanceController.markAttendance
);
router.get(
  '/api/attendance',
  adminAuthMiddleware.requireAdmin,
  attendanceController.getAttendanceList
);
router.get('/api/admin/users', adminAuthMiddleware.requireAdmin, usersController.getAdminUsers);
router.post(
  '/api/admin/users',
  adminAuthMiddleware.requireAdmin,
  adminAuditMiddleware,
  usersController.adminCreateUser
);
router.put(
  '/api/admin/users/:id',
  adminAuthMiddleware.requireAdmin,
  adminAuditMiddleware,
  usersController.adminUpdateUser
);
router.delete(
  '/api/admin/users/:id',
  adminAuthMiddleware.requireAdmin,
  adminAuditMiddleware,
  usersController.adminDeactivateUser
);
router.post('/api/admin/login', authRateLimiter, adminAuthMiddleware.login);
router.post('/api/admin/logout', adminAuthMiddleware.requireAdmin, adminAuthMiddleware.logout);

router.get(
  '/api/admin/events',
  adminAuthMiddleware.requireScope('events:read'),
  eventsController.adminListEvents
);
router.post(
  '/api/admin/events',
  adminAuthMiddleware.requireScope('events:write'),
  adminAuditMiddleware,
  eventsController.adminCreateEvent
);
router.put(
  '/api/admin/events/:id',
  adminAuthMiddleware.requireScope('events:write'),
  attachOldState((req) => eventsRepository.getById(req.params.id)),
  adminAuditMiddleware,
  eventsController.adminUpdateEvent
);
router.delete(
  '/api/admin/events/:id',
  adminAuthMiddleware.requireScope('events:write'),
  attachOldState((req) => eventsRepository.getById(req.params.id)),
  adminAuditMiddleware,
  eventsController.adminDeleteEvent
);

// Core team management APIs
router.get(
  '/api/admin/core-team/members',
  adminAuthMiddleware.requireScope('settings:admin'),
  coreTeamController.adminListCoreTeamMembers
);
router.post(
  '/api/admin/core-team/members',
  adminAuthMiddleware.requireScope('settings:admin'),
  adminAuditMiddleware,
  coreTeamController.adminAddCoreTeamMember
);
router.delete(
  '/api/admin/core-team/members/:id',
  adminAuthMiddleware.requireScope('settings:admin'),
  attachOldState(async (req) => {
    const members = await coreTeamService.listMembers();
    return members.find((m) => String(m.id) === String(req.params.id));
  }),
  adminAuditMiddleware,
  coreTeamController.adminDeleteCoreTeamMember
);

// Portfolio management APIs
router.get(
  '/api/admin/portfolios',
  adminAuthMiddleware.requireScope('events:read'),
  async (req, res) => {
    try {
      const username = String(req.query.username || '').trim();
      if (username) {
        const portfolio = await portfolioService.getByUsername(username);
        return res.json(portfolio ? { portfolios: [portfolio] } : { portfolios: [] });
      }
      const portfolios = (await portfolioRepository.listAll)
        ? await portfolioRepository.listAll()
        : [];
      return res.json({ portfolios });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);
router.delete(
  '/api/admin/portfolios/:username',
  adminAuthMiddleware.requireScope('events:write'),
  adminAuditMiddleware,
  async (req, res) => {
    try {
      const username = String(req.params.username || '')
        .trim()
        .toLowerCase();
      if (!username) return res.status(400).json({ error: 'Username required' });
      await portfolioRepository.delete(username);
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// Achievement management APIs
router.get(
  '/api/admin/portfolios/:username/achievements',
  adminAuthMiddleware.requireScope('events:read'),
  async (req, res) => {
    try {
      const username = String(req.params.username || '')
        .trim()
        .toLowerCase();
      const achievements = await achievementsRepository.getByUsername(username);
      return res.json({ achievements });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);
router.post(
  '/api/admin/portfolios/:username/achievements',
  adminAuthMiddleware.requireScope('events:write'),
  async (req, res) => {
    try {
      const username = String(req.params.username || '')
        .trim()
        .toLowerCase();
      const { name, description, tier, iconUrl, source } = req.body;
      if (!name) return res.status(400).json({ error: 'Achievement name is required' });
      const achievement = await portfolioService.awardAchievement(username, {
        name: String(name).trim().slice(0, 120),
        description: description ? String(description).trim().slice(0, 1000) : null,
        tier: tier ? String(tier).trim().slice(0, 40) : 'bronze',
        iconUrl: iconUrl ? String(iconUrl).trim().slice(0, 500) : null,
        source: source ? String(source).trim().slice(0, 60) : 'admin',
      });
      return res.status(201).json({ achievement });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);
router.delete(
  '/api/admin/portfolios/:username/achievements/:name',
  adminAuthMiddleware.requireScope('events:write'),
  async (req, res) => {
    try {
      const username = String(req.params.username || '')
        .trim()
        .toLowerCase();
      const name = String(req.params.name || '').trim();
      await portfolioService.removeAchievement(username, name);
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// Admin Alerts
const alerts = [];
const alertRules = [
  {
    id: 'sec-1',
    category: 'Security',
    label: 'Failed login attempts',
    condition: '>',
    threshold: 10,
    severity: 'Warning',
    channels: ['Email'],
    enabled: true,
  },
  {
    id: 'sec-2',
    category: 'Security',
    label: 'Suspicious activity detected',
    condition: '>',
    threshold: 0,
    severity: 'Critical',
    channels: ['Email', 'Slack'],
    enabled: true,
  },
  {
    id: 'perf-1',
    category: 'Performance',
    label: 'High response time',
    condition: '>',
    threshold: 2000,
    severity: 'Warning',
    channels: ['Email'],
    enabled: true,
  },
  {
    id: 'perf-2',
    category: 'Performance',
    label: 'Error rate spike',
    condition: '>',
    threshold: 5,
    severity: 'Critical',
    channels: ['Email', 'Slack'],
    enabled: true,
  },
  {
    id: 'sys-1',
    category: 'System',
    label: 'Service down',
    condition: '==',
    threshold: 0,
    severity: 'Critical',
    channels: ['Email', 'Slack', 'SMS'],
    enabled: true,
  },
  {
    id: 'usr-1',
    category: 'User Activity',
    label: 'Registration spike',
    condition: '>',
    threshold: 100,
    severity: 'Info',
    channels: ['Email'],
    enabled: true,
  },
  {
    id: 'fin-1',
    category: 'Financial',
    label: 'Payment failure',
    condition: '>',
    threshold: 5,
    severity: 'Critical',
    channels: ['Email', 'Slack'],
    enabled: true,
  },
  {
    id: 'cnt-1',
    category: 'Content',
    label: 'Content flagged for moderation',
    condition: '>',
    threshold: 3,
    severity: 'Warning',
    channels: ['Email'],
    enabled: true,
  },
];

router.get('/api/admin/alerts/rules', (req, res) => res.json({ rules: alertRules }));
router.put('/api/admin/alerts/rules/:id', (req, res) => {
  const rule = alertRules.find((r) => r.id === req.params.id);
  if (!rule) return res.status(404).json({ error: 'Rule not found' });
  Object.assign(rule, req.body);
  res.json(rule);
});
router.get('/api/admin/alerts/events', (req, res) => res.json({ events: alerts }));
router.put('/api/admin/alerts/events/:id/status', (req, res) => {
  const event = alerts.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  event.status = req.body.status;
  event.resolvedAt = req.body.status === 'resolved' ? new Date().toISOString() : null;
  res.json(event);
});

export default router;
