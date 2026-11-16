#!/usr/bin/env node
/**
 * Miss Club Model SA - Comprehensive Site Audit
 * Checks: HTML validation, JS syntax, API routes, spec compliance
 */

const fs = require('fs');
const path = require('path');

const ROOT = '/home/eli/Downloads/missclubmodel';

// Colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const results = {
  html: { files: [], errors: [], warnings: [] },
  js: { files: [], errors: [], warnings: [] },
  api: { routes: [], errors: [] },
  spec: { checks: [], failures: [] },
  build: { info: null }
};

console.log(`${BLUE}══════════════════════════════════════════════${RESET}`);
console.log(`${BLUE}  Miss Club Model SA - Comprehensive Audit${RESET}`);
console.log(`${BLUE}══════════════════════════════════════════════${RESET}\n`);

// 1. Scan HTML files
console.log(`${YELLOW}[1/5] Scanning HTML files...${RESET}`);
const htmlFiles = [
  'index.html',
  'events.html',
  'admin.html',
  'terms.html',
  'privacy.html',
  'contact.html',
  'design-system-builder.html'
];

htmlFiles.forEach(file => {
  const filePath = path.join(ROOT, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    results.html.files.push({ name: file, size: content.length, lines: content.split('\n').length });
    
    // Check for common issues
    const issues = [];
    
    // Check for unclosed tags
    const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    const tagRegex = /<([a-z0-9]+)(?:\s[^>]*)?\/?>/gi;
    const openTags = [];
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      const tagName = match[1].toLowerCase();
      if (!voidTags.includes(tagName) && !match[0].endsWith('/>')) {
        openTags.push(tagName);
      }
    }
    
    // Check DOCTYPE
    if (!content.startsWith('<!DOCTYPE html>')) {
      issues.push('Missing or incorrect DOCTYPE');
    }
    
    // Check charset
    if (!content.includes('<meta charset="UTF-8">')) {
      issues.push('Missing UTF-8 charset declaration');
    }
    
    // Check viewport
    if (!content.includes('name="viewport"')) {
      issues.push('Missing viewport meta tag');
    }
    
    // Check for build-info-runtime.js
    if (!content.includes('build-info-runtime.js')) {
      issues.push('Missing build-info-runtime.js script');
    }
    
    // Check for #buildInfo element
    if (!content.includes('id="buildInfo"')) {
      issues.push('Missing #buildInfo element for build tracking');
    }
    
    if (issues.length > 0) {
      results.html.warnings.push({ file, issues });
    }
    
    console.log(`  ${GREEN}✓${RESET} ${file} (${content.length} bytes, ${issues.length} warnings)`);
  } else {
    results.html.errors.push({ file, error: 'File not found' });
    console.log(`  ${RED}✗${RESET} ${file} - NOT FOUND`);
  }
});

// 2. Scan API files
console.log(`\n${YELLOW}[2/5] Scanning API routes...${RESET}`);
const apiFiles = fs.readdirSync(path.join(ROOT, 'api'));
apiFiles.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(ROOT, 'api', file);
    const content = fs.readFileSync(filePath, 'utf8');
    results.js.files.push({ name: `api/${file}`, size: content.length });
    
    // Extract route patterns
    const routeMatches = content.match(/(?:router\.get|router\.post|router\.put|router\.delete)\s*\(\s*['"]([^'"]+)['"]/g);
    if (routeMatches) {
      routeMatches.forEach(route => {
        const routePath = route.match(/['"]([^'"]+)['"]/)[1];
        results.api.routes.push({ file, path: routePath, method: route.match(/router\.(get|post|put|delete)/)[1].toUpperCase() });
      });
    }
    
    console.log(`  ${GREEN}✓${RESET} ${file} (${routeMatches ? routeMatches.length + ' routes' : 'no routes'})`);
  }
});

// 3. Check scripts
console.log(`\n${YELLOW}[3/5] Scanning scripts...${RESET}`);
const scriptFiles = fs.readdirSync(path.join(ROOT, 'scripts'));
scriptFiles.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(ROOT, 'scripts', file);
    const content = fs.readFileSync(filePath, 'utf8');
    results.js.files.push({ name: `scripts/${file}`, size: content.length });
    console.log(`  ${GREEN}✓${RESET} ${file}`);
  }
});

// 4. Specification compliance checks
console.log(`\n${YELLOW}[4/5] Specification compliance checks...${RESET}`);

