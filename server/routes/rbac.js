import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { adminAuditMiddleware } from '../middleware/adminAuditMiddleware.js';
import * as rbacController from '../controllers/rbacController.js';

const router = Router();

// All routes require admin authentication
router.use(adminAuthMiddleware.requireAdmin);

// Roles management
router.get('/api/admin/rbac/roles', requirePermission('rbac:read'), rbacController.getAllRoles);

router.get(
  '/api/admin/rbac/permissions',
  requirePermission('rbac:read'),
  rbacController.getAllPermissions
);

router.get(
  '/api/admin/rbac/matrix',
  requirePermission('rbac:read'),
  rbacController.getPermissionMatrix
);

router.post(
  '/api/admin/rbac/roles',
  requirePermission('rbac:write'),
  adminAuditMiddleware,
  rbacController.createRole
);

router.put(
  '/api/admin/rbac/roles/:name',
  requirePermission('rbac:write'),
  adminAuditMiddleware,
  rbacController.updateRole
);

router.delete(
  '/api/admin/rbac/roles/:name',
  requirePermission('rbac:write'),
  adminAuditMiddleware,
  rbacController.deleteRole
);

// User role management
router.get(
  '/api/admin/rbac/users',
  requirePermission('rbac:read'),
  rbacController.getUsersWithRoles
);

router.post(
  '/api/admin/rbac/assign',
  requirePermission('rbac:assign'),
  adminAuditMiddleware,
  rbacController.assignRole
);

router.delete(
  '/api/admin/rbac/assign/:userId/:roleName',
  requirePermission('rbac:assign'),
  adminAuditMiddleware,
  rbacController.revokeRole
);

router.post(
  '/api/admin/rbac/bulk-assign',
  requirePermission('rbac:assign'),
  adminAuditMiddleware,
  rbacController.bulkAssignRoles
);

// Audit logs
router.get('/api/admin/rbac/audit', requirePermission('audit:read'), rbacController.getAuditLogs);

export default router;
