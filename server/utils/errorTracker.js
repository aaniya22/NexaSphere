export function trackError(error) {
  return {
    message: error?.message || 'Unknown error',
    stack: error?.stack || '',
    severity: 'high',
    timestamp: new Date().toISOString(),
  };
}
