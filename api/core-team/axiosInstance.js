// axiosInstance.js
// A pre-configured Axios instance with a global 401 interceptor.
// Import and use this everywhere instead of the bare `axios` object.

import axios from 'axios';
import { getToken, removeToken, clearAutoLogoutTimer } from './authUtils';

// ─── 1. Create a shared instance ──────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15_000,
});

// ─── 2. Request interceptor — attach Bearer token automatically ───────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── 3. Response interceptor — handle 401 globally ───────────────────────────
/**
 * Initialise the 401 interceptor.
 * Call this once during app bootstrap, passing your router's `navigate` function.
 *
 * Example (React Router v6):
 *   import { useNavigate } from 'react-router-dom';
 *   const navigate = useNavigate();
 *   setupAxiosInterceptors(navigate);
 */
export function setupAxiosInterceptors(navigate) {
  axiosInstance.interceptors.response.use(
    (response) => response, // pass-through for successful responses

    (error) => {
      if (error.response?.status === 401) {
        // Stop the proactive timer — we're already logging out reactively.
        clearAutoLogoutTimer();

        // Clean up stored credentials.
        removeToken();

        // Redirect to login with a user-friendly message.
        navigate('/login', {
          replace: true,
          state: { message: 'Your session has expired. Please log in again.' },
        });
      }

      return Promise.reject(error);
    }
  );
}

export default axiosInstance;