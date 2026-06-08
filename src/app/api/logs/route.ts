import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifyTenantAccess, hasPermission } from '../../../lib/auth/rbac';

/**
 * GET /api/logs - Fetch workspace activity logs.
 * Restricted to administrators/owners or users with the 'read:logs' permission.
 */
export async function GET(request: Request) {
  try {
    const workspaceId = request.headers.get('x-workspace-id');
    const userId = request.headers.get('x-user-id');

    if (!workspaceId || !userId) {
      return NextResponse.json({ error: 'Missing tenant workspace or user identity' }, { status: 400 });
    }

    // Verify workspace access and specific 'read:logs' permission
    const isMember = await verifyTenantAccess(userId, workspaceId);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const canReadLogs = await hasPermission(userId, workspaceId, 'read:logs');
    if (!canReadLogs) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to view logs.' }, { status: 403 });
    }

    // Query strictly scoped to the tenant
    const logs = await prisma.log.findMany({
      where: {
        workspaceId: workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('[API Logs GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/logs - Write a custom log entry.
 */
export async function POST(request: Request) {
  try {
    const workspaceId = request.headers.get('x-workspace-id');
    const userId = request.headers.get('x-user-id');

    if (!workspaceId || !userId) {
      return NextResponse.json({ error: 'Missing tenant workspace or user identity' }, { status: 400 });
    }

    // Ensure member status
    const isMember = await verifyTenantAccess(userId, workspaceId);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { action, details } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Write log entry scoped to the tenant workspace
    const newLog = await prisma.log.create({
      data: {
        action,
        details,
        userId: userId,
        workspaceId: workspaceId,
      },
    });

    return NextResponse.json({ log: newLog }, { status: 201 });
  } catch (error) {
    console.error('[API Logs POST] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
