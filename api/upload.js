const Busboy = require('busboy');
const { createClient } = require('@supabase/supabase-js');
const { requireAdmin } = require('./_auth');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // File uploads write to storage with the service key - require admin auth.
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const bb = Busboy({ headers: req.headers });
  const fields = {};
  let fileData = null;
  let fileName = null;
  let filePath = null;
  let fileEncoding = null;
  let fileMimeType = null;

  bb.on('field', (fieldname, val) => {
    fields[fieldname] = val;
  });

  bb.on('file', (fieldname, file, info) => {
    const { filename, encoding, mimeType } = info;
    fileName = filename;
    fileEncoding = encoding;
    fileMimeType = mimeType;
    filePath = fields.path || 'uploads';

    const chunks = [];
    file.on('data', (data) => chunks.push(data));
    file.on('end', () => {
      fileData = Buffer.concat(chunks);
    });
  });

  bb.on('close', async () => {
    try {
      if (!fileData) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const uploadPath = `${filePath}/${Date.now()}-${fileName}`;

      const { data, error } = await supabase.storage
        .from('videos')
        .upload(uploadPath, fileData, {
          contentType: fileMimeType && fileMimeType !== 'application/octet-stream' ? fileMimeType : getMimeType(fileName),
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(uploadPath);

      return res.status(200).json({
        status: 'success',
        url: urlData.publicUrl,
        path: uploadPath
      });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  req.pipe(bb);
}

function getMimeType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = handler;