import { APIRequestContext } from '@playwright/test';

const API_BASE = process.env.E2E_API_BASE || 'http://localhost:8080';

export class ApiClient {
  constructor(private request: APIRequestContext) {}

  async createTestUser(email: string, password: string, name: string) {
    const res = await this.request.post(`${API_BASE}/api/auth/signup`, {
      data: { email, password, name, collegeEmail: email },
    });
    return res.ok ? res.json() : null;
  }

  async getVerificationToken(email: string): Promise<string | null> {
    const res = await this.request.get(`${API_BASE}/api/admin/test/verification-token`, {
      params: { email },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  }

  async verifyEmail(token: string) {
    const res = await this.request.post(`${API_BASE}/api/auth/verify-email`, {
      data: { token },
    });
    return res.ok;
  }

  async loginAsAdmin(username: string, password: string) {
    const res = await this.request.post(`${API_BASE}/api/admin/login`, {
      data: { username, password },
    });
    if (!res.ok) return null;
    const cookies = res.headers()['set-cookie'];
    return cookies || null;
  }

  async deleteTestUser(email: string) {
    const res = await this.request.delete(`${API_BASE}/api/admin/test/users`, {
      data: { email },
    });
    return res.ok;
  }

  async resetDatabase() {
    const res = await this.request.post(`${API_BASE}/api/admin/test/reset`);
    return res.ok;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.request.get(`${API_BASE}/api/health`);
      return res.ok();
    } catch {
      return false;
    }
  }
}
