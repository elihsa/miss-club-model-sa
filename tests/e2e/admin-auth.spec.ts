import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://missclubmodel.vercel.app';

// Admin credentials - set via env vars in CI
// TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD should be configured in Vercel/ CI
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@missclubmodelsa.co.za';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';

test.describe('Admin Authentication Flow', () => {
  test.skip(!ADMIN_PASSWORD, 'TEST_ADMIN_PASSWORD not set - skipping auth test');

  test('Admin login page loads and shows login form', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#loginEmail')).toBeVisible();
    await expect(page.locator('#loginPassword')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Admin can sign in with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });

    await page.fill('#loginEmail', ADMIN_EMAIL);
    await page.fill('#loginPassword', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page.locator('#dashboardView')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#logoutBtn')).toBeVisible();
  });

  test('Admin session persists on page reload', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.fill('#loginEmail', ADMIN_EMAIL);
    await page.fill('#loginPassword', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.locator('#dashboardView')).toBeVisible({ timeout: 15000 });

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Should still be logged in (Supabase auth persists session)
    await expect(page.locator('#dashboardView')).toBeVisible({ timeout: 10000 });
  });

  test('Admin can sign out', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.fill('#loginEmail', ADMIN_EMAIL);
    await page.fill('#loginPassword', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.locator('#dashboardView')).toBeVisible({ timeout: 15000 });

    await page.click('#logoutBtn');
    await expect(page.locator('#loginView')).toBeVisible({ timeout: 5000 });
  });

  test('Invalid credentials show error', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.fill('#loginEmail', ADMIN_EMAIL);
    await page.fill('#loginPassword', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('#loginError')).toBeVisible({ timeout: 5000 });
  });
});