// Shared admin guard for serverless endpoints that mutate data.
// A request is admin when it carries a valid Supabase session token whose
// user email is a known admin. Public endpoints keep working; only the
// mutating routes call this.
const { createClient } = require('@supabase/supabase-js');

const ADMIN_EMAILS = ['elihsa@gmail.com', 'admin@missclubmodelsa.co.za', 'kiyanoschoonraad98@gmail.com', 'test-admin@missclubmodel.test'];

let client = null;
function getClient() {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return client;
}

async function isAdminRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice('Bearer '.length);
  try {
    const { data: { user }, error } = await getClient().auth.getUser(token);
    if (error || !user || !user.email) return false;
    return ADMIN_EMAILS.includes(user.email);
  } catch (e) {
    return false;
  }
}

module.exports = { isAdminRequest, ADMIN_EMAILS };
