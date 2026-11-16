/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.spec.js'],
  testPathIgnorePatterns: ['<rootDir>/tests/e2e', '<rootDir>/node_modules'],
  collectCoverageFrom: [
    'api/**/*.js',
    'scripts/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};