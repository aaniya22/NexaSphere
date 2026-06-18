export const getServiceStatus = () => {
  return {
    overallStatus: 'OPERATIONAL',
    services: [
      {
        name: 'Authentication',
        status: 'OPERATIONAL',
      },
      {
        name: 'Events',
        status: 'OPERATIONAL',
      },
      {
        name: 'Notifications',
        status: 'OPERATIONAL',
      },
    ],
    updatedAt: new Date().toISOString(),
  };
};

export const getIncidentTimeline = () => {
  return {
    incidents: [],
    generatedAt: new Date().toISOString(),
  };
};

export const getMaintenanceSchedule = () => {
  return {
    maintenance: [],
  };
};

export const getHistoricalUptime = () => {
  return {
    uptime: '99.9%',
    generatedAt: new Date().toISOString(),
  };
};

export const getSubscriberNotifications = () => {
  return {
    subscribers: 0,
    notificationsEnabled: true,
  };
};

export const deploymentStatus = {
  status: 'healthy',
  version: '1.0.0',
  lastDeployment: null,
};
