const { createClient } = require('@supabase/supabase-js');
const Resend = require('resend');

const adminEmail = process.env.ADMIN_EMAIL || 'admin@missclubmodelsa.co.za';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Initialize Resend if API key is available
let resendClient = null;
if (resendApiKey) {
  try {
    resendClient = new Resend(resendApiKey);
  } catch (e) {
    console.error('Resend init error:', e.message);
  }
}

function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return submitInterestedParty(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function sendUserConfirmationEmail(emailData) {
  if (!resendClient) return;

  const subject = `🎟️ Event Registration Confirmation - ${emailData.event_name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
      <h2>🎭 Event Registration Confirmed!</h2>
      <p><strong>Dear ${emailData.full_name},</strong></p>
      <p>Thank you for registering for <strong>${emailData.event_name}</strong>!</p>
      <p><strong>Event Details:</strong></p>
      <p>📅 Date: ${emailData.event_date || 'N/A'}</p>
      <p>📍 Location: ${emailData.event_location || 'N/A'}</p>
      <p>💰 Price: R250 per person</p>
      <p>🎯 Candidates: ${emailData.favorite_candidate ? emailData.favorite_candidate : 'See candidates on the event page'}</p>
      <p>📧 Keep this email as your confirmation.</p>
      <hr>
      <p><a href="https://missclubmodel.vercel.app" style="background: #c9a84c; color: #0a0a0a; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Back to Miss Club Model SA</a></p>
    </div>
  `;

  try {
    await resendClient.emails.send({
      from: 'Miss Club Model SA <noreply@missclubmodelsa.co.za>',
      to: emailData.email,
      subject,
      html,
    });
    console.log('User confirmation email sent to:', emailData.email);
  } catch (error) {
    console.error('Failed to send user confirmation email:', error.message);
  }
}

async function submitInterestedParty(req, res) {
  try {
    const body = req.body;

    // Validate required fields
    if (!body.event_id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }
    if (!body.email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!body.full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const { data, error } = await supabase
      .from('interested_parties')
      .insert([{
        event_id: body.event_id,
        full_name: body.full_name,
        phone: body.phone,
        email: body.email,
        favorite_candidate: body.favorite_candidate,
        submitted_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Send confirmation email to user (async)
    sendUserConfirmationEmail({
      full_name: body.full_name,
      email: body.email,
      event_name: body.event_name || 'Event',
      event_date: body.event_date || 'N/A',
      event_location: body.event_location || 'N/A',
      favorite_candidate: body.favorite_candidate || 'N/A'
    }).catch(err => console.error('Email send error:', err));

    return res.status(201).json({
      status: 'success',
      message: 'Your interest has been submitted! We will contact you soon.',
      data: data
    });
  } catch (error) {
    console.error('Submit interested party error:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = handler;