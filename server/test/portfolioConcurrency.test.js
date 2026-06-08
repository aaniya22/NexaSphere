import assert from 'node:assert/strict';
import test from 'node:test';

import { portfolioRepository } from '../repositories/portfolioRepository.js';

test('Portfolio Concurrency & Race Condition Prevention', async (t) => {
  // Use a random username to avoid state collision
  const username = `raceuser_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const passkey = 'SecurePasskey123!';

  await t.test('Two simultaneous creation requests - Exactly one should succeed', async () => {
    // Send two requests at the exact same time
    let successCount = 0;
    let conflictCount = 0;

    const [res1, res2] = await Promise.allSettled([
      portfolioRepository.createOrUpdate({ username, passkey }, true),
      portfolioRepository.createOrUpdate({ username, passkey }, true),
    ]);

    for (const res of [res1, res2]) {
      if (res.status === 'fulfilled') {
        successCount++;
      } else if (res.reason && res.reason.code === '23505') {
        conflictCount++;
      }
    }

    assert.equal(successCount, 1, 'Expected exactly one creation to succeed');
    assert.equal(
      conflictCount,
      1,
      'Expected exactly one creation to fail with unique violation 23505'
    );
  });

  await t.test('Ten simultaneous creation requests (Stress test)', async () => {
    const stressUser = `stress_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const promises = Array.from({ length: 10 }).map(() =>
      portfolioRepository.createOrUpdate({ username: stressUser, passkey: 'SuperSecure123!' }, true)
    );

    const responses = await Promise.allSettled(promises);

    let successCount = 0;
    let conflictCount = 0;

    for (const res of responses) {
      if (res.status === 'fulfilled') {
        successCount++;
      } else if (res.reason && res.reason.code === '23505') {
        conflictCount++;
      }
    }

    assert.equal(successCount, 1, 'Exactly one creation request should succeed');
    assert.equal(
      conflictCount,
      9,
      'All other creation requests should fail with unique violation 23505'
    );
  });

  await t.test('Passkey authorization on existing portfolio prevents overwriting', async () => {
    // Try to update an existing one without isNewRegistration but we simulate index.js logic
    // Actually index.js does verifyPasskey first. Let's test that verifyPasskey fails.
    const isAuthorized = await portfolioRepository.verifyPasskey(username, 'WrongPasskey456!', {
      allowNew: false,
    });
    assert.equal(isAuthorized, false, 'Should reject wrong passkey');
  });

  await t.test('Proper transaction completion on valid update', async () => {
    // Try to update with correct passkey (simulating verified by index.js)
    const saved = await portfolioRepository.createOrUpdate(
      { username, passkey, bio: 'Updated bio' },
      false
    );
    assert.equal(saved.bio, 'Updated bio');
  });
});
