/**
 * Client-side URL sanitization for portfolio href attributes.
 *
 * Mirrors the server-side allowlist in
 * `server/validators/portfolioSchemas.js` and
 * `server/utils/sanitize.js` so that any unsafe URL that somehow
 * reaches the browser is still rejected before it can be assigned
 * to a link's `href` (defense in depth).
 *
 * Returns `null` for any value that is not a safe http(s) URL or
 * a root-relative path.  Callers should use the result only when
 * it is non-null.
 */

const SAFE_URL_PATTERN = /^(https?:\/|\/[^/])/i;
const UNSAFE_PROTOCOL_PATTERN = /^\s*(javascript|data|vbscript|file|about|chrome|jar|mocha):/i;
const URL_MAX = 2048;

export function isSafeHref(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > URL_MAX) return false;
  if (UNSAFE_PROTOCOL_PATTERN.test(trimmed)) return false;
  return SAFE_URL_PATTERN.test(trimmed);
}

/**
 * Return a safe href value, or `null` if the input is unsafe.
 * Useful as a direct prop: `href={safeHref(value) || '#'}`
 */
export function safeHref(value) {
  return isSafeHref(value) ? value.trim() : null;
}
