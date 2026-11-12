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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return submitEventInterest(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function sendUserConfirmationEmail(emailData) {
  if (!resendClient) return;

  const subject = `📬 You're on the list for ${emailData.event_name}!`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c9a84c;">🎭 Thanks for Your Interest!</h2>
      <p><strong>Dear ${emailData.full_name || 'Friend'},</strong></p>
      <p>You've been added to the mailing list for <strong>${emailData.event_name}</strong>.</p>
      <p>We'll keep you updated on:</p>
      <ul>
        <li>📅 Event timing and schedule</li>
        <li>🎫 Ticket release dates and pricing</li>
        <li>🎯 Candidate announcements${emailData.favorite_candidate ? ` (including ${emailData.favorite_candidate})` : ''}</li>
        <li>📍 Venue details and directions</li>
      </ul>
      <p>If you have any questions, feel free to reach out.</p>
      <hr style="border-color: #c9a84c;">
      <p><a href="https://missclubmodel.vercel.app" style="background: #c9a84c; color: #0a0a0a; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Visit Miss Club Model SA</a></p>
    </div>
  `;

  try {
    await resendClient.emails.send({
      from: 'Miss Club Model SA <noreply@missclubmodelsa.co.za>',
      to: emailData.email,
      subject,
      html,
    });
    console.log('Event interest confirmation sent to:', emailData.email);
  } catch (error) {
    console.error('Failed to send confirmation email:', error.message);
  }
}

async function sendAdminNotification(emailData, settings) {
  if (!resendClient) return;

  // Determine recipient
  const recipient = settings.send_all_to_same 
    ? settings.global_email 
    : settings.event_registration_email;

  const subject = `Miss Club Model SA: New Event Interest - ${emailData.event_name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c9a84c;">📬 New Event Interest Subscription</h2>
      <p><strong>Event:</strong> ${emailData.event_name}</p>
      <p><strong>Name:</strong> ${emailData.full_name || 'Not provided'}</p>
      <p><strong>Email:</strong> ${emailData.email}</p>
      <p><strong>Phone:</strong> ${emailData.phone || 'Not provided'}</p>
      <p><strong>Favorite Candidate:</strong> ${emailData.favorite_candidate || 'Not specified'}</p>
      <p><strong>Subscribed:</strong> ${new Date().toLocaleString()}</p>
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
    console.log('Event interest admin notification sent to:', recipient);
  } catch (error) {
    console.error('Failed to send admin notification:', error.message);
  }
}

async function submitEventInterest(req, res) {
  try {
    const body = req.body;

    // Validate required fields
    if (!body.event_id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }
    if (!body.email) {
      return res.status(400).json({ error: 'Email is required' });
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

    // Insert into event_interest_subscriptions
    const { data, error } = await supabase
      .from('event_interest_subscriptions')
      .upsert([{
        event_id: body.event_id,
        email: body.email,
        phone: body.phone,
        favorite_candidate: body.favorite_candidate,
        status: 'active'
      }], { 
        onConflict: 'event_id,email',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate
      if (error.code === '23505') {
        return res.status(409).json({ 
          status: 'success', 
          message: 'You\'re already on the list for this event!',
          data: null
        });
      }
      throw error;
    }

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
      message: 'You\'re on the list! We\'ll keep you updated on event timing, tickets, and more.',
      data: data
    });
  } catch (error) {
    console.error('Submit event interest error:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = handler;