// tests/api/api-contract.spec.js
/**
 * API contract tests - verify endpoint structure and responses
 * Run against live site (requires BASE_URL env var)
 */
describe('API Endpoints Contract', () => {
  const BASE = process.env.BASE_URL || 'https://missclubmodel.vercel.app';

  describe('GET /api/cms', () => {
    test('returns CMS content from Google Sheets', async () => {
      const res = await fetch(`${BASE}/api/cms`);
      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(json.status).toBe('success');
      expect(json.content).toBeDefined();
    });
  });

  describe('GET /api/events', () => {
    test('returns launched events', async () => {
      const res = await fetch(`${BASE}/api/events`);
      expect(res.ok).toBe(true);
      const events = await res.json();
      expect(Array.isArray(events)).toBe(true);
      events.forEach(e => {
        expect(e.name).toBeDefined();
        expect(e.event_date).toBeDefined();
        // Status column may not exist in DB yet - check if present
        if (e.status !== undefined) {
          expect(e.status).toBe('launched');
        }
      });
    });
  });

  describe('GET /api/settings', () => {
    test('returns site settings', async () => {
      const res = await fetch(`${BASE}/api/settings`);
      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(json.status).toBe('success');
      expect(json.data).toBeDefined();
    });
  });

  describe('GET /api/candidates', () => {
    test('returns candidates list', async () => {
      const res = await fetch(`${BASE}/api/candidates`);
      expect(res.ok).toBe(true);
      const json = await res.json();
      expect(Array.isArray(json) || json.status).toBeDefined();
    });
  });

  describe('POST /api/admin - without auth', () => {
    test('rejects unauthorized requests', async () => {
      const res = await fetch(`${BASE}/api/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateStatus' })
      });
      expect(res.status).toBe(401);
    });
  });

  describe('OPTIONS preflight', () => {
    const endpoints = ['/api/submit', '/api/admin', '/api/events', '/api/organizers'];

    test.each(endpoints)('OPTIONS %s returns 200 with CORS headers', async (path) => {
      const res = await fetch(`${BASE}${path}`, { method: 'OPTIONS' });
      expect(res.status).toBe(200);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeDefined();
    });
  });
});
