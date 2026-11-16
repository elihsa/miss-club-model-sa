/**
 * Shared CORS helper for Vercel serverless functions.
 * Restricts to production domain + local dev origins.
 * Usage: add `require('./cors').setCors(req, res)` at the top of each handler.
 */
const ALLOWED_ORIGINS = [
  'https://missclubmodel.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

module.exports = { setCors, ALLOWED_ORIGINS };
