import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('public content storage bridge receiver', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_ADMIN_DASHBOARD_URL', 'https://admin.nexasphere.example');
    document.documentElement.innerHTML = '<head></head><body></body>';
    localStorage.clear();
  });

  test('accepts only allowed content keys from the configured admin bridge iframe', async () => {
    const { initStorageSyncBridge } = await import('../utils/publicContentStore.js');

    initStorageSyncBridge();

    const bridge = document.querySelector('iframe[title="NexaSphere Sync Bridge"]');
    const bridgeWindow = bridge.contentWindow;

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.example',
        source: bridgeWindow,
        data: {
          type: 'ns-content-updated',
          key: 'ns_db_events',
          value: '[{"id":"evil-origin"}]',
        },
      })
    );
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://admin.nexasphere.example',
        source: window,
        data: {
          type: 'ns-content-updated',
          key: 'ns_db_events',
          value: '[{"id":"wrong-source"}]',
        },
      })
    );
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://admin.nexasphere.example',
        source: bridgeWindow,
        data: {
          type: 'ns-content-updated',
          key: 'ns_admin_token',
          value: 'secret-admin-token',
        },
      })
    );

    expect(localStorage.getItem('ns_db_events')).toBeNull();
    expect(localStorage.getItem('ns_admin_token')).toBeNull();

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://admin.nexasphere.example',
        source: bridgeWindow,
        data: {
          type: 'ns-content-updated',
          key: 'ns_db_events',
          value: '[{"id":"event-1"}]',
        },
      })
    );

    expect(localStorage.getItem('ns_db_events')).toBe('[{"id":"event-1"}]');
  });
});
