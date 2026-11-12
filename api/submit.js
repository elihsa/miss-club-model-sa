const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Use service role key for server-side writes (bypasses RLS securely)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Convert camelCase to snake_case for database columns
function toSnakeCase(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = value;
  }
  return result;
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    // Add timestamp
    data.created_at = new Date().toISOString();
    // Default status for new applications
    data.status = 'undecided';

    // Convert camelCase to snake_case for database
    const dbData = toSnakeCase(data);

    // Insert into applications table
    const { data: result, error } = await supabase
      .from('applications')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: error.message 
      });
    }

    return res.status(200).json({ 
      status: 'success', 
      message: 'Application submitted successfully',
      data: result 
    });

  } catch (err) {
    console.error('Submission error:', err);
    return res.status(500).json({ 
      status: 'error', 
      message: err.message 
    });
  }
};