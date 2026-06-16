import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';

export const StudentAuthContext = createContext(null);

const TOKEN_KEY = 'ns_student_token';

export function StudentAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (token) => {
    try {
      const data = await apiClient('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, token);
      if (data.user) {
        localStorage.setItem(
          'ns_user',
          JSON.stringify({
            id: data.user.sub || data.user.id,
            email: data.user.email,
            name: data.user.name,
          })
        );
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('ns_user');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      params.delete('token');
      const cleanUrl =
        window.location.pathname +
        (params.toString() ? '?' + params.toString() : '') +
        window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
      fetchMe(urlToken);
      setLoading(false);
      return;
    }

    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      fetchMe(storedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const login = useCallback((provider) => {
    window.location.href = `/api/auth/${provider}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('ns_user');
    setUser(null);
  }, []);

  const value = { user, loading, login, logout, isAuthenticated: !!user };

  return <StudentAuthContext.Provider value={value}>{children}</StudentAuthContext.Provider>;
}

export function useStudentAuth() {
  const ctx = useContext(StudentAuthContext);
  if (!ctx) throw new Error('useStudentAuth must be used within StudentAuthProvider');
  return ctx;
}
