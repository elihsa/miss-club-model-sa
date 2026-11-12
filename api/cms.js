export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfyDuaZ3UGKmMCNsKGYwG0oqfADQJMcNnrWkt0qYjhjTuNWL0LTGpWM-WORdoz10AW7P1_QxJNW2G_/pub?gid=1299416052&single=true&output=csv';

  try {
    const response = await fetch(CSV_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`);
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    const content = {};
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split(',');
      if (key && valueParts.length) {
        // Remove quotes from CSV values
        content[key.trim()] = valueParts.join(',').trim().replace(/^"|"$/g, '');
      }
    });
    
    return res.status(200).json({ 
      status: 'success', 
      content 
    });
    
  } catch (err) {
    console.error('CMS fetch error:', err);
    return res.status(500).json({ 
      status: 'error', 
      message: err.message 
    });
  }
}