import { useState, useEffect } from 'react';
import { auth } from '../services/auth';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!auth || typeof auth.isOfflineMode !== 'function') return;

    setIsOffline(auth.isOfflineMode());

    const checkInterval = setInterval(() => {
      if (typeof auth.isOfflineMode === 'function') {
        setIsOffline(auth.isOfflineMode());
      }
    }, 2000);

    return () => clearInterval(checkInterval);
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-banner" role="alert" aria-live="assertive">
      <span className="offline-icon" aria-hidden="true">
        &#9888;
      </span>
      <span>
        <strong>Offline Mode</strong> — Changes are saved locally and will not sync to the server.
      </span>
    </div>
  );
}
