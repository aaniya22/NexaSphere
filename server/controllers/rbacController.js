import * as rbacRepository from '../repositories/rbacRepository.js';
import {
  DEFAULT_ROLES,
  getAllPermissions as getAllPermissionsFromConfig,
  PERMISSIONS,
} from '../config/rbac.js';

/**
 * Get all roles (default + custom)
 */
export async function getAllRoles(req, res) {
  try {
    const customRoles = await rbacRepository.getAllRoles();
    const defaultRoles = Object.entries(DEFAULT_ROLES).map(([key, value]) => ({
      name: key,
      ...value,
    }));

    return res.json({
      defaultRoles,
      customRoles,
    });
  } catch (error) {
    console.error('[RBAC] Failed to get roles:', error);
    return res.status(500).json({ error: 'Failed to retrieve roles' });
  }
}

/**
 * Get all permissions
 */
export async function getAllPermissions(req, res) {
  try {
    const permissions = getAllPermissionsFromConfig();
    return res.json({ permissions });
  } catch (error) {
    console.error('[RBAC] Failed to get permissions:', error);
    return res.status(500).json({ error: 'Failed to retrieve permissions' });
  }
}

/**
 * Create a new custom role
 */
export async function createRole(req, res) {
  try {
    const { name, description, permissions, hierarchy } = req.body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Name and permissions array are required' });
    }

    // Validate permissions exist
    const validPermissions = Object.keys(PERMISSIONS);
    const invalidPermissions = permissions.filter((p) => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        error: 'Invalid permissions',
        invalid: invalidPermissions,
      });
    }

    // Check if role already exists
    const existingRole = await rbacRepository.getRoleByName(name);
    if (existingRole) {
      return res.status(409).json({ error: 'Role already exists' });
    }

    const role = await rbacRepository.createRole({
      name,
      description,
      permissions,
      hierarchy: hierarchy || 10,
    });

    // Log audit event
    await rbacRepository.logAuditEvent({
      adminId: req.adminSession.username,
      action: 'ROLE_CREATED',
      newValue: role,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(201).json({ role });
  } catch (error) {
    console.error('[RBAC] Failed to create role:', error);
    return res.status(500).json({ error: 'Failed to create role' });
  }
}

/**
 * Update a custom role
 */
export async function updateRole(req, res) {
  try {
    const { name } = req.params;
    const { description, permissions, hierarchy } = req.body;

    // Check if role is a system role
    if (DEFAULT_ROLES[name]) {
      return res.status(400).json({ error: 'Cannot modify system roles' });
    }

    // Validate permissions if provided
    if (permissions) {
      const validPermissions = Object.keys(PERMISSIONS);
      const invalidPermissions = permissions.filter((p) => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          error: 'Invalid permissions',
          invalid: invalidPermissions,
        });
      }
    }

    const oldRole = await rbacRepository.getRoleByName(name);

    const updatedRole = await rbacRepository.updateRole(name, {
      description,
      permissions,
      hierarchy,
    });

    if (!updatedRole) {
      return res.status(404).json({ error: 'Role not found or is a system role' });
    }

    // Log audit event
    await rbacRepository.logAuditEvent({
      adminId: req.adminSession.username,
      action: 'ROLE_UPDATED',
      oldValue: oldRole,
      newValue: updatedRole,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ role: updatedRole });
  } catch (error) {
    console.error('[RBAC] Failed to update role:', error);
    return res.status(500).json({ error: 'Failed to update role' });
  }
}

/**
 * Delete a custom role
 */
