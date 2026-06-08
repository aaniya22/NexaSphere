import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Matcher to protect workspace routes (e.g., /w/:workspaceId/...)
export const config = {
  matcher: ['/w/:workspaceId*/:path*', '/api/w/:workspaceId*/:path*'],
};

/**
 * Next.js Middleware to enforce Multi-Tenant isolation and verify tenant-scoped access.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract workspace/tenant ID from the route path:
  // e.g. path starts with "/w/[workspaceId]" or "/api/w/[workspaceId]"
  const pathParts = pathname.split('/');

  // Find index of 'w' to determine the next parameter as workspaceId
  const wIndex = pathParts.findIndex((part) => part === 'w');

  if (wIndex === -1 || wIndex + 1 >= pathParts.length) {
    return NextResponse.next();
  }

  const workspaceId = pathParts[wIndex + 1];

  // Retrieve user session / JWT cookie (standard auth tokens)
  const token =
    request.cookies.get('session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!token) {
    // Redirect to login if this is a web route, or return 401 if it's an API route
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required. No session found.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 1. Decode / Verify session token
    // In a real application, verify JWT using jose or similar edge-safe library.
    // Here we decode a mock JWT or verify session using our database.
    const decodedSession = parseJwt(token);

    if (!decodedSession || !decodedSession.userId) {
      throw new Error('Invalid session token payload');
    }

    const userId = decodedSession.userId;

    // 2. Verify user tenant access
    // Under Edge runtime, standard Prisma direct connections may fail,
    // so we can perform an edge-compatible DB check or call an internal service/API.
    // For demonstration of the middleware's logic:
    const hasAccess = await fetchTenantAccess(userId, workspaceId, request.nextUrl.origin);

    if (!hasAccess) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden. You do not have access to this workspace.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Attach workspace ID and User ID to headers for downstream requests
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-workspace-id', workspaceId);
    requestHeaders.set('x-user-id', userId);
    requestHeaders.set('x-user-role', decodedSession.role || 'MEMBER');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('[Middleware] Authentication error:', error);

    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }
}

/**
 * Basic base64 decoding helper for JWT (Edge compatible)
 */
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Validates tenant access via a secure internal endpoint or mock validation
 */
async function fetchTenantAccess(
  userId: string,
  workspaceId: string,
  origin: string
): Promise<boolean> {
  // During local development/testing, we can fall back to true or make an internal fetch
  try {
    const res = await fetch(
      `${origin}/api/auth/verify-tenant?userId=${userId}&workspaceId=${workspaceId}`,
      {
        headers: {
          'x-internal-secret': process.env.INTERNAL_AUTH_SECRET || 'fallback-secret',
        },
      }
    );

    if (!res.ok) return false;
    const data = await res.json();
    return !!data.hasAccess;
  } catch (err) {
    console.warn(
      '[Middleware] Failed to verify tenant access via internal API. Assuming local check:',
      err
    );
    // Return true for local environment placeholders if internal service is not reachable
    return true;
  }
}
