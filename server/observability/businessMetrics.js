/**
 * Periodic business and infrastructure metric collectors.
 */

import { getConnectedUsersCount } from '../config/socket.js';
import { getMetrics as getLegacyMetrics } from '../middleware/performanceMonitor.js';
import { sendErrorRateAlert } from '../utils/slack.js';
import { activeUsersOnline, updatePoolMetrics } from './metrics.js';

const COLLECT_INTERVAL_MS = 15_000;
const ALERT_INTERVAL_MS = 60_000;

let collectTimer = null;
let alertTimer = null;

function isPerformanceMonitoringEnabled() {
  return process.env.ENABLE_PERFORMANCE_MONITORING !== 'false';
}

function collectBusinessMetrics() {
  if (!isPerformanceMonitoringEnabled()) return;

  try {
    activeUsersOnline.set(getConnectedUsersCount());
    updatePoolMetrics();
  } catch {
    // Socket.IO may not be initialized in all environments
  }
}

function checkErrorRateAndAlert() {
  if (!isPerformanceMonitoringEnabled()) return;

  const threshold = parseFloat(process.env.ERROR_RATE_THRESHOLD || '1');
  const legacy = getLegacyMetrics();
  let totalRequests = 0;
  let totalErrors = 0;

  Object.values(legacy.endpoints || {}).forEach((windows) => {
    const fiveMin = windows['5min'] || {};
    totalRequests += fiveMin.count || 0;
    totalErrors += fiveMin.errorCount || 0;
  });

  if (totalRequests === 0) return;

  const errorRate = (totalErrors / totalRequests) * 100;
  if (errorRate > threshold) {
    sendErrorRateAlert(errorRate, threshold);
  }
}

export function startBusinessMetricsCollectors() {
  if (collectTimer) return;

  collectTimer = setInterval(collectBusinessMetrics, COLLECT_INTERVAL_MS);
  collectTimer.unref?.();

  alertTimer = setInterval(checkErrorRateAndAlert, ALERT_INTERVAL_MS);
  alertTimer.unref?.();

  collectBusinessMetrics();
}

export function stopBusinessMetricsCollectors() {
  if (collectTimer) {
    clearInterval(collectTimer);
    collectTimer = null;
  }
  if (alertTimer) {
    clearInterval(alertTimer);
    alertTimer = null;
  }
}
