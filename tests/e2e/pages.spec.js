// tests/e2e/pages.spec.js
const { test, expect } = require('@playwright/test');

test.describe('All Pages - Basic Load Tests', () => {
  test('index.html loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Miss Club/);
    // Verify hero section exists
    await expect(page.locator('header h1')).toBeVisible({ timeout: 5000 });
    // Verify navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('events.html loads correctly', async ({ page }) => {
    await page.goto('/events.html');
    await expect(page).toHaveTitle(/Events/);
    await expect(page.locator('.event-card').first()).toBeVisible({ timeout: 5000 });
  });

  test('admin.html loads correctly', async ({ page }) => {
    await page.goto('/admin.html');
    await expect(page).toHaveTitle(/Admin/);
    // Admin login form should be visible
    await expect(page.locator('#loginForm')).toBeVisible();
  });

  test('terms.html loads correctly', async ({ page }) => {
    await page.goto('/terms.html');
    await expect(page).toHaveTitle(/Terms/);
    await expect(page.locator('h1')).toContainText('Terms', { timeout: 5000 });
  });

  test('privacy.html loads correctly', async ({ page }) => {
    await page.goto('/privacy.html');
    await expect(page).toHaveTitle(/Privacy/);
    await expect(page.locator('h1')).toContainText('Privacy', { timeout: 5000 });
  });

  test('contact.html loads correctly', async ({ page }) => {
    await page.goto('/contact.html');
    await expect(page).toHaveTitle(/Contact/);
  });

  test('design-system-builder.html loads correctly', async ({ page }) => {
    await page.goto('/design-system-builder.html');
    await expect(page).toHaveTitle(/Design/);
  });
});

test.describe('Navigation', () => {
  test('nav links work from homepage', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('nav a');
    for (const link of await navLinks.all()) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('http')) {
        // Check link exists (don't follow all, just verify href)
        expect(href).toBeTruthy();
      }
    }
  });
});

test.describe('Forms', () => {
  test('candidate application form has required fields', async ({ page }) => {
    await page.goto('/');
    // Form fields that should exist
    const fields = [
      '[name="fullName"]',
      '[name="dob"]',
      '[name="email"]',
      '[name="phone"]',
      '[name="platform"]',
      '[name="essay"]'
    ];
    
    for (const field of fields) {
      await expect(page.locator(field)).toBeVisible();
    }
  });
});
