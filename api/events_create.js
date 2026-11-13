const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function handleCreateEvent(req, res) {
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

    const { data, error } = await supabase
      .from('events')
      .insert([{
        name: body.name || 'Untitled Event',
        event_date: body.date || new Date().toISOString().split('T')[0],
        event_time: body.time,
        location: body.location,
        description: body.description,
        poster_url: posterUrl,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      status: 'success',
      data: data
    });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = handler;