const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ekvwgxnryasrvltyukvj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const sqlStatements = [
  // 1. Create applications table
  `CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    dob DATE,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    province TEXT,
    height INT,
    occupation TEXT,
    education TEXT,
    instagram TEXT,
    platform TEXT NOT NULL,
    essay TEXT NOT NULL,
    talent TEXT,
    headshot_url TEXT,
    fullbody_url TEXT,
    video_url TEXT,
    emergency_name TEXT,
    emergency_phone TEXT,
    terms BOOLEAN DEFAULT FALSE,
    media_release BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 2. Enable RLS
  `ALTER TABLE applications ENABLE ROW LEVEL SECURITY;`,

  // 3. Policy: Allow anonymous inserts
  `DROP POLICY IF EXISTS "Allow anon insert" ON applications;`,
  `CREATE POLICY "Allow anon insert" ON applications
    FOR INSERT TO anon WITH CHECK (true);`,

  // 4. Policy: Allow authenticated reads
  `DROP POLICY IF EXISTS "Allow authenticated read" ON applications;`,
  `CREATE POLICY "Allow authenticated read" ON applications
    FOR SELECT TO authenticated USING (true);`,

  // 5. Create storage bucket for videos
  `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES ('videos', 'videos', true, 52428800, ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png'])
   ON CONFLICT (id) DO UPDATE SET
     public = EXCLUDED.public,
     file_size_limit = EXCLUDED.file_size_limit,
     allowed_mime_types = EXCLUDED.allowed_mime_types;`,

  // 6. Storage policies
  `DROP POLICY IF EXISTS "Public read videos" ON storage.objects;`,
  `CREATE POLICY "Public read videos" ON storage.objects
    FOR SELECT USING (bucket_id = 'videos');`,

  `DROP POLICY IF EXISTS "Anon upload videos" ON storage.objects;`,
  `CREATE POLICY "Anon upload videos" ON storage.objects
    FOR INSERT TO anon WITH CHECK (bucket_id = 'videos');`,

  `DROP POLICY IF EXISTS "Auth manage videos" ON storage.objects;`,
  `CREATE POLICY "Auth manage videos" ON storage.objects
    FOR ALL TO authenticated USING (bucket_id = 'videos');`
];

async function executeSQL(sql) {
  // Use the Supabase REST API to execute raw SQL via a temporary function
  // Since exec_sql doesn't exist, we'll use the Management API approach
  // Actually, let's use the Supabase client's rpc with a custom function
  // Or we can use the REST API directly with the service role key
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL failed: ${response.status} - ${text}`);
  }
  return response.text();
}

async function setup() {
  console.log('Setting up Supabase...');
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    try {
      console.log(`Executing statement ${i + 1}/${sqlStatements.length}...`);
      await executeSQL(sql);
      console.log('✓ Success');
    } catch (err) {
      console.error(`✗ Failed: ${err.message}`);
      // Continue with other statements
    }
  }
  
  console.log('Setup complete!');
  
  // Verify table exists
  try {
    const { data, error } = await supabase.from('applications').select('*').limit(1);
    if (error) throw error;
    console.log('✓ Applications table verified');
  } catch (err) {
    console.error('✗ Table verification failed:', err.message);
  }
  
  // Verify storage bucket
  try {
    const { data, error } = await supabase.storage.getBucket('videos');
    if (error) throw error;
    console.log('✓ Videos bucket verified');
  } catch (err) {
    console.error('✗ Bucket verification failed:', err.message);
  }
}

setup().catch(console.error);