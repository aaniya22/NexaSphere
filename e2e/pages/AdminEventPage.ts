import { Page, Locator } from '@playwright/test';

export class AdminEventPage {
  readonly page: Page;
  readonly createEventButton: Locator;
  readonly eventNameInput: Locator;
  readonly eventDateInput: Locator;
  readonly eventDescInput: Locator;
  readonly eventLocationInput: Locator;
  readonly eventCapacityInput: Locator;
  readonly publishToggle: Locator;
  readonly saveButton: Locator;
  readonly eventList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createEventButton = page
      .locator('button, a', { hasText: /Create Event|New Event/i })
      .first();
    this.eventNameInput = page
      .locator('input[name="name"], input[placeholder*="event name" i]')
      .first();
    this.eventDateInput = page.locator('input[type="date"], input[name="date"]').first();
    this.eventDescInput = page.locator('textarea[name="description"]').first();
    this.eventLocationInput = page.locator('input[name="location"]').first();
    this.eventCapacityInput = page.locator('input[type="number"], input[name="capacity"]').first();
    this.publishToggle = page.locator('input[type="checkbox"], [role="switch"]').first();
    this.saveButton = page
      .locator('button[type="submit"], button', { hasText: /Save|Create|Publish/i })
      .first();
    this.eventList = page.locator('[class*="event-list"], [class*="EventList"]').first();
  }

  async goto() {
    await this.page.goto('/dashboard/events');
  }

  async clickCreateEvent() {
    await this.createEventButton.click();
  }

  async fillEventDetails(details: {
    name: string;
    date: string;
    description: string;
    location: string;
    capacity: number;
  }) {
    await this.eventNameInput.fill(details.name);
    if (await this.eventDateInput.isVisible()) {
      await this.eventDateInput.fill(details.date);
    }
    if (await this.eventDescInput.isVisible()) {
      await this.eventDescInput.fill(details.description);
    }
    if (await this.eventLocationInput.isVisible()) {
      await this.eventLocationInput.fill(details.location);
    }
    if (await this.eventCapacityInput.isVisible()) {
      await this.eventCapacityInput.fill(String(details.capacity));
    }
  }

  async publish() {
    if (await this.publishToggle.isVisible()) {
      await this.publishToggle.check();
    }
    await this.saveButton.click();
  }

  async eventExists(name: string): Promise<boolean> {
    return this.page.locator(`text=${name}`).first().isVisible();
  }
}
