// scripts/verify-deploy.js
// Post-deploy verification: confirms build number / timestamp changed
// and that regression test suite passed (by running it).
// Usage: node scripts/verify-deploy.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const infoFile = path.join(root, 'build-info.json');
const lastFile = path.join(root, '.last-build-info.json');

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function writeJSON(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
}

async function main() {
  console.log('🔎 Running regression test suite…');
  try {
    execSync('npm run test', { cwd: root, stdio: 'inherit' });
    console.log('✅ Regression tests passed.\n');
  } catch (_e) {
    console.error('❌ Regression tests failed.');
    process.exit(1);
  }

  const current = readJSON(infoFile);
  if (!current) {
    console.error('❌ build-info.json not found. Run `npm run build` first.');
    process.exit(1);
  }

  const previous = readJSON(lastFile);

  console.log('📦 Current build info:');
  console.log(`  Build:          ${current.build}`);
  console.log(`  Build Number:   ${current.buildNumber}`);
  console.log(`  Build Time UTC: ${current.buildTime}`);
  console.log(`  Build Time SA:  ${current.buildTimeLocal}`);
  console.log(`  Commit:         ${current.commit}`);
  console.log(`  Branch:         ${current.branch}`);

  if (previous) {
    console.log('\n🔄 Comparison with previous deploy:');
    const numChanged = current.buildNumber !== previous.buildNumber;
    const timeChanged = current.buildTime !== previous.buildTime;
    console.log(`  Build number changed: ${numChanged ? 'YES ✅' : 'NO ❌'}`);
    console.log(`  Timestamp changed:    ${timeChanged ? 'YES ✅' : 'NO ❌'}`);
    if (!numChanged || !timeChanged) {
      console.warn('⚠️  Build number or timestamp did not change — deploy may be stale.');
    }
  } else {
    console.log('\nℹ️  No previous build record found (first run).');
  }

  // Persist current for next run
  writeJSON(lastFile, current);
  console.log('\n💾 Saved current build info for next comparison.');
}

main();
