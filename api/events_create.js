const { createClient } = require('@supabase/supabase-js');
const Busboy = require('busboy');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { setCors } = require('./cors');

// Alternative event creation endpoint (SPEC Section 6).
// Accepts either:
//  - application/json  { name, date, time, location, description, status, poster { name, ... } }
//  - multipart/form-data with a poster file field
// Mirrors /api/events POST behaviour but is a standalone entry point.

const BUSBOY_MAX = 25 * 1024 * 1024;

function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    return createFromJson(req, res);
  }
  return createFromMultipart(req, res);
}

function buildEventData(body) {
  return {
    name: body.name || 'Untitled Event',
    event_date: body.date || body.event_date || new Date().toISOString().split('T')[0],
    event_time: body.time || body.event_time,
    location: body.location,
    description: body.description,
    status: body.status || 'pending',
    created_at: new Date().toISOString()
  };
}

async function createFromJson(req, res) {
  try {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    return await insertEvent(body, res);
  } catch (err) {
    console.error('JSON parse error:', err);
    return res.status(400).json({ status: 'error', message: 'Invalid JSON body' });
  }
}

function createFromMultipart(req, res) {
  const busboy = Busboy({ headers: req.headers, limits: { fileSize: BUSBOY_MAX } });
  const fields = {};
  let posterBuffer = null;
  let posterName = null;
  let posterMime = null;
  let handled = false;
  let posterError = null;

  busboy.on('field', (fieldname, val) => {
    fields[fieldname] = val;
  });

  busboy.on('file', (fieldname, file, info) => {
    if (fieldname !== 'poster' && fieldname !== 'poster_file') {
      file.resume();
      return;
    }
    const chunks = [];
    file.on('data', (c) => chunks.push(c));
    file.on('limit', () => { posterError = 'Poster file exceeds 25MB limit'; });
    file.on('end', () => {
      if (posterError) return;
      posterBuffer = Buffer.concat(chunks);
      posterName = info.filename;
      posterMime = info.mimeType;
    });
  });

  busboy.on('finish', async () => {
    if (handled) return;
    handled = true;
    if (posterError) return res.status(400).json({ status: 'error', message: posterError });

    let posterUrl = null;
    try {
      if (posterBuffer && posterName) {
        const clean = posterName.replace(/[^\w.\-]+/g, '_');
        const path = `posters/${Date.now()}-${clean}`;
        const { error } = await supabase.storage
          .from('events')
          .upload(path, posterBuffer, { contentType: posterMime, cacheControl: '3600', upsert: false });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('events').getPublicUrl(path);
        posterUrl = urlData.publicUrl;
      }
    } catch (err) {
      return res.status(500).json({ status: 'error', message: 'Poster upload failed: ' + err.message });
    }

    const data = buildEventData(fields);
    data.poster_url = posterUrl;
    return await insertEvent(data, res);
  });

  busboy.on('error', (err) => {
    if (handled) return;
    handled = true;
    return res.status(400).json({ status: 'error', message: err.message });
  });

  req.pipe(busboy);
}

async function insertEvent(eventData, res) {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      // Handle missing status column gracefully
      if (error.message && error.message.includes('status')) {
        const noStatus = { ...eventData };
        delete noStatus.status;
        const { data: d, error: e2 } = await supabase.from('events').insert([noStatus]).select().single();
        if (e2) throw e2;
        return res.status(201).json({ status: 'success', data: d });
      }
      throw error;
    }

    return res.status(201).json({ status: 'success', data });
  } catch (err) {
    console.error('Create event error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

module.exports = handler;
