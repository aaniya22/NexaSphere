import React, {
createContext,
useCallback,
useContext,
useEffect,
useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  saveTokenAndScheduleLogout,
  clearAutoLogoutTimer,
  rehydrateSession,
  getToken,
  removeToken,
} from '../utils/authUtils';

const AuthContext = createContext(null);

const LOGOUT_EVENT_KEY = 'logout-event';

export function AuthProvider({ children }) {
const navigate = useNavigate();
const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());

const logout = useCallback(
(message = 'Your session has expired. Please log in again.') => {
clearAutoLogoutTimer();

  removeToken();

  // Broadcast logout to other tabs
  localStorage.setItem(LOGOUT_EVENT_KEY, Date.now().toString());

  setIsAuthenticated(false);

  navigate('/login', {
    replace: true,
    state: { message },
  });
},
[navigate]
);

const login = useCallback(
(token) => {
saveTokenAndScheduleLogout(token, logout);
setIsAuthenticated(true);

  navigate('/dashboard', {
    replace: true,
  });
},
[logout, navigate]
);

// On mount: re-hydrate any existing session.
useEffect(() => {
rehydrateSession(logout);
}, [logout]);

// Cross-tab logout sync
useEffect(() => {
const handleStorageChange = (event) => {
if (
event.key === LOGOUT_EVENT_KEY ||
(event.key === 'token' && !event.newValue)
) {
clearAutoLogoutTimer();
setIsAuthenticated(false);

    navigate('/login', {
      replace: true,
      state: {
        message: 'You have been logged out from another tab.',
      },
    });
  }
};

window.addEventListener('storage', handleStorageChange);

return () => {
  window.removeEventListener('storage', handleStorageChange);
};

}, [navigate]);

return (
<AuthContext.Provider
value={{
isAuthenticated,
login,
logout,
}}
>
{children}
</AuthContext.Provider>
);
}

export function useAuth() {
const ctx = useContext(AuthContext);

if (!ctx) {
throw new Error('useAuth must be used inside <AuthProvider>');
}

return ctx;
}
