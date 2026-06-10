import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, test } from 'vitest';

const BRIDGE_HTML = readFileSync(
  path.resolve(process.cwd(), 'public/sync-bridge.html'),
  'utf8'
);
const BRIDGE_SCRIPT = BRIDGE_HTML.match(/<script>([\s\S]*?)<\/script>/)?.[1];

function createBridgeHarness({
  requestOrigin = 'https://nexasphere-glbajaj.vercel.app',
  storage = {},
} = {}) {
  const listeners = new Map();
  const postedMessages = [];
  const parent = {
    postMessage: (message, targetOrigin) => {
      postedMessages.push({ message, targetOrigin });
    },
  };
  const localStorage = {
    getItem: (key) => (Object.hasOwn(storage, key) ? storage[key] : null),
  };
  const window = {
    location: {
      origin: 'https://admin.nexasphere.example',
    },
    parent,
    addEventListener: (type, handler) => {
      listeners.set(type, handler);
    },
  };

  vm.runInNewContext(BRIDGE_SCRIPT, {
    console,
    localStorage,
    URL,
    window,
  });

  return {
    postedMessages,
    sendMessage(data, origin = requestOrigin, source = parent) {
      listeners.get('message')?.({ data, origin, source });
    },
    sendStorageEvent(key, newValue) {
      listeners.get('storage')?.({ key, newValue });
    },
  };
}

describe('sync bridge security boundary', () => {
  test('does not disclose admin localStorage keys to untrusted origins', () => {
    const bridge = createBridgeHarness({
      requestOrigin: 'https://evil.example',
      storage: {
        ns_admin_token: 'secret-admin-token',
      },
    });

    bridge.sendMessage({ type: 'ns-sync', key: 'ns_admin_token' });

    expect(bridge.postedMessages).toEqual([]);
  });

  test('does not relay disallowed keys even for trusted origins', () => {
    const bridge = createBridgeHarness({
      storage: {
        ns_admin_token: 'secret-admin-token',
      },
    });

    bridge.sendMessage({ type: 'ns-sync', key: 'ns_admin_token' });

    expect(bridge.postedMessages).toEqual([]);
  });

  test('relays allowed content keys to trusted origins with a pinned target origin', () => {
    const bridge = createBridgeHarness({
      storage: {
        ns_db_events: '[{"id":"event-1"}]',
      },
    });

    bridge.sendMessage({ type: 'ns-sync', key: 'ns_db_events' });

    expect(bridge.postedMessages).toEqual([
      {
        targetOrigin: 'https://nexasphere-glbajaj.vercel.app',
        message: {
          type: 'ns-content-updated',
          key: 'ns_db_events',
          value: '[{"id":"event-1"}]',
        },
      },
    ]);
  });

  test('preserves same-origin admin sync requests for allowed content keys', () => {
    const bridge = createBridgeHarness({
      requestOrigin: 'https://admin.nexasphere.example',
      storage: {
        ns_db_announcements: '[{"id":"announcement-1"}]',
      },
    });

    bridge.sendMessage({ type: 'ns-sync', key: 'ns_db_announcements' });

    expect(bridge.postedMessages).toEqual([
      {
        targetOrigin: 'https://admin.nexasphere.example',
        message: {
          type: 'ns-content-updated',
          key: 'ns_db_announcements',
          value: '[{"id":"announcement-1"}]',
        },
      },
    ]);
  });

  test('relays storage updates only after a trusted parent handshake', () => {
    const bridge = createBridgeHarness({
      storage: {
        ns_db_events: '[]',
      },
    });

    bridge.sendStorageEvent('ns_db_events', '[{"id":"before-handshake"}]');
    expect(bridge.postedMessages).toEqual([]);

    bridge.sendMessage({ type: 'ns-sync', key: 'ns_db_events' });
    bridge.postedMessages.length = 0;
    bridge.sendStorageEvent('ns_db_core_team', '[{"id":"member-1"}]');

    expect(bridge.postedMessages).toEqual([
      {
        targetOrigin: 'https://nexasphere-glbajaj.vercel.app',
        message: {
          type: 'ns-content-updated',
          key: 'ns_db_core_team',
          value: '[{"id":"member-1"}]',
        },
      },
    ]);
  });
});
