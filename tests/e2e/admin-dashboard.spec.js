const { test, expect } = require('@playwright/test');

// Helper to log in as admin (using service key headers)
async function loginAsAdmin(page, token) {
  await page.goto('/admin.html');
  // Simulate login via API to set auth token in session/localStorage
  const res = await page.request.post('/api/admin', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    data: { action: 'getEventFilter' }
  });
  const ok = res.ok();
  if (!ok) {
    throw new Error('Admin login failed');
  }
}

test.describe('Admin Dashboard CRUD', () => {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_TEST_KEY';

  test('Admin can view application table', async ({ page }) => {
    await loginAsAdmin(page, serviceKey);
    await expect(page.locator('#applications-table tbody tr')).toBeVisible();
  });

  test('Admin can delete an application via UI', async ({ page }) => {
    await loginAsAdmin(page, serviceKey);
    const deleteBtn = page.locator('#applications-table tbody tr .btn-delete').first();
    if (await deleteBtn.count() === 0) {
      throw new Error('No delete button found');
    }
    await deleteBtn.click();
    await page.click('#confirm-delete');
    await expect(page.locator('#applications-table tbody tr')).not.toContainText('Remove Me');
  });

  test('Admin can change event status', async ({ page }) => {
    await loginAsAdmin(page, serviceKey);
    await page.click('a[href="#eventsTab"]');
    const statusSelect = page.locator('#events-table tbody tr .status-select').first();
    await statusSelect.selectOption('launched');
    await expect(statusSelect).toHaveValue('launched');
  });
});
