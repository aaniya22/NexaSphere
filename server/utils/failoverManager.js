export function getServiceHealth() {
  return {
    status: 'healthy',
    checkedAt: new Date().toISOString(),
    services: [
      { name: 'auth', status: 'online' },
      { name: 'database', status: 'online' },
      { name: 'notifications', status: 'online' },
    ],
  };
}

export function getFailoverStatus() {
  return {
    activeNode: 'primary',
    backupNode: 'standby',
    failoverEnabled: true,
    lastChecked: new Date().toISOString(),
  };
}