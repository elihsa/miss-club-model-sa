const { chromium } = require('playwright');

const EVENTS = [
  { id: 'evt-1', name: 'Gala Dinner', event_date: '2026-12-15', location: 'Sun City', status: 'launched', created_at: '2026-11-01' },
  { id: 'evt-2', name: 'Cape Town Auditions', event_date: '2026-12-20', location: 'Cape Town', status: 'launched', created_at: '2026-11-02' },
];
const TABLE_DATA = {
  events: EVENTS,
  interested_parties: [
    { id: 'reg-1', full_name: 'Test Person', email: 'test@example.com', event_id: 'evt-1', status: 'confirmed', created_at: '2026-11-20' },
  ],
  event_interest_subscriptions: [
    { id: 'sub-1', email: 'sub@example.com', event_id: 'evt-2', favorite_candidate: '', message: 'hi', status: 'active', subscribed_at: '2026-11-20' },
  ],
};

const STUB_MODULE = `
export function createClient() {
  const data = ${JSON.stringify(TABLE_DATA)};
  function makeQuery(table) {
    const q = {
      _table: table,
      select() { return q; }, order() { return q; }, eq() { return q; },
      limit() { return q; }, range() { return q; }, filter() { return q; },
      insert() { return q; }, update() { return q; }, delete() { return q; },
      upsert() { return q; }, single() { return q; },
      then(resolve) { resolve({ data: data[table] || [], error: null }); },
    };
    return q;
  }
  return {
    auth: {
      getSession: async () => { await new Promise(r => setTimeout(r, 60)); console.log('STUB getSession called'); return { data: { session: { user: { id: 'u1', email: 'test-admin@missclubmodel.test' }, access_token: 'fake' } }, error: null }; },
      getUser: async () => { await new Promise(r => setTimeout(r, 10)); console.log('STUB getUser called'); return { data: { user: { id: 'u1', email: 'test-admin@missclubmodel.test' } }, error: null }; },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async () => ({ data: { user: { id: 'u1' }, session: {} }, error: null }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
    },
    from: (t) => makeQuery(t),
  };
}
`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', e => console.log('PAGEERROR:', e.message.slice(0, 200)));
  page.on('console', m => console.log('CON:', m.text().slice(0, 160)));
  page.on('requestfailed', r => console.log('REQFAIL:', r.url().slice(0, 120)));
  await page.route('**/@supabase/supabase-js@2/+esm', r => r.fulfill({ contentType: 'application/javascript', body: STUB_MODULE }));
  await page.route('**/api/cms**', r => r.fulfill({ json: {} }));
  await page.route('**/api/**', r => r.fulfill({ json: { status: 'success', data: [] } }));
  await page.addInitScript(() => { window.addEventListener('unhandledrejection', e => console.error('UNREJ: ' + (e.reason && e.reason.message || e.reason))); });
  await page.goto('http://127.0.0.1:4199/admin.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const state = await page.evaluate(() => ({
    dash: document.getElementById('dashboardView')?.style.display,
    login: document.getElementById('loginView')?.style.display,
  }));
  console.log('state:', JSON.stringify(state));
  // open the Events main tab first so the sub-tabs become visible
  await page.locator('[data-table="events"]').click();
  await page.waitForTimeout(800);
  const evText = await page.evaluate(() => document.querySelector('table')?.innerText || '(no table)');
  console.log('events tab lists names:', evText.includes('Gala Dinner') && evText.includes('Cape Town Auditions'));
  await page.screenshot({ path: '/tmp/shot-admin-events.png' });
  // Event Registrations sub-tab
  await page.locator('[data-event-view="interested_parties"]').click();
  await page.waitForTimeout(800);
  const regText = await page.evaluate(() => document.querySelector('table')?.innerText || '(no table)');
  console.log('registrations has event name:', regText.includes('Gala Dinner'), '| has raw uuid:', regText.includes('evt-1'));
  await page.screenshot({ path: '/tmp/shot-admin-registrations.png' });
  // Event Interest List sub-tab
  await page.locator('[data-event-view="event_interest_subscriptions"]').click();
  await page.waitForTimeout(800);
  const intText = await page.evaluate(() => document.querySelector('table')?.innerText || '(no table)');
  console.log('interest list has event name:', intText.includes('Cape Town Auditions'), '| has raw uuid:', intText.includes('evt-2'));
  await page.screenshot({ path: '/tmp/shot-admin-interest.png' });
  // Add Event button only in admin: visible here
  const addBtn = await page.evaluate(() => {
    const b = document.getElementById('createEventBtn');
    return b ? getComputedStyle(b).display : '(missing)';
  });
  console.log('admin createEventBtn display:', addBtn);
  // column config: hide/show + reorder on the Events tab
  await page.locator('[data-table="events"]').click();
  await page.waitForTimeout(600);
  const headersBefore = await page.evaluate(() => [...document.querySelectorAll('table thead th')].map(t => t.textContent.trim()));
  console.log('headers before:', JSON.stringify(headersBefore));
  await page.evaluate(() => document.getElementById('columnConfigBtn').click());
  await page.waitForTimeout(300);
  const clickRes = await page.evaluate(() => {
    const cb = document.getElementById('col_poster_url');
    const before = cb.checked;
    let err = null;
    window.addEventListener('error', e => { err = e.message; }, { once: true });
    cb.click();
    return { before, after: cb.checked, err, stored: localStorage.getItem('admin_column_config') };
  });
  console.log('clickRes:', JSON.stringify(clickRes));
  await page.waitForTimeout(300);
  const dbg = await page.evaluate(() => ({ stored: localStorage.getItem('admin_column_config'), checked: document.getElementById('col_poster_url')?.checked }));
  console.log('DBG after uncheck:', JSON.stringify(dbg));
  const headersHidden = await page.evaluate(() => [...document.querySelectorAll('table thead th')].map(t => t.textContent.trim()));
  console.log('after hiding Location:', JSON.stringify(headersHidden));
  const orderAfter = await page.evaluate(() => {
    const list = document.getElementById('columnList');
    const items = [...list.querySelectorAll('.column-item')];
    const dt = new DataTransfer();
    const dragged = items[1];
    const target = items[3];
    dragged.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    const rect = target.getBoundingClientRect();
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt, clientY: rect.bottom - 2 }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
    dragged.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
    return [...list.querySelectorAll('.column-item')].map(i => i.dataset.key);
  });
  await page.waitForTimeout(300);
  const headersDrag = await page.evaluate(() => [...document.querySelectorAll('table thead th')].map(t => t.textContent.trim()));
  console.log('list order after drag:', JSON.stringify(orderAfter));
  console.log('headers after drag:', JSON.stringify(headersDrag));
  await page.evaluate(() => document.getElementById('col_poster_url').click());
  await page.waitForTimeout(300);
  const headersFinal = await page.evaluate(() => [...document.querySelectorAll('table thead th')].map(t => t.textContent.trim()));
  console.log('after re-showing Location:', JSON.stringify(headersFinal));
  await page.screenshot({ path: '/tmp/shot-admin-columns.png' });
  await browser.close();
})();
