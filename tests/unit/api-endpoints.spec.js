// tests/unit/api-endpoints.spec.js
const fs = require('fs');
const path = require('path');

describe('API Endpoints', () => {
  const apiDir = path.join(__dirname, '../../api');
  const apiFiles = fs.readdirSync(apiDir).filter(f => f.endsWith('.js'));
  // Shared helper files that don't create a Supabase client or handle a route themselves
  const helperFiles = ['cors.js'];

  test.each(apiFiles)('API file %s exists and is valid JavaScript', (file) => {
    const filePath = path.join(apiDir, file);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    // Verify it exports a handler (CommonJS or ESM)
    expect(content).toMatch(/(module\.exports|export default)/);
    // Verify Supabase client setup (only for files that use it, not shared helpers)
    if (!['cms.js', 'events_create.js', 'candidates.js', 'build-info.js', ...helperFiles].includes(file)) {
      expect(content).toMatch(/createClient.*supabase-js/);
    }
  });

  test('All API files have error handling', () => {
    apiFiles.forEach(file => {
      // Shared helpers (e.g. cors.js) are pure utilities with no async error paths
      if (helperFiles.includes(file)) return;
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
      // Either inline the header directly OR delegate to the shared ./cors helper
      const hasInline = content.includes('Access-Control-Allow-Origin');
      const usesSharedHelper = /require\(\s*['"]\.\/cors['"]\s*\)/.test(content) && /setCors/.test(content);
      expect(hasInline || usesSharedHelper).toBe(true);
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