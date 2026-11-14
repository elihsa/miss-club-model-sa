const { createClient } = require('@supabase/supabase-js');
const Resend = require('resend');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

let resendClient = null;
if (resendApiKey) {
  try {
    resendClient = new Resend(resendApiKey);
  } catch (e) {
    console.error('Resend init error:', e.message);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ status: 'error', message: 'Valid email required' });
  }

  try {
    // Store in Supabase newsletter_subscriptions table
    const SUPABASE_URL = 'https://ekvwgxnryasrvltyukvj.supabase.co';
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_REDACTED';

    const response = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        source: 'homepage_footer',
        subscribed_at: new Date().toISOString(),
        status: 'active'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      // Check if duplicate email
      if (error.includes('duplicate') || error.includes('unique')) {
        return res.status(200).json({ status: 'success', message: 'Already subscribed' });
      }
      throw new Error(`Supabase error: ${error}`);
    }

    // Send welcome email via Resend if configured
    if (resendClient) {
      try {
        await resendClient.emails.send({
          from: 'Miss Club Model SA <noreply@missclubmodelsa.co.za>',
          to: email.toLowerCase().trim(),
          subject: '🎭 Welcome to Miss Club Model SA Newsletter!',
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #c9a84c;">🎭 Welcome to Miss Club Model SA!</h2>
              <p>Thank you for subscribing to our newsletter.</p>
              <p>You'll now receive updates about upcoming events, candidate spotlights, venue partnerships, and exclusive behind-the-scenes content.</p>
              <hr style="border-color: #c9a84c;">
              <p><a href="https://missclubmodel.vercel.app" style="background: #c9a84c; color: #0a0a0a; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Visit Miss Club Model SA</a></p>
            </div>
          `
        });
        console.log('Newsletter welcome email sent to:', email);
      } catch (err) {
        console.error('Failed to send welcome email:', err.message);
      }
    }

    return res.status(200).json({ status: 'success', message: 'Subscribed successfully' });

  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    return res.status(500).json({ status: 'error', message: 'Subscription failed. Please try again.' });
  }
}