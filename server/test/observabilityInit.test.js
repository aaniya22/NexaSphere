import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { initObservability } from '../observability/index.js';

test('initObservability registers /metrics without throwing', () => {
  process.env.OTEL_ENABLED = 'false';
  process.env.METRICS_ENABLED = 'true';

  const app = express();
  const result = initObservability(app);

  assert.equal(result, app);
  assert.equal(typeof app.get, 'function');
});

test('initObservability can be called once per app', () => {
  process.env.OTEL_ENABLED = 'false';
  const app = express();
  initObservability(app);
  assert.doesNotThrow(() => initObservability(app));
});
