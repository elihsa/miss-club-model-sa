export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfyDuaZ3UGKmMCNsKGYwG0oqfADQJMcNnrWkt0qYjhjTuNWL0LTGpWM-WORdoz10AW7P1_QxJNW2G_/pub?gid=1299416052&single=true&output=csv';

  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status}`);

    const text = await response.text();
    const content = parseCSV(text);

    return res.status(200).json({ status: 'success', content });
  } catch (err) {
    console.error('CMS fetch error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return {};

  const content = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split only on FIRST comma: key is first column, rest is value
    const firstComma = line.indexOf(',');
    if (firstComma === -1) continue;

    const key = line.substring(0, firstComma).trim();
    let value = line.substring(firstComma + 1).trim();

    // Remove trailing empty columns (,,,,)
    value = value.replace(/,+$/, '').trim();

    // Remove surrounding quotes if present
    value = value.replace(/^"|"$/g, '');

    if (key) content[key] = value;
  }
  return content;
}