const { createClient } = require('@supabase/supabase-js');
const { requireAdmin } = require('./_auth');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return getSettings(req, res);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    // Email settings are sensitive - require an authenticated admin session.
    return updateSettings(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getSettings(req, res) {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value, description')
      .eq('key', 'email_settings')
      .single();

    if (error) {
      // Return defaults if not found
      return res.status(200).json({
        status: 'success',
        data: {
          candidate_application_email: 'elihsa@gmail.com',
          venue_partner_email: 'elihsa@gmail.com',
          event_registration_email: 'elihsa@gmail.com',
          send_all_to_same: false,
          global_email: 'elihsa@gmail.com'
        }
      });
    }

    return res.status(200).json({
      status: 'success',
      data: data.value
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function updateSettings(req, res) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }
  try {
    const body = req.body;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const fields = ['candidate_application_email', 'venue_partner_email', 'event_registration_email', 'global_email'];
    
    for (const field of fields) {
      if (body[field] && !emailRegex.test(body[field])) {
        return res.status(400).json({ error: `Invalid email format for ${field}` });
      }
    }

    const { data, error } = await supabase
      .from('site_settings')
      .upsert([{
        key: 'email_settings',
        value: body,
        description: 'Email configuration for form submissions',
        updated_at: new Date().toISOString()
      }], { onConflict: 'key' })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      status: 'success',
      message: 'Email settings updated successfully',
      data: data.value
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = handler;