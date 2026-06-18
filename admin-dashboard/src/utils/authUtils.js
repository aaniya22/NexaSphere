// authUtils.js
// Handles JWT decoding, proactive auto-logout scheduling, and token cleanup.

import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'admin_token';
const STORE = sessionStorage;
let _logoutTimer = null;

/**
 * Persist token and schedule automatic logout before it expires.
 * Call this immediately after a successful login.
 *
 * @param {string} token  - Raw JWT string received from the server.
 * @param {Function} logoutFn - Your app's logout action (clears state + redirects).
 */
export function saveTokenAndScheduleLogout(token, logoutFn) {
  STORE.setItem(TOKEN_KEY, token);
  scheduleAutoLogout(token, logoutFn);
}

/**
 * Decode the JWT and set a timer to call logoutFn ~30 s before expiry
 * (gives any in-flight requests a chance to complete cleanly).
 */
export function scheduleAutoLogout(token, logoutFn) {
  clearAutoLogoutTimer(); // cancel any previously scheduled timer

  try {
    const { exp } = jwtDecode(token);
    if (!exp) return;

    const BUFFER_MS = 30_000; // 30-second safety buffer
    const msUntilExpiry = exp * 1000 - Date.now() - BUFFER_MS;

    if (msUntilExpiry <= 0) {
      // Token already expired (or expiring imminently) — log out right away.
      logoutFn();
      return;
    }

    _logoutTimer = setTimeout(() => {
      logoutFn();
    }, msUntilExpiry);
  } catch (err) {
    console.error('[authUtils] Failed to decode JWT — logging out for safety.', err);
    logoutFn();
  }
}

/** Cancel a pending auto-logout timer (e.g. on manual logout or token refresh). */
export function clearAutoLogoutTimer() {
  if (_logoutTimer !== null) {
    clearTimeout(_logoutTimer);
    _logoutTimer = null;
  }
}

/** Return the stored token, or null if absent. */
export function getToken() {
  return STORE.getItem(TOKEN_KEY);
}

/** Wipe the token from storage (call inside your logoutFn). */
export function removeToken() {
  STORE.removeItem(TOKEN_KEY);
}

/**
 * Re-hydrate the auto-logout timer on page reload.
 * Call once during app bootstrap (e.g. inside useEffect in <App>).
 *
 * @param {Function} logoutFn
 */
export function rehydrateSession(logoutFn) {
  const token = getToken();
  if (token) {
    scheduleAutoLogout(token, logoutFn);
  }
}
