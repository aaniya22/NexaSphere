import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyTenantAccess, checkRole } from '../../../../lib/auth/rbac';

/**
 * GET /api/admin/audit-logs
 * Secure endpoint to fetch enterprise audit logs.
 * Restricted to administrators/owners. Supports cursor-based pagination, actor, entity, and date filtering.
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

    // Verify workspace membership
    const isMember = await verifyTenantAccess(userId, workspaceId);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Restrict access to ADMIN/OWNER roles only
    const isAdmin = await checkRole(userId, workspaceId, ['ADMIN', 'OWNER']);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor') || undefined;
    const actorId = searchParams.get('actorId') || undefined;
    const entity = searchParams.get('entity') || undefined;
    const startDateParam = searchParams.get('startDate') || undefined;
    const endDateParam = searchParams.get('endDate') || undefined;

    const where: any = {};

    // Filter by actor
    if (actorId) {
      where.actorId = actorId;
    }

    // Filter by entity
    if (entity) {
      where.entity = entity;
    }

    // Filter by date range
    if (startDateParam || endDateParam) {
      where.timestamp = {};
      if (startDateParam) {
        where.timestamp.gte = new Date(startDateParam);
      }
      if (endDateParam) {
        where.timestamp.lte = new Date(endDateParam);
      }
    }

    // Fetch logs with cursor pagination
    const logs = await prisma.auditLog.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
      where,
      orderBy: {
        timestamp: 'desc',
      },
    });

    let nextCursor: string | undefined = undefined;
    if (logs.length > limit) {
      const nextItem = logs.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({
      logs,
      nextCursor,
    });
  } catch (error) {
    console.error('[API AuditLogs GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
