import assert from 'node:assert/strict';
import test from 'node:test';
import { validationMiddleware } from '../sockets/validationMiddleware.js';

test('Socket.IO Payload Validation Middleware', async (t) => {
  const runMiddleware = (packet) => {
    return new Promise((resolve, reject) => {
      validationMiddleware(packet, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  };

  await t.test('Accepts valid payload', async () => {
    await runMiddleware(['user:identify', { userId: '123', email: 'test@example.com' }]);
  });

  await t.test('Rejects empty packet', async () => {
    await assert.rejects(runMiddleware([]), /Invalid packet format/);
  });

  await t.test('Rejects excessively large payload', async () => {
    const largeString = 'A'.repeat(50001);
    await assert.rejects(runMiddleware(['room:join', largeString]), /Payload too large/);
  });

  await t.test('Rejects deeply nested object', async () => {
    let deepObject = {};
    let current = deepObject;
    for (let i = 0; i < 15; i++) {
      current.nested = {};
      current = current.nested;
    }
    await assert.rejects(
      runMiddleware(['workspace_update', deepObject]),
      /Payload too deeply nested/
    );
  });

  await t.test('Rejects deeply nested array', async () => {
    let deepArray = [];
    let current = deepArray;
    for (let i = 0; i < 15; i++) {
      const nextArr = [];
      current.push(nextArr);
      current = nextArr;
    }
    await assert.rejects(
      runMiddleware(['document_change', deepArray]),
      /Payload too deeply nested/
    );
  });

  await t.test('Rejects invalid type based on Zod schema', async () => {
    await assert.rejects(
      runMiddleware(['user:identify', { userId: 123, email: 'not-an-email' }]),
      /Validation error/
    );
  });

  await t.test('Rejects invalid join_room format', async () => {
    await assert.rejects(runMiddleware(['join_room', { notString: true }]), /Validation error/);
  });

  await t.test('Accepts valid join_room payload', async () => {
    await runMiddleware(['join_room', 'room-123', { name: 'Alice' }]);
  });

  await t.test('Rejects malicious deeply nested JSON string', async () => {
    let str = '';
    for (let i = 0; i < 20; i++) str += '{"a":';
    str += '"1"';
    for (let i = 0; i < 20; i++) str += '}';

    // We send it as an argument. The string representation inside stringify will escape quotes,
    // but the payload stringifier could be tricked if we send objects. Wait, sending a string
    // with many braces doesn't crash the parser, but let's make sure it's handled safely.
    // Actually the middleware parses arguments natively, we stringify to check depth.
    await assert.rejects(runMiddleware(['unknown', str]), /Payload too deeply nested/);
  });

  await t.test('Ignores unknown events (passthrough with size limits)', async () => {
    await runMiddleware(['unknown_event', { payload: 'anything' }]);
  });
});
