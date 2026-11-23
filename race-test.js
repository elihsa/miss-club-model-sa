const { chromium } = require('playwright');
const { buildStub } = require('./stub-module.js');
(async () => {
  const browser = await chromium.launch();
  async function run(delayMs, withSession) {
    const page = await browser.newPage();
    await page.route('**/@supabase/supabase-js@2/+esm', r => r.fulfill({ contentType: 'application/javascript', body: buildStub(delayMs, withSession) }));
    await page.route('**/api/**', r => r.fulfill({ json: { status: 'success', data: [] } }));
    await page.goto('http://127.0.0.1:4199/admin.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const st = await page.evaluate(() => ({
      dash: document.getElementById('dashboardView').style.display,
      login: document.getElementById('loginView').style.display,
      title: document.getElementById('pageTitle').textContent,
      ph: (() => { const r = document.querySelector('.page-header').getBoundingClientRect(); return { y: Math.round(r.y), h: Math.round(r.height) }; })(),
    }));
    await page.close();
    return st;
  }
  let ok = 0;
  for (let i = 0; i < 5; i++) {
    const st = await run(0, true); // worst-case fast session
    const good = st.dash === 'block' && st.login === 'none';
    console.log(`fast run ${i}:`, JSON.stringify(st), good ? 'OK' : 'RACE-FAIL');
    if (good) ok++;
  }
  console.log(`valid-session fast-path: ${ok}/5 dashboard stable`);
  const slow = await run(150, true);
  console.log('slow-path:', JSON.stringify(slow), slow.dash === 'block' ? 'OK' : 'FAIL');
  const none = await run(0, false);
  console.log('no-session:', JSON.stringify(none), none.login === 'block' && none.dash === 'none' ? 'OK' : 'FAIL');
  await browser.close();
})();
