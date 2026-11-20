// Regression tests: admin role management (owner lock + role promotion dropdown)
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

test('owner account (elihsa@gmail.com) shows lock badge, not role dropdown', async ({ page }) => {
  await login(page);
  await page.click('[data-table="admin_users"]');
  await page.waitForSelector('tbody tr', { state: 'attached', timeout: 8000 });
  await page.waitForTimeout(1200);

  const ownerRow = page.locator('tr:has-text("elihsa@gmail.com")');
  await expect(ownerRow.locator('.role-badge.role-owner')).toHaveCount(1);
  await expect(ownerRow.locator('select.role-select')).toHaveCount(0);
});

test('admin user sees role dropdown for non-owner admin accounts', async ({ page }) => {
  await login(page);
  await page.click('[data-table="admin_users"]');
  await page.waitForSelector('tbody tr', { state: 'attached', timeout: 8000 });
  await page.waitForTimeout(1200);

  const kiyaRow = page.locator('tr:has-text("kiyanoschoonraad98@gmail.com")');
  await expect(kiyaRow.locator('select.role-select')).toHaveCount(1);
});

test('promoting a user to a new role persists via API', async ({ page }) => {
  await login(page);
  await page.click('[data-table="admin_users"]');
  await page.waitForSelector('tbody tr', { state: 'attached', timeout: 8000 });
  await page.waitForTimeout(1200);

  // Change admin@missclubmodelsa.co.za to admin and confirm it persists
  const row = page.locator('tr:has-text("admin@missclubmodelsa.co.za")');
  await row.locator('select.role-select').evaluate(el => {
    el.value = 'admin';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(2500);

  const users = await page.evaluate(async () => {
    const r = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin-session' },
      body: JSON.stringify({ action: 'listUsers' })
    });
    return (await r.json()).users;
  });
  const target = users.find(u => u.email === 'admin@missclubmodelsa.co.za');
  expect(target.role).toBe('admin');
});