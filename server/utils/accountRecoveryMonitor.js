export function detectSuspiciousRecovery(attempts) {
  return attempts >= 5;
}

export function createRecoveryLog(email) {
  return {
    email,
    timestamp: new Date(),
  };
}
