/**
 * Resolves correlation fields for structured log entries.
 */

import { appContext } from '../config/appContext.js';

let getActiveTraceIdFn = () => null;

export function setTraceIdResolver(fn) {
  getActiveTraceIdFn = fn;
}

export function getLogContext(extra = {}) {
  const store = appContext.getStore() || {};
  const traceId = getActiveTraceIdFn() || store.traceId || null;

  return {
    service: process.env.OTEL_SERVICE_NAME || 'nexasphere-api',
    reqId: store.reqId || null,
    traceId,
    ...extra,
  };
}
