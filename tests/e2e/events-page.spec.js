// tests/e2e/events-page.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Events Page', () => {
  test('events page loads and displays event listings', async ({ page }) => {
    await page.goto('/events.html');
    await expect(page).toHaveTitle(/Events/);

    // Event cards render into the grid after events load from the API (async)
    const eventCards = page.locator('#eventsGrid .event-card');
    await expect(eventCards.first()).toBeVisible({ timeout: 15000 });
  });

  test('event interest form exists', async ({ page }) => {
    await page.goto('/events.html');

    // The event interest form is the "Tell Me More" modal (static, in the DOM)
    const tellMeMore = page.locator('#tellMeMoreForm');
    await expect(tellMeMore).toBeAttached({ timeout: 10000 });
    // Contains email input and a submit button
    await expect(tellMeMore.locator('input[name="email"]')).toBeAttached();
    await expect(tellMeMore.locator('button[type="submit"]')).toBeAttached();
  });
});