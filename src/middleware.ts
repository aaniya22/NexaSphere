import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import createIntlMiddleware from 'next-intl/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localeDetection: true,
});

const JWKS_URI = process.env.JWKS_URI || `${process.env.NEXTAUTH_URL || ''}/.well-known/jwks.json`;
const EXPECTED_ISSUER = process.env.JWT_ISSUER || process.env.NEXTAUTH_URL || '';
const EXPECTED_AUDIENCE = process.env.JWT_AUDIENCE || 'nexasphere';

let jwksClient: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwksClient && JWKS_URI) {
    const url = new URL(JWKS_URI);
    jwksClient = createRemoteJWKSet(url);
  }
  return jwksClient;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // i18n handling for non-API routes
  if (!pathname.startsWith('/api/')) {
    const intlResponse = intlMiddleware(request);
    if (intlResponse) {
      return intlResponse;
    }
  }

  // JWT verification for workspace routes
  const pathParts = pathname.split('/');
  const wIndex = pathParts.findIndex((part) => part === 'w');

  if (wIndex === -1 || wIndex + 1 >= pathParts.length) {
    return NextResponse.next();
  }

  const workspaceId = pathParts[wIndex + 1];

  const token =
    request.cookies.get('session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!token) {
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
    const decodedSession = await verifyJwt(token);

    if (!decodedSession || !decodedSession.userId) {
      throw new Error('Invalid session token payload');
    }

    const userId = decodedSession.userId;
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

async function verifyJwt(token: string): Promise<Record<string, unknown> | null> {
  try {
    const client = getJWKS();
    if (!client) {
      throw new Error('JWKS client not configured — set JWKS_URI or NEXTAUTH_URL');
    }

    const { payload } = await jwtVerify(token, client, {
      issuer: EXPECTED_ISSUER || undefined,
      audience: EXPECTED_AUDIENCE || undefined,
    });

    return payload as Record<string, unknown>;
  } catch (err) {
    console.error('[Middleware] JWT verification failed:', err);
    return null;
  }
}

async function fetchTenantAccess(
  userId: string,
  workspaceId: string,
  origin: string
): Promise<boolean> {
  const internalSecret = process.env.INTERNAL_AUTH_SECRET;
  if (!internalSecret) {
    console.error('[Middleware] INTERNAL_AUTH_SECRET not configured');
    return false;
  }
  try {
    const res = await fetch(
      `${origin}/api/auth/verify-tenant?userId=${userId}&workspaceId=${workspaceId}`,
      {
        headers: {
          'x-internal-secret': internalSecret,
        },
      }
    );

    if (!res.ok) return false;
    const data = await res.json();
    return !!data.hasAccess;
  } catch (err) {
    console.error(
      '[Middleware] Failed to verify tenant access via internal API. Denying access:',
      err
    );
    return false;
  }
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/api/w/:workspaceId*/:path*'],
};
