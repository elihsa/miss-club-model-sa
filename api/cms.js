export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  const keyIndex = headers.indexOf('key');
  const valueIndex = headers.indexOf('value');

  if (keyIndex === -1 || valueIndex === -1) {
    // Fallback: assume first column is key, second is value
    return parseSimpleCSV(lines);
  }

  const content = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const key = cols[keyIndex]?.trim();
    const value = cols[valueIndex]?.trim();
    if (key && value !== undefined) {
      content[key] = value;
    }
  }
  return content;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseSimpleCSV(lines) {
  const content = {};
  lines.forEach(line => {
    const [key, ...valueParts] = line.split(',');
    if (key && valueParts.length) {
      content[key.trim()] = valueParts.join(',').trim().replace(/^"|"$/g, '');
    }
  });
  return content;
}