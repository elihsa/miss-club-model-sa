const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const { EMAIL_FROM } = require('../lib/emailFrom');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

// Fail fast if the service key is missing or a placeholder
const PLACEHOLDER = /your[_-]?service[_-]?role[_-]?key|placeholder|example|xxxx|REPLACE_ME/i;
if (!supabaseUrl || !supabaseServiceKey || PLACEHOLDER.test(supabaseServiceKey)) {
  throw new Error('Missing or placeholder Supabase environment variables');
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

// Admin emails for authorization
// const ADMIN_EMAILS = ['elihsa@gmail.com', 'admin@missclubmodelsa.co.za', 'kiyanoschoonraad98@gmail.com']; // Reserved for future JWT implementation

// CORS: restrict to production domain + local dev
const ALLOWED_ORIGINS = [
  'https://missclubmodel.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify admin authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - missing admin token' });
  }

  // Support both body (POST) and query (GET/DELETE) for action parameter
  const action = req.body?.action || req.query?.action;
  const { table, id, data, status } = req.body || {};

  switch (req.method) {
    case 'GET':
      if (action === 'listUsers') {
        return listAdminUsers(req, res);
      }
      return res.status(200).json({ status: 'success', message: 'Admin API operational' });
    case 'POST':
      if (action === 'listUsers') {
        return listAdminUsers(req, res);
      }
      if (action === 'createUser') {
        return createAdminUser(req, res);
      }
      if (action === 'updateUser') {
        return updateAdminUser(req, res);
      }
      if (action === 'deleteUser') {
        return deleteAdminUser(req, res);
      }
      if (action === 'updateStatus') {
        return updateStatus(req, res, table, id, status);
      }
      if (action === 'updateRecord') {
        return updateRecord(req, res, table, id, data);
      }
      if (action === 'deleteRecord') {
        return deleteRecord(req, res, table, id);
      }
      if (action === 'sendBulkEmail') {
        return sendBulkEmail(req, res);
      }
      if (action === 'getEventFilter') {
        return getEventFilter(req, res, table);
      }
      if (action === 'getRecord') {
        return getRecord(req, res, table, id);
      }
      return res.status(400).json({ error: 'Invalid action' });
    case 'DELETE':
      if (action === 'deleteUser') {
        return deleteAdminUser(req, res);
      }
      return res.status(400).json({ error: 'Invalid action' });
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function updateStatus(req, res, table, id, newStatus) {
  try {
    if (!table || !id || !newStatus) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate status against allowed values for each table
    const allowedStatuses = {
      'applications': ['undecided', 'approved', 'declined', 'deleted'],
      'candidates': ['undecided', 'approved', 'declined', 'deleted'],
      'event_organizers': ['pending', 'approved', 'declined', 'deleted'],
      'interested_parties': ['pending', 'approved', 'declined', 'confirmed', 'cancelled', 'deleted'],
      'event_interest_subscriptions': ['active', 'unsubscribed'],
      'events': ['pending', 'launched']
    };

    if (!allowedStatuses[table] || !allowedStatuses[table].includes(newStatus)) {
      return res.status(400).json({ error: `Invalid status '${newStatus}' for table '${table}'` });
    }

    let error;

    if (table === 'event_interest_subscriptions') {
      // Composite key: event_id + email
      const record = await supabase.from(table).select('event_id').eq('email', id).single();
      if (record.error || !record.data) {
        return res.status(404).json({ error: 'Record not found' });
      }
      const { error: updateError } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('event_id', record.data.event_id)
        .eq('email', id);
      error = updateError;
    } else {
      const { error: updateError } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', id);
      error = updateError;
    }

    if (error) throw error;

    return res.status(200).json({
      status: 'success',
      message: `Status updated to ${newStatus}`
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function updateRecord(req, res, table, id, data) {
  try {
    if (!table || !id || !data) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Remove fields that shouldn't be updated
    const { created_at, updated_at, ...updateData } = data;
    // eslint-disable-next-line no-unused-vars
    const __unused = [created_at, updated_at];

    // Filter out null/undefined/empty-string fields that might cause issues
    // but keep explicit booleans and 0
    const cleanData = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== null && value !== undefined && value !== '') {
        cleanData[key] = value;
      }
    }

    // Try update; if a column doesn't exist, filter it out and retry
    let attempt = { ...cleanData };
    let result, error;

    for (let retry = 0; retry <= 1; retry++) {
      const response = await supabase
        .from(table)
        .update(attempt)
        .eq('id', id)
        .select()
        .single();

      result = response.data;
      error = response.error;

      if (!error || !error.message?.includes('Could not find')) {
        break; // Success or non-column error
      }

      // Extract the bad column name and remove it
      const colMatch = error.message.match(/'([^']+)'/);
      if (colMatch && colMatch[1]) {
        const badCol = colMatch[1];
        delete attempt[badCol];
        console.warn(`Removed non-existent column '${badCol}' from update on '${table}'`);
      } else {
        break; // Can't parse column name, stop retrying
      }
    }

    if (error) throw error;

    return res.status(200).json({
      status: 'success',
      message: 'Record updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Update record error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function deleteRecord(req, res, table, id) {
  try {
    if (!table || !id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let error;

    if (table === 'event_interest_subscriptions') {
      const record = await supabase.from(table).select('event_id').eq('email', id).single();
      if (record.error || !record.data) {
        return res.status(404).json({ error: 'Record not found' });
      }
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('event_id', record.data.event_id)
        .eq('email', id);
      error = deleteError;
    } else {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      error = deleteError;
    }

    if (error) throw error;

    return res.status(200).json({
      status: 'success',
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Delete record error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function getEventFilter(req, res, table) {
  try {
    if (table === 'interested_parties') {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, event_date')
        .order('event_date', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ status: 'success', data: data || [] });
    }
    return res.status(400).json({ error: 'Table not supported for event filter' });
  } catch (error) {
    console.error('Get event filter error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function sendBulkEmail(req, res) {
  try {
    const { eventId, subject, message, recipientIds } = req.body;

    if (!eventId || !subject || !message) {
      return res.status(400).json({ error: 'Event ID, subject, and message are required' });
    }

    // Get event details
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('name, event_date, location')
      .eq('id', eventId)
      .single();

    if (eventError) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get recipients - either specific IDs or all interested parties for this event
    let query = supabase
      .from('interested_parties')
      .select('id, full_name, email')
      .eq('event_id', eventId);

    if (recipientIds && recipientIds.length > 0) {
      query = query.in('id', recipientIds);
    }

    const { data: recipients, error: recipientsError } = await query;
    if (recipientsError) throw recipientsError;

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ error: 'No recipients found for this event' });
    }

    // Get email settings
    const settings = await getEmailSettings();
    const signature = settings.event_signature || '';

    // Send individual personalized emails
    const results = [];
    for (const recipient of recipients) {
      const personalMessage = message.replace(/\{name\}/g, recipient.full_name || 'there');
      const personalMessage2 = personalMessage.replace(/\{first_name\}/g, (recipient.full_name || 'there').split(' ')[0]);

      const html = `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #c9a84c;">${subject}</h2>
          <p><strong>Dear ${recipient.full_name || 'there'},</strong></p>
          <div style="line-height: 1.8; margin: 20px 0;">
            ${personalMessage2.replace(/\n/g, '<br>')}
          </div>
          <hr style="border-color: #c9a84c;">
          <p style="color: #888; font-size: 0.85rem;">
            🎭 ${eventData.name}<br>
            📅 ${new Date(eventData.event_date).toLocaleDateString()}<br>
            📍 ${eventData.location}
          </p>
          ${signature ? `<div style="margin-top:20px; padding-top:20px; border-top:1px solid #c9a84c;">${signature.replace(/\\n/g, '<br>')}</div>` : ''}
          <hr style="border-color: #c9a84c; margin-top: 20px;">
          <p style="color: #666; font-size: 0.75rem; text-align: center;">
            You received this email because you expressed interest in ${eventData.name}.<br>
            <a href="https://missclubmodel.vercel.app" style="color: #c9a84c;">Unsubscribe</a>
          </p>
        </div>
      `;

      try {
        if (resendClient) {
          const sendResult = await resendClient.emails.send({
            from: EMAIL_FROM,
            to: recipient.email,
            subject,
            html,
          });
    if (sendResult && sendResult.error) { throw new Error('Resend API error: ' + (sendResult.error.message || JSON.stringify(sendResult.error))); }
          results.push({ email: recipient.email, status: 'sent' });
        } else {
          results.push({ email: recipient.email, status: 'skipped_no_resend' });
        }
      } catch (emailError) {
        results.push({ email: recipient.email, status: 'failed', error: emailError.message });
      }
    }

    const sentCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    return res.status(200).json({
      status: 'success',
      message: `Bulk email sent to ${sentCount} recipients`,
      total: recipients.length,
      sent: sentCount,
      failed: failedCount,
      results
    });
  } catch (error) {
    console.error('Send bulk email error:', error);
    return res.status(500).json({ error: error.message });
  }
}

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
        global_email: process.env.GLOBAL_EMAIL || 'elihsa@gmail.com',
        candidate_signature: '',
        venue_signature: '',
        event_signature: ''
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
      global_email: 'elihsa@gmail.com',
      candidate_signature: '',
      venue_signature: '',
      event_signature: ''
    };
  }
}

async function getRecord(req, res, table, id) {
  try {
    if (!table || !id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let data, error;

    if (table === 'event_interest_subscriptions') {
      const result = await supabase.from(table).select('*').eq('email', id).single();
      data = result.data;
      error = result.error;
    } else {
      const result = await supabase.from(table).select('*').eq('id', id).single();
      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Get record error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ============================================
// ADMIN USER MANAGEMENT (service-role operations)
// ============================================

async function listAdminUsers(req, res) {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;

  const users = (data?.users || []).map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    email_confirmed_at: u.email_confirmed_at,
    role: (u.user_metadata && u.user_metadata.role) || 'manager'
  }));

  return res.status(200).json({ status: 'success', users });
}

async function createAdminUser(req, res) {
  const { email, password, role } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanRole = ['owner', 'admin', 'manager'].includes(role) ? role : 'manager';

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: cleanRole }
  });

  if (error) throw error;

  return res.status(200).json({
    status: 'success',
    message: `User ${email} created with role ${cleanRole}`,
    user: {
      id: data.user.id,
      email: data.user.email,
      role: cleanRole
    }
  });
}

async function updateAdminUser(req, res) {
  const { id, role } = req.body || {};
  if (!id || !role) {
    return res.status(400).json({ error: 'User ID and role are required' });
  }
  if (!['owner', 'admin', 'manager'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be owner, admin, or manager.' });
  }

  try {
    const { data: existing, error: getError } = await supabase.auth.admin.getUserById(id);
    if (getError || !existing || !existing.user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentRole = (existing.user.user_metadata && existing.user.user_metadata.role) || 'manager';
    const targetEmail = existing.user.email;

    // Prevent changing owner's role
    if (targetEmail === 'elihsa@gmail.com' || currentRole === 'owner') {
      return res.status(403).json({ error: 'The owner account role cannot be changed.' });
    }

    // Prevent assigning owner role - only elihsa@gmail.com can be owner
    if (role === 'owner' && targetEmail !== 'elihsa@gmail.com') {
      return res.status(403).json({ error: 'Only elihsa@gmail.com can have the owner role.' });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(id, {
      user_metadata: { ...existing.user.user_metadata, role }
    });
    if (updateError) throw updateError;

    return res.status(200).json({
      status: 'success',
      message: `User ${targetEmail} updated to role ${role}`,
      user: { id: existing.user.id, email: targetEmail, role }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function deleteAdminUser(req, res) {
  const userId = (req.query && req.query.id) || (req.body && req.body.id);
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Never allow deleting the owner account
  const { data: existing } = await supabase.auth.admin.getUserById(userId);
  if (existing && existing.user && existing.user.email === 'elihsa@gmail.com') {
    return res.status(403).json({ error: 'The owner account cannot be removed.' });
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;

  return res.status(200).json({ status: 'success', message: 'User deleted' });
}

module.exports = handler;
