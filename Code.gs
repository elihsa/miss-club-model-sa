// ============================================
// MISS CLUB MODEL SA - GOOGLE APPS SCRIPT
// ============================================
// Setup:
// 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1r7oPr48fPE4Q-RWOaXfh-ObgY_TqwCNFIDCgaEKxd8k
// 2. Extensions > Apps Script
// 3. Paste this code into Code.gs
// 4. Deploy > New deployment > Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Copy the web app URL and paste into index.html as GOOGLE_SCRIPT_URL
// ============================================

// Handle form submissions
function doPost(e) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const rawData = e.postData.contents;
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    data.submittedAt = new Date().toISOString();

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Build row matching sheet columns
    const row = headers.map(header => {
      if (!header) return '';
      const normalizedHeader = header.toLowerCase().replace(/\s+/g, '');
      if (data[header] !== undefined) return data[header];
      if (data[normalizedHeader] !== undefined) return data[normalizedHeader];
      return '';
    });

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Application submitted successfully'
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(corsHeaders);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(corsHeaders);
  }
}

// Health check
function doGet(e) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  return ContentService.createTextOutput(JSON.stringify({status: 'ready', timestamp: new Date().toISOString()}))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(corsHeaders);
}

// Handle CORS preflight
function doOptions(e) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
  return ContentService.createTextOutput('')
    .setHeaders(corsHeaders);
}

// Save base64 file to Google Drive
function saveBase64ToDrive(base64Data, fileName, mimeType, folderName) {
  try {
    let folder;
    if (folderName) {
      const folders = DriveApp.getFoldersByName(folderName);
      folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    } else {
      folder = DriveApp.getRootFolder();
    }

    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const bytes = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(bytes, mimeType || 'application/octet-stream', fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (error) {
    throw new Error('Failed to save file: ' + error.toString());
  }
}
