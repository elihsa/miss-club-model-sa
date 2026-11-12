const { createClient } = require('@supabase/supabase-js');
const Resend = require('resend');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return submitOrganizer(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function sendOrganizerNotification(emailData, settings) {
  if (!resendClient) return;

  // Determine recipient
  const recipient = settings.send_all_to_same 
    ? settings.global_email 
    : settings.venue_partner_email;

  const subject = `Miss Club Model SA: New Venue Application - ${emailData.venue_name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c9a84c;">🏛️ New Venue Application Received</h2>
      <p><strong>Name:</strong> ${emailData.full_name}</p>
      <p><strong>Email:</strong> ${emailData.email}</p>
      <p><strong>Phone:</strong> ${emailData.phone || 'N/A'}</p>
      <p><strong>Venue:</strong> ${emailData.venue_name}</p>
      <p><strong>Location:</strong> ${emailData.venue_location}</p>
      <p><strong>Submitted:</strong> ${new Date(emailData.created_at).toLocaleString()}</p>
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
    console.log('Organizer notification sent to:', recipient);
  } catch (error) {
    console.error('Failed to send organizer notification:', error.message);
  }
}

async function submitOrganizer(req, res) {
  try {
    const body = req.body;

    // Validate required fields
    if (!body.full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!body.email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!body.venue_name) {
      return res.status(400).json({ error: 'Venue name is required' });
    }
    if (!body.venue_location) {
      return res.status(400).json({ error: 'Venue location is required' });
    }
    if (!body.terms_accepted) {
      return res.status(400).json({ error: 'Please accept the terms and conditions' });
    }

    const { data, error } = await supabase
      .from('event_organizers')
      .insert([{
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        venue_name: body.venue_name,
        venue_location: body.venue_location,
        venue_address: body.venue_address,
        website_url: body.website_url,
        venue_description: body.venue_description,
        capacity: body.capacity,
        equipment: body.equipment,
        availability: body.availability,
        terms_accepted: body.terms_accepted === 'on' || body.terms_accepted === true,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Get email settings
    const settings = await getEmailSettings();

    // Send notification email to admin (async)
    sendOrganizerNotification({
      full_name: body.full_name,
      email: body.email,
      phone: body.phone,
      venue_name: body.venue_name,
      venue_location: body.venue_location,
      created_at: new Date().toISOString()
    }, settings).catch(err => console.error('Email send error:', err));

    return res.status(201).json({
      status: 'success',
      message: 'Thank you for your interest! Our team will review your venue application and get back to you within 3-5 business days.',
      data: data
    });
  } catch (error) {
    console.error('Submit organizer error:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = handler;