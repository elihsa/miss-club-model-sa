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
    return submitApplication(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function sendAdminNotification(emailData, settings) {
  if (!resendClient) return;

  // Determine recipient
  const recipient = settings.send_all_to_same 
    ? settings.global_email 
    : settings.candidate_application_email;

  const subject = `Miss Club Model SA: New Candidate Application - ${emailData.full_name}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c9a84c;">👑 New Candidate Application Received</h2>
      <p><strong>Name:</strong> ${emailData.full_name}</p>
      <p><strong>Email:</strong> ${emailData.email}</p>
      <p><strong>Phone:</strong> ${emailData.phone || 'N/A'}</p>
      <p><strong>Event:</strong> ${emailData.event_name || 'General Application'}</p>
      <p><strong>Platform:</strong> ${emailData.platform || 'N/A'}</p>
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
    console.log('Candidate application notification sent to:', recipient);
  } catch (error) {
    console.error('Failed to send admin notification:', error.message);
  }
}

async function sendUserConfirmationEmail(emailData) {
  if (!resendClient) return;

  const subject = `👑 Application Received - Miss Club Model SA`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c9a84c;">🎭 Application Confirmed!</h2>
      <p><strong>Dear ${emailData.full_name},</strong></p>
      <p>Thank you for applying to <strong>Miss Club Model SA</strong>!</p>
      <p>We've received your application${emailData.event_name ? ` for <strong>${emailData.event_name}</strong>` : ''}.</p>
      <p>Our team will review your submission and contact you within 5-7 business days.</p>
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
    console.log('User confirmation email sent to:', emailData.email);
  } catch (error) {
    console.error('Failed to send user confirmation email:', error.message);
  }
}

async function submitApplication(req, res) {
  try {
    const data = req.body;
    
    // Add timestamp
    data.created_at = new Date().toISOString();
    // Default status for new applications
    data.status = 'undecided';

    // Convert camelCase to snake_case for database
    function toSnakeCase(obj) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        result[snakeKey] = value;
      }
      return result;
    }

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

    // Get email settings
    const settings = await getEmailSettings();

    // Get event name if event_id provided
    let eventName = null;
    if (data.event_id) {
      const { data: eventData } = await supabase
        .from('events')
        .select('name')
        .eq('id', data.event_id)
        .single();
      eventName = eventData?.name;
    }

    // Send admin notification (async)
    sendAdminNotification({
      full_name: data.fullName || data.full_name,
      email: data.email,
      phone: data.phone,
      event_name: eventName,
      platform: data.platform,
      created_at: data.created_at
    }, settings).catch(err => console.error('Admin email error:', err));

    // Send user confirmation (async)
    sendUserConfirmationEmail({
      full_name: data.fullName || data.full_name,
      email: data.email,
      event_name: eventName
    }).catch(err => console.error('User email error:', err));

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
}

module.exports = handler;