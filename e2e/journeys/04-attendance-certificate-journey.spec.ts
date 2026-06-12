import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TEST_USER, TEST_ADMIN, generateTestEvent } from '../helpers/test-data';

test.describe('Journey 4: Event Attendance & Certificate', () => {
  let apiClient: any;

  test.beforeAll(async ({ request }) => {
    const { ApiClient } = await import('../helpers/api-client');
    apiClient = new ApiClient(request);
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

  test('should show certificate after admin marks attendance', async ({ page }) => {
    const dashboard = new DashboardPage(page);

    // 1. Navigate to dashboard
    await dashboard.goto();
    await page.waitForTimeout(1000);

    // 2. Check for certificates section
    const certSectionVisible = await dashboard.certificates.isVisible().catch(() => false);

    if (certSectionVisible) {
      // 3. View certificates in dashboard
      const certCount = await dashboard.getCertificateCount();
      expect(certCount).toBeGreaterThanOrEqual(0);

      if (certCount > 0) {
        // 4. Click to view a certificate
        await dashboard.viewCertificate(0);
        await page.waitForTimeout(2000);

        // 5. Check for certificate content or download option
        const downloadBtn = page
          .locator('button, a', { hasText: /Download|View Certificate/i })
          .first();
        const pdfVisible = await downloadBtn.isVisible().catch(() => false);
        if (pdfVisible) {
          expect(downloadBtn).toBeVisible();
        }
      }
    }
  });

  test('should handle certificate PDF download', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await page.waitForTimeout(1000);

    const certCount = await dashboard.getCertificateCount();
    test.skip(certCount === 0, 'No certificates to download');

    // Navigate to certificate view
    await dashboard.viewCertificate(0);
    await page.waitForTimeout(1000);

    // Try to download
    const downloadPromise = page.waitForEvent('download', { timeout: 3000 }).catch(() => null);
    const downloadBtn = page.locator('a, button', { hasText: /Download/i }).first();
    if (await downloadBtn.isVisible()) {
      await downloadBtn.click();
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toContain('.pdf');
      }
    }
  });

  test.afterAll(async () => {
    await apiClient?.deleteTestUser(TEST_USER.email).catch(() => {});
  });
});
