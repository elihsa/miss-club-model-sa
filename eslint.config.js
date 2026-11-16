module.exports = [
  {
    files: ['scripts/**/*.js', 'api/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        browser: true,
        es2021: true,
        node: true,
        jest: true
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'no-trailing-spaces': 'error',
      'eol-last': 'error'
    }
  },
  {
    ignores: ['node_modules/', 'dist/', 'test-results/', 'playwright-report/']
  }
];