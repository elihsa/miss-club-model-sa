const { execSync } = require('child_process');

test('npm run lint should report zero ESLint errors', () => {
  try {
    const output = execSync('npm run lint 2>&1', { cwd: process.cwd(), encoding: 'utf8' });
    // ESLint exits 0 when no errors; 12 warnings are acceptable
    expect(output).toMatch(/0 errors/);
  } catch (err) {
    // ESLint exits non-zero on errors
    throw new Error(`Lint failed: ${err.stdout || err.message}`);
  }
});