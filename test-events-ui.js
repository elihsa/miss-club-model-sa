const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type()==='error') errors.push('console:'+m.text()); });
  
  await page.goto('https://missclubmodel.vercel.app/admin', { waitUntil: 'networkidle' });
  await page.fill('#loginEmail', 'test-admin@missclubmodel.test');
  await page.fill('#loginPassword', 'TestAdmin123!');
  await page.click('.login-btn');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const mainTabs = await page.locator('#tabs .tab-btn').all();
  const tabTexts = await Promise.all(mainTabs.map(t => t.evaluate(el => el.textContent.trim())));
  console.log('Main tabs:', tabTexts.join(' | '));
  console.log('Event Interest List in main menu:', tabTexts.includes('Event Interest List'));
  
  await page.click('[data-table="events"]');
  await page.waitForTimeout(2000);
  console.log('Event sub-tabs visible:', await page.locator('#eventSubTabs').evaluate(el => el.style.display));
  const subtabTexts = await Promise.all(
    (await page.locator('.sub-tab-btn').all()).map(t => t.evaluate(el => el.textContent.trim()))
  );
  console.log('Sub-tabs:', subtabTexts.join(' | '));
  console.log('Create Event button visible:', await page.locator('#createEventBtn').evaluate(el => el.style.display));
  
  await page.click('.sub-tab-btn[data-event-view="event_interest_subscriptions"]');
  await page.waitForTimeout(2000);
  console.log('Active sub-tab:', await page.locator('.sub-tab-btn.active').evaluate(el => el.textContent.trim()));
  
  console.log('Forgot password link color:', await page.locator('#forgotPasswordLink').evaluate(el => window.getComputedStyle(el).color));
  await browser.close();
  console.log('errors:', errors.length ? errors : 'none');
})();
