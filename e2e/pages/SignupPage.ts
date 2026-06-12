import { Page, Locator } from '@playwright/test';

export class SignupPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    this.emailInput = page.locator('input[name="email"], input[type="email"]').first();
    this.passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    this.confirmPasswordInput = page
      .locator('input[name="confirmPassword"], input[placeholder*="confirm" i]')
      .first();
    this.submitButton = page
      .locator('button[type="submit"], button', {
        hasText: /Sign Up|Create Account|Register/i,
      })
      .first();
    this.successMessage = page.locator('text=verification email sent').first();
    this.errorMessage = page.locator('[class*="error"], [class*="alert"]').first();
  }

  async goto() {
    await this.page.goto('/signup');
  }

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(password: string) {
    if (await this.confirmPasswordInput.isVisible()) {
      await this.confirmPasswordInput.fill(password);
    }
  }

  async submit() {
    await this.submitButton.click();
  }

  async signUp(name: string, email: string, password: string) {
    await this.fillName(name);
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(password);
    await this.submit();
  }
}
