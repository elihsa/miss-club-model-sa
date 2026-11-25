// POST /api/contact - public Contact page form.
// Sends one email. Recipient comes from the existing Admin > Email Settings record
// (site_settings key email_settings): global_email when "send all to same" is on,
// otherwise contact_email. Falls back to CONTACT_RECIPIENT_EMAIL, then to
// elihsa@gmail.com (approved by Eli for now, same default the other forms use).
// Nothing is stored in the database.
const { setCors } = require('../lib/cors');
const { EMAIL_FROM } = require('../lib/emailFrom');

const SUBJECTS = {
  general: 'General Inquiry',
  application: 'Application Question',
  venue: 'Venue Partnership',
  media: 'Media Partnership',
  other: 'Other'
};
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Real mailer is created lazily so tests can inject a stub and never reach Resend.
let mailer = null;
let settingsGetter = null;
function getMailer() {
  if (mailer) return mailer;
  if (!process.env.RESEND_API_KEY) return null;
  const { Resend } = require('resend');
  const client = new Resend(process.env.RESEND_API_KEY);
  return { send: (msg) => client.emails.send(msg) };
}

// Returns the email_settings object, or null when the record genuinely does not exist
// (legacy site). Any read error THROWS so the caller can fail closed.
async function getSettings() {
  if (settingsGetter) return settingsGetter();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) throw new Error('settings store not configured');
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await sb.from('site_settings').select('value').eq('key', 'email_settings').maybeSingle();
  if (error) throw new Error(error.message || 'settings read failed');
  if (!data) return null;
  return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
}

const isEmail = (v) => EMAIL_RE.test(String(v || '').trim());

// Never guesses when a recipient IS configured: a configured but invalid address, or a
// failed read, returns { error } and the caller sends nothing. The approved default is used
// only when the record or the new field is genuinely absent.
async function resolveRecipient() {
  let settings;
  try { settings = await getSettings(); } catch (e) {
    console.error('Contact settings read failed:', e.message);
    return { error: 'unavailable' };
  }
  const fallback = [process.env.CONTACT_RECIPIENT_EMAIL, 'elihsa@gmail.com'].find(isEmail);
  if (!settings) return { to: fallback.trim() };
  if (settings.send_all_to_same) {
    return isEmail(settings.global_email) ? { to: settings.global_email.trim() } : { error: 'misconfigured' };
  }
  const c = settings.contact_email;
  if (c === undefined || c === null || String(c).trim() === '') return { to: fallback.trim() };
  return isEmail(c) ? { to: String(c).trim() } : { error: 'misconfigured' };
}

async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  const body = req.body || {};
  // Honeypot: real visitors never fill this hidden field. Pretend success, send nothing.
  if (body.website) return res.status(200).json({ status: 'success', message: 'Message sent' });

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const subjectKey = Object.prototype.hasOwnProperty.call(SUBJECTS, body.subject) ? body.subject : 'general';
  const message = String(body.message || '').trim();

  if (!name || name.length > 120) return res.status(400).json({ status: 'error', message: 'Please enter your name' });
  if (!EMAIL_RE.test(email) || email.length > 200) return res.status(400).json({ status: 'error', message: 'Please enter a valid email address' });
  if (!message || message.length > 5000) return res.status(400).json({ status: 'error', message: 'Please enter a message (max 5000 characters)' });

  const rec = await resolveRecipient();
  if (rec.error) {
    return res.status(503).json({ status: 'error', message: 'Your message could not be sent right now. Please try again in a few minutes.' });
  }
  const to = rec.to;
  const m = getMailer();
  if (!m) {
    return res.status(503).json({ status: 'error', message: 'The contact form is not available yet. Please try again later.' });
  }

  try {
    const result = await m.send({
      from: EMAIL_FROM,
      to,
      replyTo: email,
      subject: `[Contact] ${SUBJECTS[subjectKey]} from ${name.replace(/[\r\n]+/g, ' ')}`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h3>New contact message</h3>
        <p><strong>Name:</strong> ${esc(name)}<br><strong>Email:</strong> ${esc(email)}<br><strong>Subject:</strong> ${esc(SUBJECTS[subjectKey])}</p>
        <p style="white-space: pre-wrap;">${esc(message)}</p></div>`
    });
    if (result && result.error) throw new Error(result.error.message || 'send failed');
    return res.status(200).json({ status: 'success', message: 'Message sent. Thank you, we will get back to you.' });
  } catch (err) {
    console.error('Contact send error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Sorry, your message could not be sent. Please try again.' });
  }
}

module.exports = handler;
module.exports._setMailer = (m) => { mailer = m; };
module.exports._setSettings = (fn) => { settingsGetter = fn; };
