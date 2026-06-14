/**
 * Admin Dashboard Routes
 * Provides admin-only endpoints for membership data and session info.
 */

import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import {
  validateConfigChange,
  createChangeHistory,
  rollbackConfig,
} from '../utils/configApproval.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import {
  runIntegrityCheck,
  detectCorruption,
  generateRecoveryRecommendation,
  createRecoveryAuditLog,
} from '../utils/dataIntegrityValidator.js';
import {
  activateReadOnlyMode,
  deactivateReadOnlyMode,
  getReadOnlyStatus,
  createIncidentLog,
} from '../routes/readOnlyMode.js';
import {
  activateReadOnlyMode,
  deactivateReadOnlyMode,
  getReadOnlyStatus,
  createIncidentLog,
} from '../utils/readOnlyMode.js';

const router = Router();
const adminAuth = [apiRateLimiter, adminAuthMiddleware.requireAdmin];

/**
 * GET /api/admin/membership — Fetch membership responses from
 * Google Apps Script. Returns an empty list if the script URL
 * or secret is not configured.
 */
router.get('/api/admin/membership', adminAuth, async (req, res) => {
  const scriptUrl = process.env.MEMBERSHIP_SCRIPT_URL;
  const secret = process.env.MEMBERSHIP_SECRET;

  if (!scriptUrl || !secret) {
    return res.json({ responses: [] });
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getResponses', token: secret }),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script returned ${response.status}`);
    }

    const data = await response.json();
    return res.json({ responses: data.responses || [] });
  } catch (err) {
    console.error('[Membership] Failed to fetch responses:', err.message);
    return res.status(500).json({ error: 'Failed to fetch membership responses' });
  }
});

/**
 * GET /api/admin/me — Returns the authenticated admin's username.
 */
router.get('/api/admin/me', adminAuth, (req, res) => {
  return res.json({ username: req.adminSession.username });
});

/**
 * POST /api/admin/config-review
 * Validate critical configuration changes
 */
router.post('/api/admin/config-review', adminAuth, (req, res) => {
  const validation = validateConfigChange(req.body);

  const history = createChangeHistory(req.body);

  const rollback = rollbackConfig(req.body);

  return res.json({
    success: true,
    validation,
    history,
    rollback,
  });
});

router.get('/api/admin/database-health', adminAuth, (req, res) => {
  res.json(runIntegrityCheck());
});

router.get('/api/admin/database-corruption', adminAuth, (req, res) => {
  res.json(detectCorruption());
});

router.get('/api/admin/database-recovery', adminAuth, (req, res) => {
  res.json(generateRecoveryRecommendation());
});

router.get('/api/admin/database-audit-log', adminAuth, (req, res) => {
  res.json(createRecoveryAuditLog());
});

router.get('/api/admin/read-only-status', adminAuth, (req, res) => {
  res.json(getReadOnlyStatus());
});

router.post('/api/admin/read-only-enable', adminAuth, (req, res) => {
  res.json(activateReadOnlyMode());
});

router.post('/api/admin/read-only-disable', adminAuth, (req, res) => {
  res.json(deactivateReadOnlyMode());
});

router.get('/api/admin/read-only-log', adminAuth, (req, res) => {
  res.json(createIncidentLog());
});

router.get('/api/admin/read-only-status', adminAuth, (req, res) => {
  res.json(getReadOnlyStatus());
});

router.post('/api/admin/read-only-enable', adminAuth, (req, res) => {
  res.json(activateReadOnlyMode());
});

router.post('/api/admin/read-only-disable', adminAuth, (req, res) => {
  res.json(deactivateReadOnlyMode());
});

router.get('/api/admin/read-only-log', adminAuth, (req, res) => {
  res.json(createIncidentLog());
});

export default router;
