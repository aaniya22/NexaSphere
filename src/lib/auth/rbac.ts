import { prisma } from '../prisma';

/**
 * Checks if a user is a member of the given workspace (tenant).
 * This function verifies that a corresponding WorkspaceMember entry exists.
 *
 * @param userId - The unique identifier of the user.
 * @param workspaceId - The unique identifier of the workspace (tenant).
 * @returns A promise that resolves to true if the user is a member of the workspace, false otherwise.
 *
 * @example
 * ```ts
 * const hasAccess = await verifyTenantAccess("user-123", "workspace-456");
 * if (!hasAccess) {
 *   throw new Error("Unauthorized access to workspace");
 * }
 * ```
 */
export async function verifyTenantAccess(userId: string, workspaceId: string): Promise<boolean> {
  if (!userId || !workspaceId) {
    return false;
  }

  try {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    return !!member;
  } catch (error) {
    console.error(
      `[RBAC] Error in verifyTenantAccess for user ${userId} and workspace ${workspaceId}:`,
      error
    );
    return false;
  }
}

/**
 * Checks if a user has one of the specified allowed roles in the given workspace.
 *
 * @param userId - The unique identifier of the user.
 * @param workspaceId - The unique identifier of the workspace.
 * @param allowedRoles - An array of role names that are permitted to access the resource.
 * @returns A promise that resolves to true if the user's role is in the allowed list, false otherwise.
 *
 * @example
 * ```ts
 * const isAdmin = await checkRole("user-123", "workspace-456", ["ADMIN", "OWNER"]);
 * if (!isAdmin) {
 *   // Deny action
 * }
 * ```
 */
export async function checkRole(
  userId: string,
  workspaceId: string,
  allowedRoles: string[]
): Promise<boolean> {
  if (!userId || !workspaceId || !allowedRoles || allowedRoles.length === 0) {
    return false;
  }

  try {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        role: true,
      },
    });

    if (!member || !member.role) {
      return false;
    }

    return allowedRoles.includes(member.role.name);
  } catch (error) {
    console.error(
      `[RBAC] Error in checkRole for user ${userId} and workspace ${workspaceId}:`,
      error
    );
    return false;
  }
}

/**
 * Checks if a user's role in the given workspace has the specified permission.
 * Resolves permissions granularly mapped to roles.
 *
 * @param userId - The unique identifier of the user.
 * @param workspaceId - The unique identifier of the workspace.
 * @param permissionName - The exact permission string to check (e.g., 'write:posts').
 * @returns A promise that resolves to true if the user has the required permission, false otherwise.
 *
 * @example
 * ```ts
 * const canPublish = await hasPermission("user-123", "workspace-456", "publish:posts");
 * if (!canPublish) {
 *   return new Response("Forbidden", { status: 403 });
 * }
 * ```
 */
export async function hasPermission(
  userId: string,
  workspaceId: string,
  permissionName: string
): Promise<boolean> {
  if (!userId || !workspaceId || !permissionName) {
    return false;
  }

  try {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!member || !member.role || !member.role.permissions) {
      return false;
    }

    return member.role.permissions.some((permission) => permission.name === permissionName);
  } catch (error) {
    console.error(
      `[RBAC] Error in hasPermission for user ${userId}, workspace ${workspaceId}, permission ${permissionName}:`,
      error
    );
    return false;
  }
}

/**
 * Resolves and lists all permissions granted to a user within a specific workspace.
 *
 * @param userId - The unique identifier of the user.
 * @param workspaceId - The unique identifier of the workspace.
 * @returns A promise that resolves to an array of permission names.
 */
export async function getTenantPermissions(userId: string, workspaceId: string): Promise<string[]> {
  if (!userId || !workspaceId) {
    return [];
  }

  try {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!member || !member.role || !member.role.permissions) {
      return [];
    }

    return member.role.permissions.map((permission) => permission.name);
  } catch (error) {
    console.error(
      `[RBAC] Error in getTenantPermissions for user ${userId} and workspace ${workspaceId}:`,
      error
    );
    return [];
  }
}
