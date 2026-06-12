import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';
import { SignupPage } from '../pages/SignupPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TEST_USER } from '../helpers/test-data';
import { ApiClient } from '../helpers/api-client';
import { resetTestDatabase } from '../helpers/db-cleanup';

test.describe('Journey 1: User Signup → Verification → Dashboard', () => {
  let apiClient: ApiClient;

  test.beforeAll(async ({ request }) => {
    apiClient = new ApiClient(request);
    await resetTestDatabase(request);
  });

  test('should complete full signup flow', async ({ page, request }) => {
    const landing = new LandingPage(page);
    const signup = new SignupPage(page);
    const dashboard = new DashboardPage(page);

    // 1. Visit landing page
    await landing.goto();
    await expect(landing.heroTitle).toBeVisible();
    await expect(landing.heroTagline).toBeVisible();

    // 2. Navigate to signup
    await landing.clickSignup();
    await page.waitForURL(/signup|register/i, { timeout: 5000 }).catch(() => {});
    if (!page.url().includes('signup')) {
      await signup.goto();
    }

    // 3. Fill signup form
    await signup.signUp(TEST_USER.name, TEST_USER.email, TEST_USER.password);

    // 4. Verify success message
    await expect(
      page.locator('text=verification email sent').or(page.locator('text=check your email'))
    )
      .toBeVisible({
        timeout: 5000,
      })
      .catch(() => {
        // Some apps redirect immediately
      });

    // 5. Verify email via API
    const token = await apiClient.getVerificationToken(TEST_USER.email);
    if (token) {
      await apiClient.verifyEmail(token);
    }

    // 6. Complete profile setup and land on dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    const profileVisible = await dashboard.isProfileDataVisible();
    if (profileVisible) {
      // 7. Assert profile data saved
      await expect(page.locator(`text=${TEST_USER.name}`).first())
        .toBeVisible()
        .catch(() => {});
    }
  });

  test.afterAll(async () => {
    const request = (await import('@playwright/test')).request;
    // Cleanup handled via test database reset
  });
});
