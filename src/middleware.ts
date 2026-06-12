import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'es'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Enable automatic locale detection based on the Accept-Language header
  localeDetection: true,
});

export const config = {
  // Match only internationalized pathnames.
  // It intercepts all routes except API, static files, and special metadata paths.
  matcher: [
    // Match all pathnames except for:
    // - API routes (/api/*)
    // - Next.js internals (/ _next/*)
    // - Next.js static files (/static/*, /favicon.ico, /images/*, etc.)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
