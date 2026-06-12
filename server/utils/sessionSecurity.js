export function getSessionSecurityData() {
  return {
    activeSessions: [
      {
        device: 'Current Browser',
        ip: '127.0.0.1',
        status: 'active',
        lastSeen: new Date().toISOString(),
      },
    ],

    loginHistory: [
      {
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        status: 'success',
      },
    ],

    devices: [
      {
        name: 'Current Device',
        trusted: true,
      },
    ],

    suspiciousLogins: [],

    securityAlerts: [],

    summary: {
      activeSessionCount: 1,
      trustedDevices: 1,
      suspiciousAttempts: 0,
    },
  };
}