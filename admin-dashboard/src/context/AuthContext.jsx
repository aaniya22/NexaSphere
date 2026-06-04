// AuthContext.jsx
// Drop-in auth context that wires authUtils + axiosInstance together.
// Wrap your app root with <AuthProvider> and consume with useAuth().

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  saveTokenAndScheduleLogout,
  clearAutoLogoutTimer,
  rehydrateSession,
  getToken,
  removeToken,
} from './authUtils';
import { setupAxiosInterceptors } from './axiosInstance';

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());

  /**
   * Central logout — clear timer, remove token, update state, redirect.
   * Passed into authUtils so the timer can call it directly.
   */
  const logout = useCallback(
    (message = 'Your session has expired. Please log in again.') => {
      clearAutoLogoutTimer();
      removeToken();
      setIsAuthenticated(false);
      navigate('/login', { replace: true, state: { message } });
    },
    [navigate]
  );

  /**
   * Call after a successful login API response.
   * @param {string} token - The raw JWT from the server.
   */
  const login = useCallback(
    (token) => {
      saveTokenAndScheduleLogout(token, logout);
      setIsAuthenticated(true);
      navigate('/dashboard', { replace: true });
    },
    [logout, navigate]
  );

  // On mount: wire the Axios interceptor + re-hydrate any existing session.
  useEffect(() => {
    setupAxiosInterceptors(navigate);
    rehydrateSession(logout);
  }, [logout, navigate]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
