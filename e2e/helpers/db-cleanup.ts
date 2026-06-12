import { APIRequestContext } from '@playwright/test';

export async function resetTestDatabase(request: APIRequestContext) {
  const apiBase = process.env.E2E_API_BASE || 'http://localhost:8080';
  try {
    await request.post(`${apiBase}/api/admin/test/reset`);
  } catch {
    // If cleanup endpoint is unavailable, tests proceed with isolation assumptions
  }
}

export async function ensureServerReady(
  request: APIRequestContext,
  maxRetries = 10,
  intervalMs = 1000
): Promise<boolean> {
  const apiBase = process.env.E2E_API_BASE || 'http://localhost:8080';
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await request.get(`${apiBase}/api/health`);
      if (res.ok()) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}
