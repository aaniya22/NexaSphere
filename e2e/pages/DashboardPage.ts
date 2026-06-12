import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly profileSection: Locator;
  readonly registeredEvents: Locator;
  readonly certificates: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1, h2', { hasText: /Dashboard/i }).first();
    this.profileSection = page.locator('[class*="profile"], [class*="Profile"]').first();
    this.registeredEvents = page.locator('[class*="registered"], [class*="registration"]').first();
    this.certificates = page.locator('[class*="certificate"], [class*="Certificate"]').first();
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async isProfileDataVisible(): Promise<boolean> {
    return this.profileSection.isVisible();
  }

  async getRegisteredEventCount(): Promise<number> {
    if (await this.registeredEvents.isVisible()) {
      const items = this.registeredEvents.locator('li, [class*="item"]');
      return items.count();
    }
    return 0;
  }

  async getCertificateCount(): Promise<number> {
    if (await this.certificates.isVisible()) {
      const items = this.certificates.locator('li, [class*="item"]');
      return items.count();
    }
    return 0;
  }

  async viewCertificate(index = 0) {
    const certLinks = this.page.locator('a', { hasText: /View|Download|Certificate/i });
    if ((await certLinks.count()) > index) {
      await certLinks.nth(index).click();
    }
  }
}
