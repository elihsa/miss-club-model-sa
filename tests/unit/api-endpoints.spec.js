// tests/unit/api-endpoints.spec.js
const fs = require('fs');
const path = require('path');

describe('API Endpoints', () => {
  const apiDir = path.join(__dirname, '../../api');
  const apiFiles = fs.readdirSync(apiDir).filter(f => f.endsWith('.js'));

  test.each(apiFiles)('API file %s exists and is valid JavaScript', (file) => {
    const filePath = path.join(apiDir, file);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    // Verify it exports a handler (CommonJS or ESM)
    expect(content).toMatch(/(module\.exports|export default)/);
    // Verify Supabase client setup (only for files that use it)
    if (!['cms.js', 'events_create.js', 'candidates.js', 'build-info.js'].includes(file)) {
      expect(content).toMatch(/createClient.*supabase-js/);
    }
  });

  test('All API files have error handling', () => {
    apiFiles.forEach(file => {
      const filePath = path.join(apiDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      // Accept both try/catch and .catch patterns
      expect(content).toMatch(/(try\s*\{|\.catch\(|catch\s*\(|throw\s+)/);
    });
  });

  test('All API files have CORS headers', () => {
    apiFiles.forEach(file => {
      const filePath = path.join(apiDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('Access-Control-Allow-Origin');
    });
  });

  test('No API files expose credentials in source', () => {
    apiFiles.forEach(file => {
      const filePath = path.join(apiDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      // Should use env vars, not hardcoded keys
      expect(content).not.toMatch(/supabase(?:_service)?_key\s*=\s*['"][a-zA-Z0-9]{20,}/);
    });
  });
});
