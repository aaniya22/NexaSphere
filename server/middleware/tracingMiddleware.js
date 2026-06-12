import crypto from 'crypto';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { appContext } from '../config/appContext.js';

const tracer = trace.getTracer('nexasphere-api');

export function tracingMiddleware(req, res, next) {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();

  req.reqId = reqId;
  res.setHeader('X-Request-ID', reqId);

  const span = tracer.startSpan(`${req.method} ${req.path}`, {
    attributes: {
      'http.method': req.method,
      'http.url': req.originalUrl || req.url,
      'http.route': req.path,
      'nexasphere.request_id': reqId,
    },
  });

  const spanContext = trace.setSpan(context.active(), span);

  context.with(spanContext, () => {
    const store = { reqId };
    const activeSpan = trace.getSpan(context.active());
    if (activeSpan) {
      const sc = activeSpan.spanContext();
      store.traceId = sc.traceId;
    }

    appContext.run(store, () => {
      res.on('finish', () => {
        span.setAttribute('http.status_code', res.statusCode);
        if (res.statusCode >= 500) {
          span.setStatus({ code: SpanStatusCode.ERROR });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }
        span.end();
      });

      next();
    });
  });
}
