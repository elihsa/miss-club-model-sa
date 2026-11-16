// tests/e2e/homepage.spec.js
const { test, expect } = require('@playwright/test');

/**
 * Verify homepage loads and essential elements exist.
 */
test('homepage loads with hero and events preview', async ({ page }) => {
  await page.goto('/');
  // Hero title contains "Miss Club Model"
  const hero = await page.locator('header h1');
  await expect(hero).toBeVisible();
  await expect(hero).toContainText('Miss Club Model', { timeout: 5000 });

  // Events preview section should have at least one event card
  const eventCards = page.locator('.event-card');
  await expect(eventCards.first()).toBeVisible({ timeout: 5000 });

  // Footer build info present
  const footer = page.locator('#buildInfo');
  await expect(footer).toBeVisible();
});
