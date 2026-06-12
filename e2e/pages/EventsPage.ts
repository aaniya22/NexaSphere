import { Page, Locator } from '@playwright/test';

export class EventsPage {
  readonly page: Page;
  readonly eventCards: Locator;
  readonly sectionHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.eventCards = page.locator('[class*="event-card"], [class*="EventCard"]');
    this.sectionHeading = page.locator('h1, h2, h3, h4', { hasText: /Events/i }).first();
  }

  async goto() {
    await this.page.goto('/events');
  }

  async getEventCount(): Promise<number> {
    return this.eventCards.count();
  }

  async clickEventCard(index = 0) {
    const cards = this.eventCards;
    if ((await cards.count()) > index) {
      await cards.nth(index).click();
    }
  }

  async isEventDetailVisible(): Promise<boolean> {
    return this.page.locator('[class*="event-detail"], [class*="EventDetail"]').first().isVisible();
  }

  async clickRegister() {
    const btn = this.page.locator('button, a', { hasText: /Register|RSVP|Book/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
    }
  }

  async getConfirmationText(): Promise<string | null> {
    const el = this.page.locator('text=confirmed|registered|thank you|success').first();
    if (await el.isVisible()) {
      return el.textContent();
    }
    return null;
  }
}
