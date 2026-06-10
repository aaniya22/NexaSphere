const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

let _email = null;
let _role = null;
let _scopes = [];

let refreshPromise = null;

export const auth = {
  async login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Invalid credentials');
    }

    const data = await res.json();

    _email = cleanEmail;
    _role = data.role || null;
    _scopes = data.scopes || [];

    return data;
  },

  async logout() {
    fetch(`${API_BASE}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});

    _email = null;
    _role = null;
    _scopes = [];
  },

  async refreshSession() {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      const res = await fetch(`${API_BASE}/api/admin/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        this.logout();
        throw new Error('Session refresh failed');
      }

      const data = await res.json();

      if (data.email) _email = data.email;
      if (data.role) _role = data.role;
      if (data.scopes) _scopes = data.scopes;

      return data;
    })();

    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  },

  async verifySession() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/me`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        try {
          await this.refreshSession();
          return true;
        } catch {
          return false;
        }
      }

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.email) _email = data.email;
        if (data.role) _role = data.role;
        if (data.scopes) _scopes = data.scopes;
      }

      return res.ok;
    } catch {
      return false;
    }
  },

  getEmail() {
    return _email;
  },

  getRole() {
    return _role || 'SuperAdmin';
  },

  getScopes() {
    return _scopes.length > 0
      ? _scopes
      : ['users:read', 'users:write', 'settings:admin', 'events:read', 'events:write'];
  },

  isOffline() {
    return !import.meta.env.VITE_API_BASE;
  },

  isOfflineMode() {
    return this.isOffline();
  },
};