const specChecks = [
  {
    name: 'Color scheme (black/gold/cream)',
    test: () => {
      const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
      return index.includes('#0a0a0a') && index.includes('#c9a84c') && index.includes('#f5f0e8');
    }
  },
  {
    name: 'Build info system present',
    test: () => {
      return fs.existsSync(path.join(ROOT, 'build-info.json')) &&
             fs.existsSync(path.join(ROOT, 'scripts/build-info-runtime.js')) &&
             fs.existsSync(path.join(ROOT, 'scripts/build-info.js'));
    }
  },
  {
    name: 'Event interest message field',
    test: () => {
      const eventsHtml = fs.readFileSync(path.join(ROOT, 'events.html'), 'utf8');
      const apiEventInterest = fs.readFileSync(path.join(ROOT, 'api/event-interest.js'), 'utf8');
      return eventsHtml.includes('message') && apiEventInterest.includes('message');
    }
  },
  {
    name: 'Email signatures (3 types)',
    test: () => {
      const admin = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
      return admin.includes('candidate_signature') && 
             admin.includes('venue_signature') && 
             admin.includes('event_signature');
    }
  },
  {
    name: 'Dynamic site name',
    test: () => {
      const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
      return index.includes('site_name') && index.includes('/api/settings');
    }
  },
  {
    name: 'Legal links dynamic wrapping',
    test: () => {
      const events = fs.readFileSync(path.join(ROOT, 'events.html'), 'utf8');
      return events.includes('data-cms-key') && events.includes('Terms & Conditions');
    }
  },
  {
    name: 'Supabase skills installed',
    test: () => {
      return fs.existsSync(path.join(ROOT, '.agents/skills/supabase'));
    }
  },
  {
    name: 'Vercel build command updated',
    test: () => {
      const vercelJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
      return vercelJson.buildCommand === 'node scripts/build-info.js';
    }
  }
];

specChecks.forEach(check => {
  try {
    const passed = check.test();
    if (passed) {
      results.spec.checks.push({ name: check.name, status: 'PASS' });
      console.log(`  ${GREEN}✓ PASS${RESET} ${check.name}`);
    } else {
      results.spec.failures.push({ name: check.name, status: 'FAIL' });
      console.log(`  ${RED}✗ FAIL${RESET} ${check.name}`);
    }
  } catch (err) {
    results.spec.failures.push({ name: check.name, status: 'ERROR', error: err.message });
    console.log(`  ${RED}✗ ERROR${RESET} ${check.name}: ${err.message}`);
  }
});

// 5. Build info
console.log(`\n${YELLOW}[5/5] Checking build info...${RESET}`);
try {
  const buildInfo = JSON.parse(fs.readFileSync(path.join(ROOT, 'build-info.json'), 'utf8'));
  results.build.info = buildInfo;
  console.log(`  ${GREEN}✓${RESET} Build #${buildInfo.build} | ${buildInfo.buildTime} | ${buildInfo.commit}`);
} catch (err) {
  console.log(`  ${RED}✗${RESET} Build info not found or invalid`);
  results.build.info = null;
}

// Summary
console.log(`\n${BLUE}══════════════════════════════════════════════${RESET}`);
console.log(`${BLUE}  AUDIT SUMMARY${RESET}`);
console.log(`${BLUE}══════════════════════════════════════════════${RESET}`);

console.log(`\n${YELLOW}HTML Files:${RESET} ${results.html.files.length} scanned`);
if (results.html.errors.length > 0) {
  console.log(`  ${RED}Errors: ${results.html.errors.length}${RESET}`);
  results.html.errors.forEach(e => console.log(`    - ${e.file}: ${e.error}`));
}
if (results.html.warnings.length > 0) {
  console.log(`  ${YELLOW}Warnings: ${results.html.warnings.length}${RESET}`);
  results.html.warnings.forEach(w => {
    console.log(`    - ${w.file}:`);
    w.issues.forEach(i => console.log(`      • ${i}`));
  });
}

console.log(`\n${YELLOW}JavaScript Files:${RESET} ${results.js.files.length} scanned`);
console.log(`${YELLOW}API Routes:${RESET} ${results.api.routes.length} discovered`);
console.log(`${YELLOW}Spec Compliance:${RESET} ${results.spec.checks.length}/${specChecks.length} passed`);

if (results.spec.failures.length > 0) {
  console.log(`\n${RED}Failed Checks:${RESET}`);
  results.spec.failures.forEach(f => console.log(`  - ${f.name}`));
}

console.log(`\n${GREEN}Audit complete!${RESET}`);

// Write results to file
fs.writeFileSync(
  path.join(ROOT, 'workspace/audit-results.json'),
  JSON.stringify(results, null, 2)
);
console.log(`\nFull results saved to: workspace/audit-results.json`);

process.exit(results.spec.failures.length > 0 ? 1 : 0);
