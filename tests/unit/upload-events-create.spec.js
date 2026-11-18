// tests/unit/upload-events-create.spec.js
const fs = require('fs');
const path = require('path');

describe('New SPEC endpoints: /api/upload and /api/events_create', () => {
  const apiDir = path.join(__dirname, '../../api');

  describe('/api/upload (generic file upload)', () => {
    const file = path.join(apiDir, 'upload.js');
    const content = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';

    test('file exists and exports a handler', () => {
      expect(fs.existsSync(file)).toBe(true);
      expect(content).toMatch(/module\.exports\s*=\s*handler/);
    });

    test('uses busboy for multipart parsing', () => {
      expect(content).toMatch(/require\(['"]busboy['"]\)/);
      expect(content).toMatch(/new Busboy|Busboy\(/);
    });

    test('sets CORS via shared helper', () => {
      expect(content).toMatch(/require\(['"]\.\/cors['"]\)/);
      expect(content).toMatch(/setCors\(req, res\)/);
    });

    test('validates bucket against allowed set', () => {
      expect(content).toMatch(/BUCKET_MIME/);
      expect(content).toMatch(/videos/);
      expect(content).toMatch(/events/);
      expect(content).toMatch(/applications/);
    });

    test('rejects methods other than POST with 405', () => {
      expect(content).toMatch(/405/);
      expect(content).toMatch(/Method not allowed/);
    });

    test('writes to Supabase storage with public URL', () => {
      expect(content).toMatch(/\.from\(bucket\)/);
      expect(content).toMatch(/\.upload\(/);
      expect(content).toMatch(/getPublicUrl/);
    });

    test('no hardcoded credentials', () => {
      expect(content).not.toMatch(/supabase(?:_service)?_key\s*=\s*['"][a-zA-Z0-9]{20,}/);
    });
  });

  describe('/api/events_create (alternative event creation)', () => {
    const file = path.join(apiDir, 'events_create.js');
    const content = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';

    test('file exists and exports a handler', () => {
      expect(fs.existsSync(file)).toBe(true);
      expect(content).toMatch(/module\.exports\s*=\s*handler/);
    });

    test('handles both JSON and multipart bodies', () => {
      expect(content).toMatch(/application\/json/);
      expect(content).toMatch(/multipart/);
      expect(content).toMatch(/createFromJson/);
      expect(content).toMatch(/createFromMultipart/);
    });

    test('sets CORS via shared helper', () => {
      expect(content).toMatch(/require\(['"]\.\/cors['"]\)/);
      expect(content).toMatch(/setCors\(req, res\)/);
    });

    test('inserts into events table with poster support', () => {
      expect(content).toMatch(/\.from\(['"]events['"]\)/);
      expect(content).toMatch(/\.insert\(/);
      expect(content).toMatch(/poster/);
      expect(content).toMatch(/getPublicUrl/);
    });

    test('handles missing status column gracefully', () => {
      expect(content).toMatch(/status/);
      expect(content).toMatch(/includes\(['"]status['"]\)/);
    });

    test('no hardcoded credentials', () => {
      expect(content).not.toMatch(/supabase(?:_service)?_key\s*=\s*['"][a-zA-Z0-9]{20,}/);
    });
  });
});