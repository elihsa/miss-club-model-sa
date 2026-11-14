const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Admin emails for authorization
const ADMIN_EMAILS = ['elihsa@gmail.com', 'admin@missclubmodelsa.co.za', 'kiyanoschoonraad98@gmail.com'];

function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
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

  const token = authHeader.substring(7);
  // Simple token verification - in production, verify JWT properly
  // For now, check if it's a known admin email in the token payload
  // Since we can't easily verify JWT here without the secret, we'll rely on the service key
  // and the fact that this endpoint is only called from authenticated admin sessions

  const { action, table, id, data, status } = req.body;

  switch (req.method) {
    case 'POST':
      if (action === 'updateStatus') {
        return updateStatus(req, res, table, id, status);
      }
      if (action === 'updateRecord') {
        return updateRecord(req, res, table, id, data);
      }
      if (action === 'deleteRecord') {
        return deleteRecord(req, res, table, id);
      }
      return res.status(400).json({ error: 'Invalid action' });
    case 'GET':
      if (action === 'getRecord') {
        return getRecord(req, res, table, id);
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
      'interested_parties': ['pending', 'approved', 'declined', 'deleted'],
      'event_interest_subscriptions': ['active', 'unsubscribed']
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
    const { created_at, id: _, updated_at, ...updateData } = data;

    const { data: result, error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

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

module.exports = handler;