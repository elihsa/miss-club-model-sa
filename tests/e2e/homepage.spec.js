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

  // Events preview section: either event cards OR "no events" message
  const eventsGrid = page.locator('#eventsGrid');
  await expect(eventsGrid).toBeVisible({ timeout: 10000 });
  // Wait for async content to settle (event cards or no-events message)
  await page.waitForFunction(
    () => document.querySelectorAll('#eventsGrid .event-card, #eventsGrid > p').length > 0,
    { timeout: 15000 }
  );
  // At least one child exists in the grid
  const gridChildren = eventsGrid.locator('> *');
  await expect(gridChildren.first()).toBeVisible();

  // Footer build info present
  const footer = page.locator('#buildInfo');
  await expect(footer).toBeVisible({ timeout: 10000 });
});