const { chromium } = require('playwright');
const { buildStub } = require('./stub-module.js');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await page.route('**/@supabase/supabase-js@2/+esm', r => r.fulfill({ contentType: 'application/javascript', body: buildStub(80, true) }));
  await page.route('**/api/**', r => r.fulfill({ json: { status: 'success', data: [] } }));
  await page.goto('http://127.0.0.1:4199/admin.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  // Events tab: toolbar visibility + contrast measurements
  await page.locator('[data-table="events"]').click();
  await page.waitForTimeout(800);
  const vis = await page.evaluate(() => {
    const out = {};
    for (const id of ['pageTitle', 'createEventBtn', 'columnConfigBtn', 'statsToggleBtn']) {
      const el = document.getElementById(id);
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      out[id] = { display: cs.display, color: cs.color, bg: cs.backgroundColor, w: Math.round(r.width), h: Math.round(r.height) };
    }
    return out;
  });
  console.log('events toolbar:', JSON.stringify(vis));
  await page.screenshot({ path: '/tmp/shot-admin-toolbar.png', clip: { x: 0, y: 0, width: 1400, height: 320 } });
  // hide Poster + move Location after Status, then reload to prove persistence
  await page.evaluate(() => document.getElementById('columnConfigBtn').click());
  await page.waitForTimeout(200);
  await page.evaluate(() => document.getElementById('col_poster_url').click());
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const list = document.getElementById('columnList');
    const items = [...list.querySelectorAll('.column-item')];
    const dt = new DataTransfer();
    const dragged = items.find(i => i.dataset.key === 'location');
    const target = items.find(i => i.dataset.key === 'status');
    dragged.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    const rect = target.getBoundingClientRect();
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt, clientY: rect.bottom - 2 }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
    dragged.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
  });
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => [...document.querySelectorAll('table thead th')].map(t => t.textContent.trim()));
  console.log('headers after hide+reorder:', JSON.stringify(before));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.locator('[data-table="events"]').click();
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => [...document.querySelectorAll('table thead th')].map(t => t.textContent.trim()));
  console.log('headers after reload:', JSON.stringify(after));
  console.log('persistence:', JSON.stringify(before) === JSON.stringify(after) ? 'OK' : 'FAIL');
  // Columns button visible on the two sub-tabs too
  for (const v of ['interested_parties', 'event_interest_subscriptions']) {
    await page.locator(`[data-event-view="${v}"]`).click();
    await page.waitForTimeout(500);
    const b = await page.evaluate(() => {
      const el = document.getElementById('columnConfigBtn');
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { w: Math.round(r.width), display: cs.display, color: cs.color, bg: cs.backgroundColor };
    });
    console.log(`columns btn on ${v}:`, JSON.stringify(b));
  }
  await browser.close();
})();
