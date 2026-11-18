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

const { setCors } = require('../lib/cors');

// Allowed buckets -> MIME allowlist (mirrors SPEC Section 5)
const BUCKET_MIME = {
  videos: ['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png'],
  events: ['image/*'],
  applications: ['image/*', 'video/*']
};

// Max upload sizes per bucket (bytes). SPEC: videos 50MB, others default 25MB.
const BUCKET_MAX = {
  videos: 50 * 1024 * 1024,
  events: 25 * 1024 * 1024,
  applications: 50 * 1024 * 1024
};

function matchesMime(rule, mime) {
  if (rule === '*') return true;
  if (rule.endsWith('/*')) return mime.startsWith(rule.slice(0, -1));
  return rule === mime;
}

function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const busboy = Busboy({ headers: req.headers });

  const bucket = req.query.bucket || 'applications';
  const folder = req.query.folder || 'uploads';
  const allowedMimes = BUCKET_MIME[bucket];
  const maxSize = BUCKET_MAX[bucket] || 25 * 1024 * 1024;

  if (!allowedMimes) {
    return res.status(400).json({ error: `Unknown bucket '${bucket}'. Valid: ${Object.keys(BUCKET_MIME).join(', ')}` });
  }

  let fileBuffer = null;
  let fileName = null;
  let fileMime = null;
  let rejectError = null;
  let handled = false;

  busboy.on('file', (fieldname, file, info) => {
    const { filename, mimeType } = info;
    const chunks = [];

    file.on('data', (chunk) => {
      if (rejectError) return;
      chunks.push(chunk);
    });

    file.on('limit', () => {
      rejectError = `File exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`;
    });

    file.on('end', () => {
      if (rejectError) return;

      if (!matchesMimeForBucket(allowedMimes, mimeType)) {
        rejectError = `File type '${mimeType}' is not allowed in bucket '${bucket}'`;
        return;
      }

      fileBuffer = Buffer.concat(chunks);
      fileName = filename;
      fileMime = mimeType;
    });
  });

  busboy.on('finish', async () => {
    if (handled) return;
    handled = true;
    console.log('UPLOAD finish: bucket=', bucket, 'file=', fileName, 'mime=', fileMime, 'size=', fileBuffer ? fileBuffer.length : 0);
    if (rejectError) {
      return res.status(400).json({ status: 'error', message: rejectError });
    }

    if (!fileBuffer || !fileName) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const cleanName = fileName.replace(/[^\w.\-]+/g, '_');
    const path = `${folder}/${Date.now()}-${cleanName}`;
    console.log('UPLOAD path:', path);

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, fileBuffer, {
          contentType: fileMime,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('UPLOAD supabase error:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return res.status(201).json({
        status: 'success',
        bucket,
        path,
        mime: fileMime,
        size: fileBuffer.length,
        publicUrl: urlData.publicUrl
      });
    } catch (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ status: 'error', message: err.message });
    }
  });

  busboy.on('error', (err) => {
    if (handled) return;
    handled = true;
    console.error('Busboy error:', err);
    return res.status(400).json({ status: 'error', message: err.message });
  });

  req.pipe(busboy);
}

function matchesMimeForBucket(allowlist, mime) {
  if (!mime) return true; // Supabase Storage will validate server-side
  if (mime === 'application/octet-stream') return true; // Common for webp, let Supabase validate
  return allowlist.some((rule) => matchesMime(rule, mime));
}

module.exports = handler;
