import { Page, Locator } from '@playwright/test';

export class PortfolioPage {
  readonly page: Page;
  readonly editProfileButton: Locator;
  readonly addProjectButton: Locator;
  readonly projectNameInput: Locator;
  readonly projectDescInput: Locator;
  readonly saveButton: Locator;
  readonly portfolioLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editProfileButton = page.locator('button, a', { hasText: /Edit Profile/i }).first();
    this.addProjectButton = page
      .locator('button, a', { hasText: /Add Project|New Project/i })
      .first();
    this.projectNameInput = page
      .locator('input[name="projectName"], input[placeholder*="project" i]')
      .first();
    this.projectDescInput = page
      .locator('textarea[name="description"], textarea[placeholder*="describe" i]')
      .first();
    this.saveButton = page
      .locator('button[type="submit"], button', { hasText: /Save|Create|Add/i })
      .first();
    this.portfolioLink = page.locator('[class*="portfolio-link"], [class*="share-link"]').first();
  }

  async goto(username?: string) {
    if (username) {
      await this.page.goto(`/portfolio/${username}`);
    } else {
      await this.page.goto('/portfolio');
    }
  }

  async editProfile() {
    if (await this.editProfileButton.isVisible()) {
      await this.editProfileButton.click();
    }
  }

  async addProject(name: string, description: string) {
    if (await this.addProjectButton.isVisible()) {
      await this.addProjectButton.click();
    }
    await this.projectNameInput.fill(name);
    if (await this.projectDescInput.isVisible()) {
      await this.projectDescInput.fill(description);
    }
    await this.saveButton.click();
  }

  async getPortfolioUrl(): Promise<string | null> {
    if (await this.portfolioLink.isVisible()) {
      return this.portfolioLink.getAttribute('href');
    }
    return null;
  }
}
