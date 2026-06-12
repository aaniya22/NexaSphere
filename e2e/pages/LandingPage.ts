import { Page, Locator } from '@playwright/test';

export class LandingPage {
  readonly page: Page;
  readonly heroTitle: Locator;
  readonly heroTagline: Locator;
  readonly signupButton: Locator;
  readonly eventsNavLink: Locator;
  readonly teamNavLink: Locator;
  readonly applyButton: Locator;
  readonly footerEmail: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroTitle = page.locator('.hero-title-text').first();
    this.heroTagline = page.locator('.hero-tagline').first();
    this.signupButton = page.locator('button, a', { hasText: /Sign Up|Get Started/i }).first();
    this.eventsNavLink = page.locator('button, a', { hasText: /Events/i }).first();
    this.teamNavLink = page.locator('button, a', { hasText: /Team|Core Team/i }).first();
    this.applyButton = page.locator('button, a', { hasText: /Apply|Join/i }).first();
    this.footerEmail = page.locator('.ns-footer-email-link').first();
  }

  async goto() {
    await this.page.goto('/');
  }

  async isHeroVisible(): Promise<boolean> {
    return this.heroTitle.isVisible();
  }

  async clickSignup() {
    await this.signupButton.click();
  }

  async navigateToEvents() {
    await this.eventsNavLink.click();
  }

  async navigateToTeam() {
    await this.teamNavLink.click();
  }

  async scrollToFooter() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }
}
