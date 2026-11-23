const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = '/tmp/missclub-func';
const PORT = 4199;

const fixtures = [
  { id: 'evt-1', name: 'Gala Dinner', event_date: '2026-12-15', event_time: '18:00', location: 'Sun City', description: 'Test gala', poster_url: null, status: 'launched', created_at: '2026-11-12T00:00:00Z' },
  { id: 'evt-2', name: 'Cape Town Auditions', event_date: '2027-01-10', event_time: null, location: 'CPT', description: null, poster_url: null, status: 'launched', created_at: '2026-11-12T00:00:00Z' },
];

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(fixtures));
    return;
  }
  if (url.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', data: {} }));
    return;
  }
  let fp = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (url === '/events') fp = path.join(ROOT, 'events.html');
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404); res.end('nf'); return;
  }
  const ext = path.extname(fp);
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' }[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(fp).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  // 1. Events page renders events from /api/events
  await page.goto(`http://localhost:${PORT}/events`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const cards = await page.locator('#eventsGrid .event-card').count();
  const names = await page.locator('#eventsGrid h3').allTextContents();
  console.log('event cards:', cards, '| names:', names.join(', '));

  // 2. Tell Me More opens modal for the right event
  await page.locator('button[data-cms-key="btnTellMeMore"]').first().click();
  await page.waitForTimeout(500);
  const modalVisible = await page.locator('#tellMeMoreModal.show').count();
  const modalEvent = await page.locator('#modalEventName').textContent();
  console.log('tell-me-more modal open:', modalVisible === 1, '| event:', modalEvent);

  // 3. No public Create Event UI
  const createSection = await page.locator('#eventCreationSection').count();
  console.log('public create-event section present:', createSection > 0);

  // close the modal first so it does not overlay the card buttons
  await page.locator('#tellMeMoreClose').click();
  // 4. Register Interest form toggles
  await page.keyboard.press('Escape');
  await page.locator('.btn', { hasText: 'Register Interest' }).first().click().catch(e => console.log('register click issue:', e.message));
  await page.waitForTimeout(400);
  const joinVisible = await page.locator('.join-form').first().evaluate(el => getComputedStyle(el).display);
  console.log('register-interest form display:', joinVisible);

  // 5. Homepage nav Events -> /events
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  const navHref = await page.locator('a[data-cms-key="navEvents"]').first().getAttribute('href');
  console.log('homepage nav Events href:', navHref);

  console.log('page errors:', errors.length ? errors : 'none');
  await browser.close();
  server.close();
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