export async function deleteRole(req, res) {
  try {
    const { name } = req.params;

    // Check if role is a system role
    if (DEFAULT_ROLES[name]) {
      return res.status(400).json({ error: 'Cannot delete system roles' });
    }

    const deletedRole = await rbacRepository.deleteRole(name);

    if (!deletedRole) {
      return res.status(404).json({ error: 'Role not found or is a system role' });
    }

    // Log audit event
    await rbacRepository.logAuditEvent({
      adminId: req.adminSession.username,
      action: 'ROLE_DELETED',
      oldValue: deletedRole,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('[RBAC] Failed to delete role:', error);
    return res.status(500).json({ error: 'Failed to delete role' });
  }
}

/**
 * Get all users with their roles
 */
export async function getUsersWithRoles(req, res) {
  try {
    const users = await rbacRepository.getAllUsersWithRoles();
    return res.json({ users });
  } catch (error) {
    console.error('[RBAC] Failed to get users:', error);
    return res.status(500).json({ error: 'Failed to retrieve users' });
  }
}

/**
 * Assign role to user
 */
export async function assignRole(req, res) {
  try {
    const { userId, roleName, expiresAt } = req.body;

    if (!userId || !roleName) {
      return res.status(400).json({ error: 'userId and roleName are required' });
    }

    // Check if role exists
    const role = DEFAULT_ROLES[roleName] || (await rbacRepository.getRoleByName(roleName));
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const assignment = await rbacRepository.assignRole(
      userId,
      roleName,
      req.adminSession.username,
      expiresAt
    );

    // Log audit event
    await rbacRepository.logAuditEvent({
      adminId: req.adminSession.username,
      action: 'ROLE_ASSIGNED',
      targetUserId: userId,
      newValue: { roleName, expiresAt },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ assignment });
  } catch (error) {
    console.error('[RBAC] Failed to assign role:', error);
    return res.status(500).json({ error: 'Failed to assign role' });
  }
}

/**
 * Revoke role from user
 */
export async function revokeRole(req, res) {
  try {
    const { userId, roleName } = req.params;

    if (!userId || !roleName) {
      return res.status(400).json({ error: 'userId and roleName are required' });
    }

    const revoked = await rbacRepository.revokeRole(parseInt(userId), roleName);

    if (!revoked) {
      return res.status(404).json({ error: 'Role assignment not found' });
    }

    // Log audit event
    await rbacRepository.logAuditEvent({
      adminId: req.adminSession.username,
      action: 'ROLE_REVOKED',
      targetUserId: parseInt(userId),
      oldValue: { roleName },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('[RBAC] Failed to revoke role:', error);
    return res.status(500).json({ error: 'Failed to revoke role' });
  }
}

/**
 * Bulk assign roles
 */
export async function bulkAssignRoles(req, res) {
  try {
    const { assignments } = req.body;

    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ error: 'assignments array is required' });
    }

    const results = await rbacRepository.bulkAssignRoles(assignments, req.adminSession.username);

    // Log audit event
    await rbacRepository.logAuditEvent({
      adminId: req.adminSession.username,
      action: 'BULK_ROLE_ASSIGNED',
      newValue: { count: results.length, assignments },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ results });
  } catch (error) {
    console.error('[RBAC] Failed to bulk assign roles:', error);
    return res.status(500).json({ error: 'Failed to bulk assign roles' });
  }
}

/**
 * Get audit logs
 */
export async function getAuditLogs(req, res) {
  try {
    const { adminId, action, startDate, endDate, limit, offset } = req.query;

    const logs = await rbacRepository.getAuditLogs({
      adminId,
      action,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    });

    return res.json({ logs });
  } catch (error) {
    console.error('[RBAC] Failed to get audit logs:', error);
    return res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
}

/**
 * Get permission matrix (roles vs permissions)
 */
export async function getPermissionMatrix(req, res) {
  try {
    const allPermissions = Object.keys(PERMISSIONS);
    const matrix = {};

    // Add default roles
    for (const [roleName, roleConfig] of Object.entries(DEFAULT_ROLES)) {
      matrix[roleName] = {
        name: roleConfig.name,
        permissions: allPermissions.map((p) => ({
          permission: p,
          granted: roleConfig.permissions.includes(p),
        })),
      };
    }

    // Add custom roles
    const customRoles = await rbacRepository.getAllRoles();
    for (const role of customRoles) {
      matrix[role.name] = {
        name: role.name,
        permissions: allPermissions.map((p) => ({
          permission: p,
          granted: role.permissions.includes(p),
        })),
      };
    }

    return res.json({ matrix });
  } catch (error) {
    console.error('[RBAC] Failed to get permission matrix:', error);
    return res.status(500).json({ error: 'Failed to retrieve permission matrix' });
  }
}
