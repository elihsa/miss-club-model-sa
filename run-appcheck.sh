#!/usr/bin/env bash
# Full appcheck run for Miss Club Model SA

echo "=== FULL APPCHECK RUN ==="

# Step 0: Cache Validation
echo "[0/15] Cache Validation"
SHA=$(cat package-lock.json vercel.json .env.example 2>/dev/null | sha256sum | cut -d' ' -f1)
mkdir -p .appcheck
if [ -f .appcheck/last_hash.txt ] && [ "$(cat .appcheck/last_hash.txt)" = "$SHA" ]; then
  echo "  CACHE HIT — skipping to Step 13"
else
  echo "  CACHE MISS — full pipeline"
  echo "$SHA" > .appcheck/last_hash.txt
fi

# Step 1: Dependency Scan
echo "[1/15] Dependency Scan"
npm ls --all 2>&1 | tail -5

# Step 2: System Detection
echo "[2/15] System Detection"
echo "  Node: $(node --version)"
echo "  npm: $(npm --version)"
echo "  OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')"
echo "  Arch: $(uname -m)"

# Step 3: Fetcher & Verify
echo "[3/15] Fetcher & Verify"
node -e "
const deps = require('./package.json');
const all = {...deps.dependencies, ...deps.devDependencies};
let ok = 0, fail = 0;
for (const [name] of Object.entries(all)) {
  try { require.resolve(name); ok++; } catch (e) { console.log('  MISSING:', name); fail++; }
}
console.log('  Resolved:', ok, '/', ok+fail);
"

# Step 4: Syntax & Lint
echo "[4/15] Syntax & Lint"
npm run lint 2>&1 | tail -5

# Step 5: Environment
echo "[5/15] Environment Validation"
test -f .env.example && echo "  .env.example: OK" || echo "  .env.example: MISSING"
node -e "
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n').filter(l => l.trim() && !l.startsWith('#'));
const vars = lines.map(l => l.split('=')[0]);
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'];
const missing = required.filter(r => !vars.includes(r));
if (missing.length) console.log('  MISSING:', missing.join(', '));
else console.log('  All required vars present');
console.log('  Total vars:', vars.length);
"

# Step 6: Backend Probe
echo "[6/15] Backend Service Probing"
curl -s -o /dev/null -w "  Supabase: HTTP %{http_code}\n" --max-time 10 https://ekvwgxnryasrvltyukvj.supabase.co/auth/v1/health

# Step 7: Forms
echo "[7/15] Form & E2E Scaffolding"
node -e "
const fs = require('fs');
const forms = ['index.html', 'events.html', 'contact.html', 'admin.html', 'design-system-builder.html'];
forms.forEach(f => {
  if (fs.existsSync(f)) {
    const html = fs.readFileSync(f, 'utf8');
    console.log('  ' + f + ': form=' + html.includes('<form') + ' input=' + html.includes('<input') + ' button=' + html.includes('<button'));
  }
});
"

# Step 8: Frontend
echo "[8/15] Frontend HTML/CSS/JS Validation"
node -e "
const fs = require('fs');
const files = ['admin.html', 'design-system-builder.html', 'index.html', 'events.html', 'contact.html'];
files.forEach(f => {
  if (fs.existsSync(f)) {
    const html = fs.readFileSync(f, 'utf8');
    const ok = html.toLowerCase().includes('<!doctype html>') && html.includes('</html>') && html.includes('</body>');
    console.log('  ' + f + ': ' + (ok ? 'OK' : 'STRUCTURE ERROR'));
  }
});
"

# Step 9: Templates
echo "[9/15] Template Engine Check"
if grep -r '{%' *.html 2>/dev/null | grep -v node_modules; then
  echo "  WARNING: Template syntax detected"
else
  echo "  No template engines (static HTML)"
fi

# Step 10: Assets
echo "[10/15] Static Assets"
ls -la assets/ 2>/dev/null | head -5

# Step 11: Ports & Timezone
echo "[11/15] Port & Timezone Audit"
echo "  TZ: $(date +%Z)"
for port in 3000 5000 8765 2283; do
  (timeout 2 bash -c "echo > /dev/tcp/127.0.0.1/$port" 2>&1 && echo "  Port $port: IN USE" || echo "  Port $port: free");
done

# Step 12: Security
echo "[12/15] Security Headers & CORS"
curl -sI https://missclubmodel.vercel.app/api/build-info | grep -i "access-control\|x-frame\|x-content\|strict-transport"

# Steps 13-15: Post-Gate
echo "[13/15] Visual Regression Baselines"
ls tests/e2e/visual_regression.spec.ts-snapshots/ 2>/dev/null | wc -l | xargs echo "  Snapshots:"
echo "[14/15] CI/CD Pipeline"
ls .github/workflows/appcheck.yml 2>/dev/null && echo "  Generated" || echo "  Not generated"
echo "[15/15] Pre-Commit Hook"
test -f .git/hooks/pre-commit && echo "  Installed" || echo "  Not installed"

echo ""
echo "=== APPCHECK COMPLETE ==="