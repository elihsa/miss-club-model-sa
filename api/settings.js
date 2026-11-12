const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Load settings - Use environment variable (settable in admin panel)
const adminEmail = process.env.ADMIN_EMAIL || 'admin@missclubmodelsa.co.za';

function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return handleSettings(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleSettings(req, res) {
  try {
    const body = req.body;

    // Validate admin email
    if (!body.admin_email || !body.admin_email.includes('@')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email address'
      });
    }

    // Set the admin email (environment variable persists for this serverless function)
    process.env.ADMIN_EMAIL = body.admin_email;

    return res.status(200).json({
      status: 'success',
      message: 'Settings saved successfully',
      data: { admin_email: body.admin_email }
    });
  } catch (error) {
    console.error('Settings error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}

module.exports = handler;