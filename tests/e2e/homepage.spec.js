// tests/e2e/homepage.spec.js
const { test, expect } = require('@playwright/test');

/**
 * Verify homepage loads and essential elements exist.
 */
test('homepage loads with hero and events preview', async ({ page }) => {
  await page.goto('/');
  // Hero section contains the brand
  const hero = page.locator('section.hero');
  await expect(hero).toBeVisible({ timeout: 10000 });
  await expect(hero.locator('img.logo')).toHaveAttribute('alt', /Miss Club Model/);

  // Events preview section should have at least one event card (renders async)
  const eventCards = page.locator('#eventsGrid .event-card');
  await expect(eventCards.first()).toBeVisible({ timeout: 15000 });

  // Footer build info present
  const footer = page.locator('#buildInfo');
  await expect(footer).toBeVisible({ timeout: 10000 });
});