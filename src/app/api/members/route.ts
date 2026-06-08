import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifyTenantAccess, checkRole, hasPermission } from '../../../lib/auth/rbac';

/**
 * GET /api/members - List all members in the current workspace.
 */
export async function GET(request: Request) {
  try {
    const workspaceId = request.headers.get('x-workspace-id');
    const userId = request.headers.get('x-user-id');

    if (!workspaceId || !userId) {
      return NextResponse.json(
        { error: 'Missing tenant workspace or user identity' },
        { status: 400 }
      );
    }

    // Must be a member to view membership lists
    const isMember = await verifyTenantAccess(userId, workspaceId);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Retrieve members for the current workspace
    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('[API Members GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/members - Update a member's role within the current workspace.
 * Requires checkRole for Admin/Owner or 'manage:members' permission.
 */
export async function PATCH(request: Request) {
  try {
    const workspaceId = request.headers.get('x-workspace-id');
    const userId = request.headers.get('x-user-id');

    if (!workspaceId || !userId) {
      return NextResponse.json(
        { error: 'Missing tenant workspace or user identity' },
        { status: 400 }
      );
    }

    // Require OWNER or ADMIN role to change membership roles
    const isAdmin = await checkRole(userId, workspaceId, ['OWNER', 'ADMIN']);
    const hasManagePerm = await hasPermission(userId, workspaceId, 'manage:members');

    if (!isAdmin && !hasManagePerm) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to manage members.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetUserId, newRoleId } = body;

    if (!targetUserId || !newRoleId) {
      return NextResponse.json(
        { error: 'targetUserId and newRoleId are required' },
        { status: 400 }
      );
    }

    // Ensure the role belongs to the workspace or is a system role
    const role = await prisma.role.findFirst({
      where: {
        id: newRoleId,
        OR: [{ workspaceId: null }, { workspaceId: workspaceId }],
      },
    });

    if (!role) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update member role within workspace
    const updatedMember = await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
      data: {
        roleId: newRoleId,
      },
    });

    // Log this action
    await prisma.log.create({
      data: {
        action: 'UPDATE_MEMBER_ROLE',
        details: `Updated role for user ${targetUserId} to ${role.name}`,
        userId: userId,
        workspaceId: workspaceId,
      },
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error('[API Members PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
