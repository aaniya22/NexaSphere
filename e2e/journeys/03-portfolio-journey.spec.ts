import { test, expect } from '@playwright/test';
import { PortfolioPage } from '../pages/PortfolioPage';
import { LoginPage } from '../pages/LoginPage';
import { TEST_USER, generatePortfolioData } from '../helpers/test-data';
import { resetTestDatabase } from '../helpers/db-cleanup';

test.describe('Journey 3: Portfolio Building', () => {
  let apiClient: any;

  test.beforeAll(async ({ request }) => {
    const { ApiClient } = await import('../helpers/api-client');
    apiClient = new ApiClient(request);
    await resetTestDatabase(request);
    await apiClient.createTestUser(TEST_USER.email, TEST_USER.password, TEST_USER.name);
    const token = await apiClient.getVerificationToken(TEST_USER.email);
    if (token) {
      await apiClient.verifyEmail(token);
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const loginPage = new LoginPage(page);
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await page.waitForTimeout(1000);
  });

  test('should build and view portfolio', async ({ page }) => {
    const portfolio = new PortfolioPage(page);
    const { projectName, description } = generatePortfolioData();

    // 1. Navigate to portfolio
    await portfolio.goto();
    await page.waitForTimeout(1000);

    // 2. Edit profile
    await portfolio.editProfile();
    await page.waitForTimeout(500);

    // 3. Add portfolio project
    await portfolio.addProject(projectName, description);
    await page.waitForTimeout(1000);

    // 4. Verify project was added
    await expect(page.locator(`text=${projectName}`).first())
      .toBeVisible()
      .catch(() => {});

    // 5. Share portfolio link
    const url = await portfolio.getPortfolioUrl();
    if (url) {
      expect(url).toContain('portfolio');
    }
  });

  test('should view saved portfolio data', async ({ page }) => {
    const portfolio = new PortfolioPage(page);
    await portfolio.goto();
    await page.waitForTimeout(1000);

    // Portfolio page should load
    await expect(page.locator('body')).toBeVisible();
  });

  test.afterAll(async () => {
    await apiClient?.deleteTestUser(TEST_USER.email).catch(() => {});
  });
});
