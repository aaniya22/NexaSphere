import { useState, useEffect } from 'react';
import { auth } from '../services/auth';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(auth.isOfflineMode());

    const checkInterval = setInterval(() => {
      setIsOffline(auth.isOfflineMode());
    }, 2000);

    return () => clearInterval(checkInterval);
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-banner">
      <span className="offline-icon">&#9888;</span>
      <span>
        <strong>Offline Mode</strong> — Changes are saved locally and will not sync to the server.
      </span>
    </div>
  );
}
