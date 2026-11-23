// const { createClient } = require('@supabase/supabase-js');  // Reserved for future use
const { setCors } = require('../lib/cors');
const { EMAIL_FROM } = require('../lib/emailFrom');
const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  setCors(req, res);

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
    const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    if (resendClient) {
      try {
        const sendResult = await resendClient.emails.send({
          from: EMAIL_FROM,
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
    if (sendResult && sendResult.error) { throw new Error('Resend API error: ' + (sendResult.error.message || JSON.stringify(sendResult.error))); }
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
};
