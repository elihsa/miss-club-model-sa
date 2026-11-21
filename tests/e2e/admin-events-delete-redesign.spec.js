// REGRESSION TEST (appcheck): Events tab delete button + sub-tab redesign.
// Root cause found: admin.html is loaded as type="module", so inline onclick="deleteEvent(...)"
// threw "deleteEvent is not defined" because it was never exported to window. This test FAILS
// whenever the delete button is a dead button or the events sub-tabs are missing.
const { test, expect } = require('@playwright/test');

const ADMIN_URL = 'https://missclubmodel.vercel.app/admin';
const ADMIN_EMAIL = 'test-admin@missclubmodel.test';
const ADMIN_PASS = 'TestAdmin123!';

async function login(page) {
  await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
  await page.fill('#loginEmail', ADMIN_EMAIL);
  await page.fill('#loginPassword', ADMIN_PASS);
  await page.click('.login-btn');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

test('deleteEvent is exposed on window (dead-button guard)', async ({ page }) => {
  await login(page);
  const hasFn = await page.evaluate(() => typeof window.deleteEvent === 'function');
  expect(hasFn).toBe(true);
});

test('Events tab renders a Delete button for non-launched events', async ({ page }) => {
  await login(page);
  await page.click('[data-table="events"]');
  await page.waitForSelector('tbody tr', { state: 'attached', timeout: 8000 });
  await page.waitForTimeout(1500);

  const deleteBtns = page.locator('button.action-btn.btn-delete:not([disabled])');
  const count = await deleteBtns.count();
  expect(count).toBeGreaterThan(0);
});

test('Create Event button is visible on the Events tab', async ({ page }) => {
  await login(page);
  await page.click('[data-table="events"]');
  await page.waitForSelector('#createEventBtn', { state: 'attached', timeout: 8000 });
  const display = await page.locator('#createEventBtn').evaluate(el => getComputedStyle(el).display);
  expect(display).not.toBe('none');
});

test('Event Interest List is a sub-tab under Events, not a main menu tab', async ({ page }) => {
  await login(page);
  // 1. Not a main menu tab
  const mainTabLabels = await page.locator('#tabs .tab-btn').allTextContents();
  const hasMainInterestTab = mainTabLabels.some(t => t.includes('Event Interest List'));
  expect(hasMainInterestTab).toBe(false);

  // 2. Sub-tab group appears when Events is active
  await page.click('[data-table="events"]');
  await page.waitForTimeout(1500);
  await expect(page.locator('#eventSubTabs')).toBeVisible({ timeout: 8000 });

  // 3. Clicking the Event Interest List sub-tab loads that table
  await page.click('.sub-tab-btn[data-event-view="event_interest_subscriptions"]');
  await page.waitForTimeout(2000);
  const activeLabel = (await page.locator('.sub-tab-btn.active').textContent()).trim();
  expect(activeLabel).toContain('Event Interest List');
  // and the main Events tab is NOT marked active anymore
  const eventsTabActive = await page.locator('[data-table="events"].tab-btn.active').count();
  expect(eventsTabActive).toBe(0);
});

test('Forgot password link uses a high-contrast colour', async ({ page }) => {
  // Load the login page before login
  await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
  const color = await page.locator('#forgotPasswordLink').evaluate(el => getComputedStyle(el).color);
  const rgb = color.match(/\d+/g).map(Number);
  expect(rgb.length).toBe(3);
  // Gold light rgb(240,216,120) is high contrast on dark bg; reject dark/grey text
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  expect(brightness).toBeGreaterThan(120);
});