import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Wifi, WifiOff, RefreshCw, X, Download } from 'lucide-react';
import '../../styles/pwa.css';

export default function PWAHandler() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineRestore, setShowOnlineRestore] = useState(false);
  const [isDismissingOnline, setIsDismissingOnline] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (import.meta.env.DEV) {
        console.log('NexaSphere Service Worker registered successfully:', r);
      }
    },
    onRegisterError(error) {
      if (import.meta.env.DEV) {
        console.error('NexaSphere Service Worker registration failed:', error.message ?? error);
      }
    },
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsDismissingOnline(false);
      setShowOnlineRestore(true);

      // Auto-dismiss the online restore banner after 3 seconds
      const dismissTimer = setTimeout(() => {
        setIsDismissingOnline(true);
        const removeTimer = setTimeout(() => {
          setShowOnlineRestore(false);
          setIsDismissingOnline(false);
        }, 400); // matches the CSS pwaFadeOut animation duration
        return () => clearTimeout(removeTimer);
      }, 3000);

      return () => clearTimeout(dismissTimer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineRestore(false);
      setIsDismissingOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const closeUpdatePrompt = () => {
    setNeedRefresh(false);
  };

  const closeOfflineReadyPrompt = () => {
    setOfflineReady(false);
  };

  return (
    <>
      {/* ── CONNECTION STATUS TOP BANNER ── */}
      <div className="pwa-toast-container top-center">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="pwa-conn-banner offline" role="alert" aria-live="assertive">
            <div className="pwa-conn-status-dot" />
            <WifiOff size={16} className="pwa-toast-icon-svg" />
            <span className="pwa-conn-message">
              You are currently offline. Running on cached data.
            </span>
          </div>
        )}

        {/* Online Restore Banner */}
        {isOnline && showOnlineRestore && (
          <div
            className={`pwa-conn-banner online ${isDismissingOnline ? 'dismissing' : ''}`}
            role="status"
            aria-live="polite"
          >
            <div className="pwa-conn-status-dot" />
            <Wifi size={16} className="pwa-toast-icon-svg" />
            <span className="pwa-conn-message">Internet connection restored. Sync active.</span>
          </div>
        )}
      </div>

      {/* ── UPDATE PROMPT / OFFLINE READY BANNER (BOTTOM-RIGHT) ── */}
      <div className="pwa-toast-container bottom-right">
        {/* New Update Available Toast */}
        {needRefresh && (
          <div
            className="pwa-toast-card"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
            role="alertdialog"
            aria-labelledby="pwa-update-title"
            aria-describedby="pwa-update-desc"
          >
            <div className="pwa-toast-header">
              <div className="pwa-toast-icon warning">
                <RefreshCw size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div className="pwa-toast-body" style={{ color: 'var(--color-text-primary)' }}>
                <h4 id="pwa-update-title" className="pwa-toast-title">
                  New Update Available!
                </h4>
                <p
                  id="pwa-update-desc"
                  className="pwa-toast-description"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  A premium new version of NexaSphere is ready. Refresh now to experience the latest
                  features.
                </p>
              </div>
            </div>
            <div className="pwa-toast-actions">
              <button
                className="pwa-btn pwa-btn-secondary"
                onClick={closeUpdatePrompt}
                aria-label="Dismiss update notification"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  borderColor: 'var(--color-border)',
                }}
              >
                Later
              </button>
              <button
                className="pwa-btn pwa-btn-primary"
                onClick={() => updateServiceWorker(true)}
                aria-label="Update app and reload"
                style={{
                  backgroundColor: 'var(--color-primary)',
                }}
              >
                Update Now
              </button>
            </div>
          </div>
        )}

        {/* Offline Ready Toast (Only show temporarily when app is cached) */}
        {offlineReady && (
          <div
            className="pwa-toast-card"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
            role="status"
            aria-labelledby="pwa-ready-title"
            aria-describedby="pwa-ready-desc"
          >
            <div className="pwa-toast-header">
              <div className="pwa-toast-icon success" style={{ color: 'var(--color-success)' }}>
                <Download size={20} />
              </div>
              <div className="pwa-toast-body">
                <h4 id="pwa-ready-title" className="pwa-toast-title">
                  Offline Ready!
                </h4>
                <p id="pwa-ready-desc" className="pwa-toast-description">
                  NexaSphere has been fully cached. You can now access all core pages even without
                  internet connection!
                </p>
              </div>
              <button
                onClick={closeOfflineReadyPrompt}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--color-text-tertiary)',
                }}
                aria-label="Close offline notification"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
