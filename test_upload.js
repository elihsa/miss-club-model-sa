const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ekvwgxnryasrvltyukvj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ePDDXlwk-BhljlqNhink-w_ZEzsJ6ZR';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create a small test file
const testContent = 'test video content';
const testFile = new Blob([testContent], { type: 'video/mp4' });
const file = new File([testFile], 'test-video.mp4', { type: 'video/mp4' });

async function testUpload() {
  const timestamp = Date.now();
  const filePath = `applications/${timestamp}-test-video.mp4`;
  
  console.log('Uploading to:', filePath);
  
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('Upload error:', error);
    return;
  }
  
  console.log('Upload success:', data);
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('videos')
    .getPublicUrl(filePath);
  
  console.log('Public URL:', urlData.publicUrl);
  
  // Test download
  const response = await fetch(urlData.publicUrl);
  console.log('Download status:', response.status);
}

testUpload();
