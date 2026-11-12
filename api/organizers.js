const { createClient } = require('@supabase/supabase-js');
const Resend = require('resend');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

// Load settings from JSON file (allows admin to change admin email via dashboard)
const settingsFile = path.join(__dirname, '..', 'settings.json');
let adminEmail = 'admin@missclubmodelsa.co.za';
try {
  if (fs.existsSync(settingsFile)) {
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    adminEmail = settings.admin_email || 'admin@missclubmodelsa.co.za';
  }
} catch (e) {
  adminEmail = process.env.ADMIN_EMAIL || 'admin@missclubmodelsa.co.za';
}

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
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
    return submitOrganizer(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function sendOrganizerNotification(emailData) {
  if (!resendClient) return;

  const subject = `Miss Club Model SA: New Venue Application - ${emailData.venue_name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
      <h2>🏛️ New Venue Application Received</h2>
      <p><strong>Name:</strong> ${emailData.full_name}</p>
      <p><strong>Email:</strong> ${emailData.email}</p>
      <p><strong>Phone:</strong> ${emailData.phone || 'N/A'}</p>
      <p><strong>Venue:</strong> ${emailData.venue_name}</p>
      <p><strong>Location:</strong> ${emailData.venue_location}</p>
      <p><strong>Submitted:</strong> ${new Date(emailData.created_at).toLocaleString()}</p>
      <hr>
      <p><a href="https://missclubmodel.vercel.app/admin" style="background: #c9a84c; color: #0a0a0a; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View in Admin Dashboard</a></p>
    </div>
  `;

  try {
    await resendClient.emails.send({
      from: 'Miss Club Model SA <noreply@missclubmodelsa.co.za>',
      to: adminEmail,
      subject,
      html,
    });
    console.log('Organizer notification sent to:', adminEmail);
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

    // Send notification email to admin (async)
    sendOrganizerNotification({
      full_name: body.full_name,
      email: body.email,
      phone: body.phone,
      venue_name: body.venue_name,
      venue_location: body.venue_location,
      created_at: new Date().toISOString()
    }).catch(err => console.error('Email send error:', err));

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