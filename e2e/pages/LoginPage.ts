import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /admin login|sign in|login/i }).first();
    this.emailInput = page.getByPlaceholder(/username|email/i);
    this.passwordInput = page.getByPlaceholder(/password/i);
    this.submitButton = page.getByRole('button', { name: /login|submit|sign in/i }).first();
    this.errorMessage = page.locator('text=Invalid').first();
  }

  async goto(path = '/admin') {
    await this.page.goto(path);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }
}
