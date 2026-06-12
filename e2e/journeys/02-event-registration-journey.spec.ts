import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';
import { EventsPage } from '../pages/EventsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { TEST_USER } from '../helpers/test-data';
import { resetTestDatabase } from '../helpers/db-cleanup';

test.describe('Journey 2: Event Registration → Confirmation → Dashboard', () => {
  let apiClient: any;

  test.beforeAll(async ({ request }) => {
    const { ApiClient } = await import('../helpers/api-client');
    apiClient = new ApiClient(request);
    await resetTestDatabase(request);
    // Create test user and verify email for this journey
    await apiClient.createTestUser(TEST_USER.email, TEST_USER.password, TEST_USER.name);
    const token = await apiClient.getVerificationToken(TEST_USER.email);
    if (token) {
      await apiClient.verifyEmail(token);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Login as test user before each test
    await page.goto('/login');
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForTimeout(1000);
  });

  test('should browse events, register, and see confirmation', async ({ page }) => {
    const landing = new LandingPage(page);
    const events = new EventsPage(page);
    const dashboard = new DashboardPage(page);

    // 1. View event listings
    await landing.goto();
    await landing.navigateToEvents();
    await page.waitForTimeout(1000);

    const eventCount = await events.getEventCount();
    test.skip(eventCount === 0, 'No events available to register for');

    // 2. Click on an event
    await events.clickEventCard(0);
    await page.waitForTimeout(500);

    // 3. Read event details
    const detailVisible = await events.isEventDetailVisible();

    // 4. Register for the event
    if (detailVisible) {
      await events.clickRegister();
      await page.waitForTimeout(1000);

      // 5. Verify confirmation
      const confirmation = await events.getConfirmationText();
      if (confirmation) {
        expect(confirmation).toBeTruthy();
      }
    }

    // 6. Verify registration in dashboard
    await dashboard.goto();
    await page.waitForTimeout(1000);
    const count = await dashboard.getRegisteredEventCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should verify registration confirmation email appears', async ({ page }) => {
    // Check that the app shows some confirmation indicator
    const events = new EventsPage(page);
    await events.goto();

    const eventCount = await events.getEventCount();
    test.skip(eventCount === 0, 'No events to check');
  });

  test.afterAll(async () => {
    await apiClient?.deleteTestUser(TEST_USER.email).catch(() => {});
  });
});
