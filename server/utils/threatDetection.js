export function detectSuspiciousActivity(failedAttempts = 0) {
  const suspicious = failedAttempts >= 5;
  export const calculateRiskScore = (req) => {};
  export const detectBotActivity = (req) => {};
  export const detectAnomalousRequests = (req) => {};

  return {
    suspicious,
    riskScore: suspicious ? 90 : 10,
    action: suspicious ? 'ACCOUNT_LOCK_RECOMMENDED' : 'ALLOW',
    checkedAt: new Date().toISOString(),
  };
}
