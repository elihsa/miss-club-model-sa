const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return getEvents(req, res);
  }

  if (req.method === 'POST') {
    return createEvent(req, res);
  }

  if (req.method === 'PUT') {
    return updateEvent(req, res);
  }

  if (req.method === 'DELETE') {
    return deleteEvent(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getEvents(req, res) {
  try {
    // Public API - only show launched events
    // Admin panel can pass ?admin=true to see all events
    const isAdmin = req.query.admin === 'true';
    
    let query = supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    
    if (!isAdmin) {
      query = query.eq('status', 'launched');
    }
    
    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function createEvent(req, res) {
  try {
    const body = req.body;

    let posterUrl = null;
    if (body.poster) {
      const { data, error } = await supabase.storage
        .from('events')
        .upload(`posters/${Date.now()}-${body.poster.name}`, body.poster, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('events')
        .getPublicUrl(`posters/${Date.now()}-${body.poster.name}`);

      posterUrl = urlData.publicUrl;
    }

    // Build event object, only include status if column exists
    const eventData = {
      name: body.name || 'Untitled Event',
      event_date: body.date || new Date().toISOString().split('T')[0],
      event_time: body.time,
      location: body.location,
      description: body.description,
      poster_url: posterUrl,
      created_at: new Date().toISOString()
    };

    // Only add status if the column exists (check by trying to insert)
    // For now, we'll include it and let Supabase handle it - if column missing, it will error
    // and we'll strip it on retry
    eventData.status = body.status || 'pending';

    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      // If status column doesn't exist, retry without it
      if (error.message && error.message.includes('status')) {
        const eventDataNoStatus = {
          name: body.name || 'Untitled Event',
          event_date: body.date || new Date().toISOString().split('T')[0],
          event_time: body.time,
          location: body.location,
          description: body.description,
          poster_url: posterUrl,
          created_at: new Date().toISOString()
        };
        const { data: d, error: e2 } = await supabase.from('events').insert([eventDataNoStatus]).select().single();
        if (e2) throw e2;
        return res.status(201).json({
          status: 'success',
          data: d
        });
      }
      throw error;
    }

    return res.status(201).json({
      status: 'success',
      data: data
    });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function updateEvent(req, res) {
  try {
    const { id } = req.query;
    const body = req.body;

    if (body.poster) {
      if (body.old_poster_url) {
        const oldFileName = body.old_poster_url.split('/').pop();
        await supabase.storage.from('events').remove([`posters/${oldFileName}`]);
      }

      const { data, error } = await supabase.storage
        .from('events')
        .upload(`posters/${Date.now()}-${body.poster.name}`, body.poster, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('events')
        .getPublicUrl(`posters/${Date.now()}-${body.poster.name}`);

      body.poster_url = urlData.publicUrl;
    }

    // Build update data, only include status field if present
    const updateData = {
      name: body.name,
      event_date: body.date,
      event_time: body.time,
      location: body.location,
      description: body.description,
      poster_url: body.poster_url
    };

    // Only add status if it's provided and not undefined
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // If status column doesn't exist, retry without it
      if (error.message && error.message.includes('status')) {
        const updateDataNoStatus = {
          name: body.name,
          event_date: body.date,
          event_time: body.time,
          location: body.location,
          description: body.description,
          poster_url: body.poster_url
        };
        const { data: d, error: e2 } = await supabase.from('events').update(updateDataNoStatus).eq('id', id).select().single();
        if (e2) throw e2;
        return res.status(200).json({
          status: 'success',
          data: d
        });
      }
      throw error;
    }

    return res.status(200).json({
      status: 'success',
      data: data
    });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function deleteEvent(req, res) {
  try {
    const { id } = req.query;

    const { data: event } = await supabase
      .from('events')
      .select('poster_url')
      .eq('id', id)
      .single();

    if (event?.poster_url) {
      const fileName = event.poster_url.split('/').pop();
      await supabase.storage.from('events').remove([`posters/${fileName}`]);
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({
      status: 'success',
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = handler;