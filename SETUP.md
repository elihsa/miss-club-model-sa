# Miss Club Model SA - Setup Guide

## 1. Google Sheets Setup (Form Backend)

### Step 1: Prepare the Sheet
Your Google Sheet: https://docs.google.com/spreadsheets/d/1r7oPr48fPE4Q-RWOaXfh-ObgY_TqwCNFIDCgaEKxd8k

**Create a "Setup" tab and run this to add headers:**

1. In your Google Sheet, create a new tab named `Setup`
2. Extensions > Apps Script
3. Delete any existing code, paste the function below, save as `Setup.gs`
4. Select `setupSheet` function and click Run
5. Authorize when prompted (you may need to go through Advanced > Go to script)

```javascript
function setupSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const headers = [
    'fullName', 'dob', 'email', 'phone', 'address', 'city', 'province',
    'height', 'occupation', 'education', 'instagram', 'platform', 'essay',
    'talent', 'headshot', 'fullbody', 'video', 'emergencyName', 'emergencyPhone',
    'terms', 'mediaRelease', 'submittedAt'
  ];
  
  // Clear existing content
  sheet.clear();
  
  // Add headers to row 1
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#c9a84c').setFontColor('#0a0a0a');
  
  SpreadsheetApp.getUi().alert('Sheet setup complete! Headers added to: ' + sheet.getName());
}
```

### Step 2: Deploy Apps Script Web App

1. In Apps Script, create a new file named `Code.gs`
2. Delete any default code and paste the contents of `Code.gs` from this project
3. Click **Deploy** > **New deployment**
4. Select type: **Web app**
5. Configure:
   - **Execute as**: Me
   - **Who has access**: Anyone
6. Click **Deploy**
7. Copy the web app URL (it looks like: `https://script.google.com/macros/s/AKfycbx.../exec`)
8. Paste this URL into `index.html` where it says `YOUR_SCRIPT_ID`

### Step 3: Test the Submission

1. Open the deployed Vercel site: https://missclubmodel.vercel.app
2. Fill out the application form
3. Submit and check your Google Sheet for the new row

**Important**: The site is currently behind Vercel Authentication. To make it public:
- Go to https://vercel.com/elis-projects-12db6277/missclubmodel/settings/deployment-protection
- Disable "Vercel Authentication"

## 2. Google Sheets CMS (Content Management)

### Option A: Simple Published Sheet (Easiest)

1. In your Google Sheet, create a new tab named `Content`
2. Add columns: `key`, `value`
3. Add rows like:
   | key | value |
   |-----|-------|
   | eventDate | 15 March 2026 |
   | eventVenue | Sun City, South Africa |
   | ticketInfo | R250 per person |
   | contactEmail | contact@missclubmodelsa.co.za |
   | contactPhone | +27 XX XXX XXXX |
   | officeAddress | Johannesburg, South Africa |

4. File > Share > Publish to web
5. Select the `Content` tab
6. Publish as CSV
7. Copy the CSV URL
8. In `index.html`, replace the `GOOGLE_SHEET_CSV_URL` with your CSV link
9. Uncomment `loadCMSContent();` at the bottom of the script

### Option B: Vercel API Function (More Robust)

If you want private content management:

1. Set up a Google Cloud project and service account
2. Share the sheet with the service account email
3. Create `/api/cms.js` in your Vercel project
4. Deploy with `vercel --prod`

Contact me if you want me to set up Option B.

## 3. Domain Setup

### Namecheap (Recommended)

1. Buy your domain at https://www.namecheap.com (e.g., `missclubmodelsa.co.za` or `missclubmodelsa.com`)
2. In Vercel dashboard: Project > Settings > Domains
3. Add your custom domain
4. Vercel will give you nameservers or IP addresses
5. In Namecheap: Domain > DNS/NAMESERVERS
   - If using nameservers: Point to Vercel's nameservers
   - If using A records: Point to Vercel's IPs

### Alternative: Use Vercel Subdomain

For now, your site is live at: **https://missclubmodel.vercel.app**

## 4. File Upload Notes

**Current file upload method**: Base64 encoding via Google Apps Script.

**Limits**:
- Images: Max ~5MB recommended (resized client-side to 1200px)
- Videos: Max ~10MB recommended (Apps Script payload limit is ~50MB, base64 adds 33% overhead)
- Files are saved to Google Drive automatically

**For larger files** (videos > 10MB):
- Option 1: Use Cloudinary free tier (25GB storage) - requires account setup
- Option 2: Have applicants upload to Google Drive and paste the shareable link
- Option 3: Use a dedicated video hosting service

## 5. Next Steps

1. [ ] Complete Google Apps Script setup (Steps 1-3 above)
2. [ ] Disable Vercel Authentication in dashboard
3. [ ] Test form submission end-to-end
4. [ ] Set up domain (Namecheap)
5. [ ] Configure CMS (Option A recommended for simplicity)
6. [ ] Add real content (event details, candidate photos, etc.)

## Quick Test Commands

```bash
# Test the deployed site
curl https://missclubmodel.vercel.app | head -20

# Test Apps Script health
curl https://YOUR_SCRIPT_ID/exec

# Deploy updates
cd /home/eli/Downloads/missclubmodel && vercel --prod
```
