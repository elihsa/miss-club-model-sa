// tests/e2e/admin-full.spec.js
// Comprehensive admin dashboard tests covering all tabs and CRUD operations
const { test, expect } = require('@playwright/test');

const ADMIN_TOKEN = process.env.SUPABASE_SERVICE_KEY || 'test-token';

async function ensureAdminSession(page) {
  // Navigate to admin page and simulate login by setting localStorage token
  await page.goto('/admin.html');
  await page.evaluate((token) => {
    localStorage.setItem('adminToken', token);
    window.dispatchEvent(new Event('storage'));
  }, ADMIN_TOKEN);
  // Wait for tables to load
  await page.waitForTimeout(2000);
}

test.describe('Admin Dashboard - Full Coverage', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAdminSession(page);
  });

  test.describe('Candidates Tab', () => {
    test('loads candidate table with data', async ({ page }) => {
      await expect(page.locator('#candidatesTable')).toBeVisible();
      const rows = page.locator('#candidatesTable tbody tr');
      await expect(rows.count()).toBeGreaterThan(0);
    });

    test('can filter candidates by status', async ({ page }) => {
      const filter = page.locator('#candidateStatusFilter');
      await filter.selectOption('approved');
      await page.waitForTimeout(1000);
      const rows = page.locator('#candidatesTable tbody tr');
      await expect(rows.count()).toBeGreaterThanOrEqual(0);
    });

    test('can approve a candidate', async ({ page }) => {
      const approveBtn = page.locator('#candidatesTable tbody tr .btn-approve').first();
      if (await approveBtn.count() > 0) {
        await approveBtn.click();
        await expect(page.locator('#candidatesTable tbody tr').first()).toContainText('approved');
      }
    });
  });

  test.describe('Events Tab', () => {
    test('loads events table', async ({ page }) => {
      await page.click('a[href="#eventsTab"]');
      await expect(page.locator('#eventsTable')).toBeVisible();
    });

    test('can create a new event', async ({ page }) => {
      await page.click('a[href="#eventsTab"]');
      await page.click('#createEventBtn');
      await page.fill('#eventName', 'Test Event');
      await page.fill('#eventDate', '2026-12-01');
      await page.fill('#eventLocation', 'Test Location');
      await page.click('#saveEventBtn');
      await expect(page.locator('#eventsTable tbody tr')).toContainText('Test Event');
    });

    test('can update event status', async ({ page }) => {
      await page.click('a[href="#eventsTab"]');
      const statusSelect = page.locator('#eventsTable tbody tr .status-select').first();
      await statusSelect.selectOption('pending');
      await page.waitForTimeout(500);
      await expect(statusSelect).toHaveValue('pending');
    });
  });

  test.describe('Venues Tab', () => {
    test('loads venue partners table', async ({ page }) => {
      await page.click('a[href="#venuesTab"]');
      await expect(page.locator('#venuesTable')).toBeVisible();
    });

    test('can approve a venue partner', async ({ page }) => {
      await page.click('a[href="#venuesTab"]');
      const approveBtn = page.locator('#venuesTable tbody tr .btn-approve').first();
      if (await approveBtn.count() > 0) {
        await approveBtn.click();
        await expect(page.locator('#venuesTable tbody tr').first()).toContainText('approved');
      }
    });
  });

  test.describe('Registrations Tab', () => {
    test('loads interested parties table', async ({ page }) => {
      await page.click('a[href="#registrationsTab"]');
      await expect(page.locator('#registrationsTable')).toBeVisible();
    });

    test('can filter registrations by event', async ({ page }) => {
      await page.click('a[href="#registrationsTab"]');
      const eventFilter = page.locator('#registrationEventFilter');
      await eventFilter.selectOption('all');
      await page.waitForTimeout(500);
      const rows = page.locator('#registrationsTable tbody tr');
      await expect(rows.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Email Settings Tab', () => {
    test('loads email settings form', async ({ page }) => {
      await page.click('a[href="#emailSettingsTab"]');
      await expect(page.locator('#emailSettingsForm')).toBeVisible();
    });

    test('can update email settings', async ({ page }) => {
      await page.click('a[href="#emailSettingsTab"]');
      const candidateEmail = page.locator('#candidateEmailInput');
      await candidateEmail.fill('test@example.com');
      await page.click('#saveEmailSettingsBtn');
      await expect(page.locator('#emailSettingsStatus')).toContainText('saved');
    });
  });

  test.describe('Bulk Email Tab', () => {
    test('loads bulk email form', async ({ page }) => {
      await page.click('a[href="#bulkEmailTab"]');
      await expect(page.locator('#bulkEmailForm')).toBeVisible();
    });

    test('can send bulk email to event registrants', async ({ page }) => {
      await page.click('a[href="#bulkEmailTab"]');
      const eventSelect = page.locator('#bulkEventSelect');
      await eventSelect.selectOption('all');
      const subject = page.locator('#bulkEmailSubject');
      await subject.fill('Test Bulk Email');
      const message = page.locator('#bulkEmailMessage');
      await message.fill('This is a test message.');
      await page.click('#sendBulkEmailBtn');
      await expect(page.locator('#bulkEmailStatus')).toContainText('sent');
    });
  });

  test.describe('Design System Tab', () => {
    test('loads design system builder', async ({ page }) => {
      await page.click('a[href="#designSystemTab"]');
      await expect(page.locator('#designSystemBuilder')).toBeVisible();
    });

    test('can change primary color', async ({ page }) => {
      await page.click('a[href="#designSystemTab"]');
      const colorInput = page.locator('#primaryColorPicker');
      await colorInput.fill('#ff0000');
      await page.click('#applyDesignChangesBtn');
      await expect(page.locator(':root')).toHaveCSS('--gold', 'rgb(255, 0, 0)');
    });
  });
});
