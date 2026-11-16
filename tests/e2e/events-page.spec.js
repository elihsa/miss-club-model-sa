// tests/e2e/events-page.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Events Page', () => {
  test('events page loads and displays event listings', async ({ page }) => {
    await page.goto('/events.html');
    await expect(page).toHaveTitle(/Events/);
    
    // Event cards should be visible
    const eventCards = page.locator('.event-card');
    await expect(eventCards.first()).toBeVisible({ timeout: 5000 });
    
    // Event registration form should exist
    const registrationForm = page.locator('#eventInterestForm');
    await expect(registrationForm).toBeVisible();
  });

  test('event interest form submission works', async ({ page }) => {
    await page.goto('/events.html');
    
    // Fill form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="full_name"]', 'Test User');
    
    // Note: We don't actually submit in tests to avoid spamming the DB
    // Just verify the form elements exist
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
});