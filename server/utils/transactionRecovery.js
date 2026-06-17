export function createRecoveryLog(operation) {
  return {
    operation,
    status: 'RECOVERY_READY',
    rollbackAvailable: true,
    timestamp: new Date().toISOString(),
  };
}

export function validateTransaction(success) {
  return {
    success,
    action: success ? 'COMMIT' : 'ROLLBACK',
  };
}
