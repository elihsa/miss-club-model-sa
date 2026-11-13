// Shared admin authentication guard for write endpoints.
// Verifies the Supabase JWT from the Authorization header using the
// service key server-side, and checks the email against the admin allowlist.
//
// Usage in an endpoint:
//   const { requireAdmin } = require('./_auth');            // CommonJS
//   export const requireAdmin = ...                          // ESM (cms.js)
//
//   const auth = await requireAdmin(req);
//   if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const ADMIN_EMAILS = [
  'elihsa@gmail.com',
  'admin@missclubmodelsa.co.za',
  'kiyanoschoonraad98@gmail.com',
];

async function requireAdmin(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { ok: false, status: 401, error: 'Authentication required' };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { ok: false, status: 500, error: 'Server misconfigured' };
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    // Use the service key with no session persistence purely to validate the
    // incoming user JWT server-side.
    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await client.auth.getUser(token);
    if (error || !data || !data.user) {
      return { ok: false, status: 401, error: 'Invalid or expired session' };
    }

    const email = (data.user.email || '').toLowerCase();
    if (!ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email)) {
      return { ok: false, status: 403, error: 'Not authorized as administrator' };
    }

    return { ok: true, email };
  } catch (err) {
    console.error('Auth verification error:', err);
    return { ok: false, status: 401, error: 'Authentication failed' };
  }
}

module.exports = { requireAdmin, ADMIN_EMAILS };
