import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifyTenantAccess, hasPermission } from '../../../lib/auth/rbac';

/**
 * GET /api/posts - Fetch all posts scoped to the current workspace.
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

    // Ensure user has tenant-level access
    const isMember = await verifyTenantAccess(userId, workspaceId);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Query strictly scoped to the tenant
    const posts = await prisma.post.findMany({
      where: {
        workspaceId: workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('[API Posts GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/posts - Create a new post scoped to the current workspace.
 */
export async function POST(request: Request) {
  try {
    const workspaceId = request.headers.get('x-workspace-id');
    const userId = request.headers.get('x-user-id');

    if (!workspaceId || !userId) {
      return NextResponse.json(
        { error: 'Missing tenant workspace or user identity' },
        { status: 400 }
      );
    }

    // Ensure user has specific permission to create posts
    const canCreate = await hasPermission(userId, workspaceId, 'create:posts');
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to create posts.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, published } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create post strictly bound to the workspace
    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        published: !!published,
        authorId: userId,
        workspaceId: workspaceId,
      },
    });

    // Log the action within the workspace context
    await prisma.log.create({
      data: {
        action: 'CREATE_POST',
        details: `Created post: ${title} (${newPost.id})`,
        userId: userId,
        workspaceId: workspaceId,
      },
    });

    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch (error) {
    console.error('[API Posts POST] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
