import crypto from 'crypto';
import { appContext } from '../config/appContext.js';

export function tracingMiddleware(req, res, next) {
  // Use existing header if provided (useful for tracing across services)
  // Otherwise, generate a new UUID for this request
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();

  // Expose on the request and response objects for immediate access if needed
  req.reqId = reqId;
  res.setHeader('X-Request-ID', reqId);

  // Wrap the remainder of the request execution within this context
  appContext.run({ reqId }, () => {
    next();
  });
}
