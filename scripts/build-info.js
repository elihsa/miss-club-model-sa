// scripts/build-info.js
// Generates build-info.json on every deploy so the site footer + docs
// always reflect the exact build (code version + deploy time + commit).
//
// Build number = total commit count on the branch (reproducible, tied to code).
// buildTime   = the moment this build ran (so you can verify "is it current?").
//
// Run automatically by Vercel (see vercel.json buildCommand) and by:
//   node scripts/build-info.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const outFile = path.join(root, 'build-info.json');

function git(cmd) {
  try {
    return execSync(cmd, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null;
  } catch {
    return null;
  }
}

// Build number = number of commits on HEAD. Reproducible per commit.
let buildNumber = 0;
try {
  buildNumber = parseInt(execSync('git rev-list --count HEAD', { cwd: root }).toString().trim(), 10);
} catch (e) {
  buildNumber = 0; // no git available — fall back to timestamp seconds
}
if (!buildNumber) {
  buildNumber = Math.floor(Date.now() / 1000) % 1000000;
}

const commit = git('git rev-parse --short HEAD') || 'local';
const commitDate = git('git log -1 --format=%cI');
const branch = git('git rev-parse --abbrev-ref HEAD') || 'unknown';

const version = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
})();

const now = new Date();
const buildTime = now.toISOString();
const buildTimeLocal = now.toLocaleString('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

const info = {
  build: `v${version} #${buildNumber}`,
  buildNumber,
  version,
  commit,
  branch,
  commitDate,
  buildTime,
  buildTimeLocal,
  generatedBy: 'scripts/build-info.js'
};

fs.writeFileSync(outFile, JSON.stringify(info, null, 2) + '\n');
console.log('[build-info] Generated:', info.build, '|', info.buildTimeLocal, '| commit', info.commit);
