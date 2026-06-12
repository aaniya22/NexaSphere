import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import './i18n';
import { registerSW } from 'virtual:pwa-register';
import { initializeSentry } from './utils/errorTracking.js';
import * as Sentry from '@sentry/react';
import { ThemeProvider } from './context/theme/ThemeProvider';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import { initSyncManager } from './utils/syncManager.js';
import reportWebVitals from './reportWebVitals.js';

// ── Sentry error tracking ─────────────────────────────────────────────────────
initializeSentry();

window.addEventListener('unhandledrejection', (event) => {
  Sentry.captureException(event.reason, {
    tags: { type: 'unhandledrejection' },
  });
});

window.addEventListener('error', (event) => {
  Sentry.captureException(event.error, { tags: { type: 'uncaughterror' } });
});

// Apply saved theme before React renders — prevents flash of wrong theme
const savedTheme = localStorage.getItem('ns-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// ── PWA Service Worker Registration ──────────────────────────────────────────
let _updateSW = null;

_updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA] New service worker available — notifying UI.');
    window.dispatchEvent(
      new CustomEvent('nexasphere:sw-update', { detail: { updateSW: _updateSW } })
    );
  },

  onOfflineReady() {
    console.log('[PWA] App is ready to work offline.');
    window.dispatchEvent(new CustomEvent('nexasphere:sw-offline-ready'));
  },

  onRegisterError(error) {
    console.error('[PWA] Service worker registration failed:', error);
    Sentry.captureException(error, { tags: { type: 'sw-register-error' } });
  },
});

// Trigger an immediate check for updates on app load
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.update().catch((err) => {
      console.warn('[PWA] Service worker update check failed on app load:', err);
    });
  });
}

initSyncManager();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <GlobalErrorBoundary>
          <App />
        </GlobalErrorBoundary>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>
);

// Performance monitoring (Web Vitals) sent to analytics backend
reportWebVitals((metric) => {
  const body = JSON.stringify(metric);
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/performance/vitals', body);
  } else {
    fetch('/api/performance/vitals', { body, method: 'POST', keepalive: true });
  }
});
