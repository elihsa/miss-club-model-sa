export default async function handler(req, res) {
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

    // Optionally send welcome email via Resend
    // (implement if RESEND_API_KEY is available)

    return res.status(200).json({ status: 'success', message: 'Subscribed successfully' });

  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    return res.status(500).json({ status: 'error', message: 'Subscription failed. Please try again.' });
  }
}