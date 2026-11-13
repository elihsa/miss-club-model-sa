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

// Get email settings from database
async function getEmailSettings() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'email_settings')
      .single();
    
    if (error || !data) {
      return {
        candidate_application_email: process.env.CANDIDATE_EMAIL || 'elihsa@gmail.com',
        venue_partner_email: process.env.VENUE_EMAIL || 'elihsa@gmail.com',
        event_registration_email: process.env.EVENT_EMAIL || 'elihsa@gmail.com',
        send_all_to_same: false,
        global_email: process.env.GLOBAL_EMAIL || 'elihsa@gmail.com'
      };
    }
    return data.value;
  } catch (err) {
    console.error('Error fetching email settings:', err);
    return {
      candidate_application_email: 'elihsa@gmail.com',
      venue_partner_email: 'elihsa@gmail.com',
      event_registration_email: 'elihsa@gmail.com',
      send_all_to_same: false,
      global_email: 'elihsa@gmail.com'
    };
  }
}

function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
      <h2 style="color: #c9a84c;">🎭 Event Registration Confirmed!</h2>
      <p><strong>Dear ${emailData.full_name},</strong></p>
      <p>Thank you for registering for <strong>${emailData.event_name}</strong>!</p>
      <p><strong>Event Details:</strong></p>
      <p>📅 Date: ${emailData.event_date || 'N/A'}</p>
      <p>📍 Location: ${emailData.event_location || 'N/A'}</p>
      <p>💰 Price: R250 per person</p>
      <p>🎯 Candidates: ${emailData.favorite_candidate ? emailData.favorite_candidate : 'See candidates on the event page'}</p>
      <p>📧 Keep this email as your confirmation.</p>
      <hr style="border-color: #c9a84c;">
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

async function sendAdminNotification(emailData, settings) {
  if (!resendClient) return;

  // Determine recipient
  const recipient = settings.send_all_to_same 
    ? settings.global_email 
    : settings.event_registration_email;

  const subject = `Miss Club Model SA: New Event Registration - ${emailData.event_name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c9a84c;">🎟️ New Event Registration</h2>
      <p><strong>Event:</strong> ${emailData.event_name}</p>
      <p><strong>Name:</strong> ${emailData.full_name}</p>
      <p><strong>Email:</strong> ${emailData.email}</p>
      <p><strong>Phone:</strong> ${emailData.phone || 'N/A'}</p>
      <p><strong>Favorite Candidate:</strong> ${emailData.favorite_candidate || 'Not specified'}</p>
      <p><strong>Registered:</strong> ${new Date().toLocaleString()}</p>
      <hr style="border-color: #c9a84c;">
      <p><a href="https://missclubmodel.vercel.app/admin" style="background: #c9a84c; color: #0a0a0a; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View in Admin Dashboard</a></p>
    </div>
  `;

  try {
    await resendClient.emails.send({
      from: 'Miss Club Model SA <noreply@missclubmodelsa.co.za>',
      to: recipient,
      subject,
      html,
    });
    console.log('Event registration admin notification sent to:', recipient);
  } catch (error) {
    console.error('Failed to send admin notification:', error.message);
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

    // Get event details for emails
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('name, event_date, location')
      .eq('id', body.event_id)
      .single();

    if (eventError) {
      console.error('Event not found:', eventError);
    }

    const eventName = eventData?.name || 'Event';
    const eventDate = eventData?.event_date || 'N/A';
    const eventLocation = eventData?.location || 'N/A';

    const { data, error } = await supabase
      .from('interested_parties')
      .insert([{
        event_id: body.event_id,
        full_name: body.full_name,
        phone: body.phone,
        email: body.email,
        favorite_candidate: body.favorite_candidate,
        event_name: eventName,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Get email settings
    const settings = await getEmailSettings();

    // Send confirmation email to user (async)
    sendUserConfirmationEmail({
      full_name: body.full_name,
      email: body.email,
      event_name: eventName,
      event_date: eventDate,
      event_location: eventLocation,
      favorite_candidate: body.favorite_candidate
    }).catch(err => console.error('Email send error:', err));

    // Send admin notification (async)
    sendAdminNotification({
      full_name: body.full_name,
      email: body.email,
      phone: body.phone,
      event_name: eventName,
      favorite_candidate: body.favorite_candidate
    }, settings).catch(err => console.error('Admin email error:', err));

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