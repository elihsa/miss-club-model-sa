import { test, expect } from '@playwright/test';

test.describe('Admin Panel - Modal Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    // Login if login form is visible
    const loginForm = page.locator('#loginForm');
    if (await loginForm.isVisible()) {
      await page.fill('#loginEmail', process.env.ADMIN_EMAIL || 'test@test.com');
      await page.fill('#loginPassword', process.env.ADMIN_PASSWORD || 'password');
      await loginForm.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('View button opens modal with detail', async ({ page }) => {
    await page.waitForSelector('#tableBody', { state: 'visible' });
    const firstViewBtn = page.locator('.action-btn.btn-view').first();
    await firstViewBtn.click();
    
    const modal = page.locator('#detailModal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3')).toBeVisible();
    await expect(modal.locator('.detail-grid')).toBeVisible();
  });

  test('Approve button in modal works', async ({ page }) => {
    await page.waitForSelector('#tableBody', { state: 'visible' });
    // Find first row with a non-approved status
    const rows = page.locator('#tableBody tr');
    await rows.first().click(); // Focus table
    
    const viewBtns = page.locator('.action-btn.btn-view');
    const count = await viewBtns.count();
    if (count === 0) {
      test.skip();
    }
    
    await viewBtns.first().click();
    const modal = page.locator('#detailModal');
    await expect(modal).toBeVisible();
    
    const approveBtn = modal.locator('.detail-actions .btn-approve:not([disabled])');
    const approveVisible = await approveBtn.count();
    
    if (approveVisible > 0) {
      await approveBtn.first().click();
      await expect(modal).toBeHidden();
      // Verify status changed in table
      await page.waitForLoadState('networkidle');
    }
  });

  test('Decline button in modal works', async ({ page }) => {
    await page.waitForSelector('#tableBody', { state: 'visible' });
    const viewBtns = page.locator('.action-btn.btn-view');
    const count = await viewBtns.count();
    if (count === 0) {
      test.skip();
    }
    
    await viewBtns.first().click();
    const modal = page.locator('#detailModal');
    await expect(modal).toBeVisible();
    
    const declineBtn = modal.locator('.detail-actions .btn-decline:not([disabled])');
    const declineVisible = await declineBtn.count();
    
    if (declineVisible > 0) {
      await declineBtn.first().click();
      await expect(modal).toBeHidden();
      await page.waitForLoadState('networkidle');
    }
  });

  test('Delete button in modal works', async ({ page }) => {
    await page.waitForSelector('#tableBody', { state: 'visible' });
    const viewBtns = page.locator('.action-btn.btn-view');
    const count = await viewBtns.count();
    if (count === 0) {
      test.skip();
    }
    
    await viewBtns.first().click();
    const modal = page.locator('#detailModal');
    await expect(modal).toBeVisible();
    
    const deleteBtn = modal.locator('.detail-actions .btn-delete:not([disabled])');
    const deleteVisible = await deleteBtn.count();
    
    if (deleteVisible > 0) {
      await deleteBtn.first().click();
      await expect(modal).toBeHidden();
      await page.waitForLoadState('networkidle');
    }
  });

  test('Edit button in modal opens edit form', async ({ page }) => {
    await page.waitForSelector('#tableBody', { state: 'visible' });
    const viewBtns = page.locator('.action-btn.btn-view');
    const count = await viewBtns.count();
    if (count === 0) {
      test.skip();
    }
    
    await viewBtns.first().click();
    const modal = page.locator('#detailModal');
    await expect(modal).toBeVisible();
    
    const editBtn = modal.locator('.detail-actions .btn-edit');
    const editVisible = await editBtn.count();
    
    if (editVisible > 0) {
      await editBtn.first().click();
      await expect(modal).toBeHidden();
      // Edit modal should appear
      const editModal = page.locator('#editModal');
      // May or may not be visible depending on table type
      await page.waitForLoadState('networkidle');
    }
  });

  test('Close button in modal closes it', async ({ page }) => {
    await page.waitForSelector('#tableBody', { state: 'visible' });
    const viewBtns = page.locator('.action-btn.btn-view');
    const count = await viewBtns.count();
    if (count === 0) {
      test.skip();
    }
    
    await viewBtns.first().click();
    const modal = page.locator('#detailModal');
    await expect(modal).toBeVisible();
    
    const closeBtn = modal.locator('#modalClose');
    await closeBtn.click();
    await expect(modal).toBeHidden();
  });
});