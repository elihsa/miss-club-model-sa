# DEPLOY GOOGLE APPS SCRIPT - Step by Step

## 1. Open the Google Sheet
Go to: https://docs.google.com/spreadsheets/d/1r7oPr48fPE4Q-RWOaXfh-ObgY_TqwCNFIDCgaEKxd8k

## 2. Open Apps Script
- Click **Extensions** → **Apps Script**
- This opens script.google.com with a new project bound to your sheet

## 3. Replace Default Code
- Delete ANY existing code in `Code.gs`
- Copy the ENTIRE contents of `/home/eli/Downloads/missclubmodel/Code.gs`
- Paste into the Apps Script editor
- Click **Save** (💾 icon) → Name it "Miss Club Model SA"

## 4. Run Setup Function (One-time)
- In the Apps Script toolbar, select **setupSheet** from the function dropdown
- Click **Run** (▶️)
- **Authorize** when prompted:
  - Click "Continue"
  - Select your Google account
  - Click "Advanced" → "Go to Miss Club Model SA (unsafe)"
  - Click "Allow"
- You should see: "Sheet setup complete! Headers added to: Sheet1"

## 5. Deploy as Web App
- Click **Deploy** (top right) → **New deployment**
- Click the gear icon ⚙️ → Select **Web app**
- Configure:
  - **Description:** "Miss Club Model SA Form Handler"
  - **Execute as:** **Me** (your account)
  - **Who has access:** **Anyone** (critical for CORS)
- Click **Deploy**
- **Authorize** again if prompted (same flow as above)

## 6. COPY THE WEB APP URL
It will look like: `https://script.google.com/macros/s/AKfycbx.../exec`
**COPY THIS URL** - you'll need it for the next step

## 7. Update index.html
Replace line 471 in `/home/eli/Downloads/missclubmodel/index.html`:
```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```
With your actual URL:
```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx.../exec';
```

## 8. Deploy to Vercel
```bash
cd /home/eli/Downloads/missclubmodel
vercel --prod
```

## 9. Disable Vercel Authentication
Go to: https://vercel.com/elis-projects-12db6277/missclubmodel/settings/deployment-protection
- Turn **OFF** "Vercel Authentication"
- Save

## 10. Test Form Submission
1. Visit https://missclubmodel.vercel.app
2. Scroll to "Candidate Application" section
3. Fill in test data (use a real email to verify)
3. Upload small test images (<1MB each)
4. Click "Submit Application"
5. Check for "✓ Application submitted successfully!"
6. Check Google Sheet for new row
7. Check Google Drive for uploaded files (folder: "Miss Club Model SA Applications")

---

## QUICK TEST COMMANDS

```bash
# Test Apps Script health endpoint
curl https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Should return: {"status":"ready","timestamp":"2026-..."}

# Test Vercel deployment
curl -I https://missclubmodel.vercel.app

# Deploy updates
cd /home/eli/Downloads/missclubmodel && vercel --prod
```

---

## TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| "Script function not found: doPost" | Ensure Code.gs has doPost function, save, redeploy |
| CORS error in browser console | Ensure "Who has access" = "Anyone" in Web App settings |
| "Failed to save file" | Check Drive quota, ensure Apps Script has Drive permission |
| Form submits but no sheet row | Check Apps Script execution log: Extensions > Apps Script > Executions |
| Vercel Authentication blocks | Disable in Vercel dashboard (step 9) |