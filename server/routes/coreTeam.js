/**
 * Core Team Routes
 * Public and admin endpoints for managing core team members.
 */

import { Router } from 'express';
import * as coreTeamController from '../controllers/coreTeamController.js';
import { coreTeamService } from '../services/coreTeamService.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';

const router = Router();
const adminAuth = adminAuthMiddleware.requireAdmin;

/**
 * GET /api/content/team — Public core team listing.
 * Filters out non-@glbajajgroup.org emails for privacy.
 */
router.get('/api/content/team', async (req, res) => {
  try {
    const rawMembers = await coreTeamService.listMembers();
    const members = (rawMembers || []).map((m) => {
      let email = m.email || null;
      if (email && !email.toLowerCase().endsWith('@glbajajgroup.org')) {
        email = null;
      }
      return {
        ...m,
        email,
        whatsapp: 'https://chat.whatsapp.com/FhpJEaod2g419jFMfqrhGZ',
      };
    });
    return res.json({ members });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to load core team' });
  }
});

/**
 * GET /api/admin/core-team — List all core team members (admin).
 */
router.get('/api/admin/core-team', adminAuth, coreTeamController.adminListCoreTeamMembers);

/**
 * POST /api/admin/core-team — Add a new core team member (admin).
 */
router.post('/api/admin/core-team', adminAuth, coreTeamController.adminAddCoreTeamMember);

/**
 * DELETE /api/admin/core-team/:id — Remove a core team member (admin).
 */
router.delete('/api/admin/core-team/:id', adminAuth, coreTeamController.adminDeleteCoreTeamMember);

export default router;
