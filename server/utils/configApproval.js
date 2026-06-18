/**
 * Configuration Approval Workflow Utility
 */

export const validateConfigChange = (change) => {
  const criticalConfigs = ['DATABASE_URL', 'JWT_SECRET', 'SMTP_PASSWORD', 'ADMIN_ROLE', 'API_KEY'];

  const isCritical = criticalConfigs.includes(change.key);

  return {
    key: change.key,
    approved: false,
    requiresApproval: isCritical,
    riskLevel: isCritical ? 'HIGH' : 'LOW',
    timestamp: new Date().toISOString(),
  };
};

export const createChangeHistory = (change) => {
  return {
    key: change.key,
    oldValue: change.oldValue,
    newValue: change.newValue,
    status: 'PENDING_APPROVAL',
    createdAt: new Date().toISOString(),
  };
};

export const rollbackConfig = (change) => {
  return {
    key: change.key,
    rollbackValue: change.oldValue,
    action: 'ROLLBACK_READY',
    timestamp: new Date().toISOString(),
  };
};
