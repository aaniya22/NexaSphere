import assert from 'node:assert/strict';
import test from 'node:test';
import { appContext } from '../config/appContext.js';
import { setTraceIdResolver } from '../utils/logContext.js';
import { getLogContext } from '../utils/logContext.js';

test('getLogContext includes reqId from appContext', () => {
  setTraceIdResolver(() => 'trace-abc');

  appContext.run({ reqId: 'req-123' }, () => {
    const ctx = getLogContext();
    assert.equal(ctx.reqId, 'req-123');
    assert.equal(ctx.traceId, 'trace-abc');
    assert.ok(ctx.service);
  });
});

test('getLogContext falls back when no store', () => {
  setTraceIdResolver(() => null);
  const ctx = getLogContext();
  assert.equal(ctx.reqId, null);
  assert.equal(ctx.traceId, null);
});
