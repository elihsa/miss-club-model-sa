/**
 * Global Playwright setup – sets BASE_URL from env or defaults to live site.
 */
module.exports = async () => {
  // Ensure BASE_URL is defined for all tests
  if (!process.env.BASE_URL) {
    process.env.BASE_URL = 'https://missclubmodel.vercel.app';
    console.log('BASE_URL not set – defaulting to live site');
  }
};
