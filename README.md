# Miss Club Model SA - Functional User Guide

**Last Updated:** 2026-11-14  
**Build Number:** 1.0.0  
**Version:** Production v1.0  

---

## Table of Contents

1. [Introduction](#introduction)
2. [Site Overview](#site-overview)
3. [Admin Panel Guide](#admin-panel-guide)
4. [Event Management](#event-management)
5. [Candidate Management](#candidate-management)
6. [Venue Partner Management](#venue-partner-management)
7. [Event Registrations](#event-registrations)
8. [Bulk Email System](#bulk-email-system)
9. [Email Settings & Signatures](#email-settings--signatures)
10. [Site Customization](#site-customization)
11. [CMS Content Management](#cms-content-management)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

This document describes **every function** of the Miss Club Model SA website, how to use each feature, and how changes in one area affect other parts of the system.

**Target Audience:** Administrators, Event Organizers, Content Managers

**Prerequisites:**
- Access to admin panel (`/admin.html`)
- Google account with edit access to the CMS Google Sheet
- Supabase project access (for advanced users)

---

## Site Overview

### Architecture

```
Frontend (HTML/CSS/JS) → Vercel Hosting
       ↓
API Routes (/api/*.js) → Vercel Serverless Functions
       ↓
Backend Services:
  - Supabase (Database + Storage + Auth)
  - Resend (Email Delivery)
  - Google Sheets (CMS Content)
```

### Key Pages

| Page | URL | Purpose |
|------|-----|---------|
| Homepage | `/` | Candidate applications, venue partner signups, event listings |
| Events | `/events.html` | Detailed event listings with registration |
| Admin Panel | `/admin.html` | Full site management (password protected) |
| Terms | `/terms.html` | Legal terms & conditions |
| Privacy | `/privacy.html` | Privacy policy |

### Color Scheme (Customizable)

- **Primary Gold:** `#c9a84c`
- **Gold Light:** `#f0d878`
- **Gold Dark:** `#8b6914`
- **Black:** `#0a0a0a`
- **Dark:** `#1a1a1a`
- **Cream:** `#f5f0e8`

> **Note:** Colors are defined as CSS variables in each HTML file's `<style>` block. Changing these values updates the entire site's theme.

### Typography

- **Headings:** Playfair Display (serif)
- **Body Text:** Inter (sans-serif)
- **Buttons:** Playfair Display

Loaded via Google Fonts CDN in each page's `<head>`.

---

## Admin Panel Guide

### Access

**URL:** `https://missclubmodel.vercel.app/admin.html`

**Authentication:** Currently open (no password). To add authentication:
1. See "Security" section in Specification Document
2. Implement Supabase Auth or custom token verification

### Dashboard Layout

The admin panel has **tabs** for each data table:

1. **Analytics** - Summary statistics
2. **Candidates** - All candidate applications
3. **Venues** - Venue partner submissions
4. **Events** - Event creation and management
5. **Event Registrations** - People who registered for events
6. **Event Interest** - Waitlist subscribers
7. **Email Settings** - Configure email recipients and signatures
8. **Media Settings** - Manage image/video uploads
9. **Style Builder** - (Future) Customize colors/fonts

### Navigation

- Click tab buttons to switch views
- Use **Search** box to filter records by any field
- Use **Status** dropdown to filter by approval status
- Use **Sort** dropdown to change ordering
- Click **Columns** button to show/hide table columns

---

## Event Management

### Creating an Event

**Location:** Admin Panel → Events tab → "+ Create Event" button

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Event Name | Text | Yes | Full event name (e.g., "Miss Club Model SA Gala 2026") |
| Event Date | Date | Yes | When the event occurs |
| Event Time | Time | No | Start time (optional) |
| Location | Text | Yes | Venue name and address |
| Description | Textarea | No | Event details, schedule, highlights |
| Poster Image URL | URL | No | Link to event poster image |
| **Status** | Dropdown | Yes | **pending** (hidden) or **launched** (visible on site) |

**Status Field Behavior:**

- **pending:** Event is in design phase. NOT visible on public site, NOT selectable in application forms.
- **launched:** Event is live. Appears on `/events.html` page and in dropdown menus on application forms.

> **Impact:** Changing an event from `pending` → `launched` immediately makes it visible to the public and available for registrations.

### Editing an Event

**Steps:**
1. Go to Admin → Events tab
2. Find the event in the table
3. Click **Edit** button in action column
4. Modify fields
5. Click **Save Changes**

**Effects of Editing:**
- Changes appear immediately on `/events.html`
- Updates event details in registration confirmation emails
- If you change the date/time, existing registrants are NOT automatically notified (send bulk email to inform them)

### Deleting an Event

**Steps:**
1. Go to Admin → Events tab
2. Find the event
3. Click **Delete** button
4. Confirm deletion

**Restrictions:**
- Cannot delete events with status `launched` (must change to `pending` first)
- **Warning:** Deleting an event removes it from the database. Existing registrations remain in `interested_parties` table but reference a non-existent event.

> **Best Practice:** Instead of deleting, change status to `pending` to hide it from the public site.

---

## Candidate Management

### Viewing Candidates

**Location:** Admin → Candidates tab

**Default Columns:**
- Name
- Email
- Phone
- Age
- Event (selected event)
- Status
- Created Date

### Configuring Columns

**Steps:**
1. Click **Columns** button (top-right of table)
2. Modal opens showing all available fields
3. Check/uncheck fields to show/hide
4. Drag-and-drop to reorder columns
5. Click **Save**

**Persistence:** Column preferences are saved in browser's `localStorage`. Each admin user has their own settings.

**Available Fields:**
- full_name, email, phone_number, age, event_id, essay, website_url, instagram_handle, facebook_handle, tiktok_handle, availability, headshot_url, fullbody_url, video_url, status, created_at

### Viewing Candidate Details

**Steps:**
1. Find candidate in table
2. Click **View** button

**Detail Modal Shows:**
- ALL fields submitted by candidate (not just visible columns)
- Photos (headshot, full-body) as clickable thumbnails
- Video player for introduction video
- Social media links as clickable URLs
- Status badge with color coding

### Editing Candidate Status

**Steps:**
1. Find candidate in table
2. Click **Approve** / **Decline** / **Delete** button

**Status Options:**
- **undecided** (default, gray badge)
- **approved** (green badge)
- **declined** (red badge)
- **deleted** (orange badge)

> **Impact:** Changing status does NOT send email to candidate. Use bulk email system if you want to notify them.

### Editing Candidate Information

**Steps:**
1. Click **Edit** button on candidate row
2. Modify any field
3. Click **Save**

**Retry Logic:** If you try to edit a field that doesn't exist in the database schema (e.g., `age` was removed), the system automatically removes that field and retries the update. You won't see an error.

---

## Venue Partner Management

### Viewing Venues

**Location:** Admin → Venues tab

Same column configuration and viewing behavior as Candidates.

### Venue Status Options

- **pending** (awaiting review)
- **approved** (partnership confirmed)
- **declined** (not selected)
- **deleted** (removed from system)

### Venue Confirmation Email

When a venue submits the form:
1. Admin receives notification email
2. Venue receives confirmation email with:
   - Their submission details
   - Venue-specific signature (configured in Email Settings)
   - Link to admin dashboard

---

## Event Registrations

### Viewing Registrations

**Location:** Admin → Event Registrations tab

**Fields:**
- Full Name
- Email
- Phone Number
- Event (dropdown of launched events)
- Favorite Candidate (optional)
- Message (optional text from registrant)
- Status
- Created Date

### Status Options

- **pending** (default, awaiting review)
- **approved** (entry granted)
- **declined** (entry denied)
- **confirmed** (finalized attendance)
- **cancelled** (withdrawn by attendee)

> **Impact:** Changing status does NOT send email. Use bulk email to notify registrants of approval/decline.

### Filtering by Event

**Steps:**
1. Go to Event Registrations tab
2. Use **Search** box to find by name/email
3. Or use bulk email modal to filter by event (see below)

---

## Bulk Email System

### Access

**Location:** Admin → Event Registrations tab → "📧 Compose Email" button

**Purpose:** Send personalized emails to all (or selected) registrants for a specific event.

### Step-by-Step Usage

#### 1. Select Event

- Dropdown shows all events from database
- Select the event whose registrants you want to email

#### 2. Select Recipients

- Checkboxes appear for each registrant
- **Select All** button checks all visible recipients
- **Deselect All** button unchecks all
- Live counter shows "X of Y selected"
- Cancelled registrations are disabled (grayed out)

#### 3. Compose Email

**Subject Line:**
- Free text input
- Supports placeholders:
  - `{name}` → Recipient's full name
  - `{event_name}` → Selected event name

**Message Body:**
- Rich-text WYSIWYG editor
- **Toolbar Buttons:**
  - **B** - Bold
  - **I** - Italic
  - **U** - Underline
  - **H3** - Heading 3
  - **¶** - Paragraph
  - **≡** - Bullet list
  - **1.** - Numbered list
  - **❝** - Blockquote
  - **🖼** - Insert image (upload from computer)
  - **🔗** - Insert link
  - **A▼** - Text color (Gold, Cream, White, Red, Green, Blue, Orange)
  - **Highlight▼** - Background color (Gold, Black, Dark Gray, Green, Blue)

**Live Preview Panel:**
- Shows how email will look for first selected recipient
- Updates in real-time as you type
- Demonstrates `{name}` placeholder replacement

#### 4. Personalization

Placeholders are automatically replaced when sending:

| Placeholder | Replaced With |
|-------------|---------------|
| `{name}` | Recipient's full name (e.g., "Kiyan Ochoonraad") |
| `{first_name}` | First name only (e.g., "Kiyan") |
| `{event_name}` | Selected event name |

**Example:**
```
Subject: Update about {event_name}
Body: Dear {name},

We're excited to see you at {event_name}!

Best regards,
{first_name}
```

Becomes:
```
Subject: Update about Miss Club Model SA Gala 2026
Body: Dear Kiyan Ochoonraad,

We're excited to see you at Miss Club Model SA Gala 2026!

Best regards,
Kiyan
```

#### 5. Send

- Click **📧 Send to Selected** button
- Confirmation dialog appears: "Send email to X recipient(s)?"
- Click OK to proceed
- System sends individual emails via Resend
- Results shown:
  - ✅ "Email sent to X recipient(s)"
  - ⚠️ "Y failed: [error details]" (if any)

### Email Template Structure

Every bulk email includes:

1. **Subject line** (as composed)
2. **Personalized greeting** ("Dear [Name],")
3. **Message body** (rich text, with placeholders replaced)
4. **Event details block** (auto-appended):
   ```
   🎭 [Event Name]
   📅 [Date]
   📍 [Location]
   ```
5. **Event signature** (from Email Settings panel)
6. **Unsubscribe footer** (auto-appended):
   ```
   You received this email because you expressed interest in [Event Name].
   Unsubscribe [link to homepage]
   ```

> **Note:** Unsubscribe link currently goes to homepage. To implement true unsubscribe, see "Future Enhancements" in Specification Document.

---

## Email Settings & Signatures

### Access

**Location:** Admin → Email Settings tab

### Configuration Fields

| Field | Purpose | Example |
|-------|---------|---------|
| Candidate Application Email | Where candidate submissions are sent | `candidates@missclubmodelsa.co.za` |
| Venue Partner Email | Where venue submissions are sent | `venues@missclubmodelsa.co.za` |
| Event Registration Email | Where event registrations are sent | `events@missclubmodelsa.co.za` |
| Send All to Same | Toggle to use one email for all | Checkbox |
| Global Email | Single email if above toggle is on | `admin@missclubmodelsa.co.za` |
| **Candidate Signature** | Appended to candidate confirmation emails | "Best regards,<br>Miss Club Model SA Team" |
| **Venue Signature** | Appended to venue confirmation emails | "Partnership Team<br>Miss Club Model SA" |
| **Event Signature** | Appended to event registration confirmations AND bulk emails | "Events Team<br>Miss Club Model SA" |

### How Signatures Work

When a user submits a form:

1. **Candidate Application:**
   - User receives confirmation email
   - Email includes their submission details
   - **Candidate Signature** appended below gold divider

2. **Venue Partner:**
   - User receives confirmation email
   - Email includes their submission details
   - **Venue Signature** appended below gold divider

3. **Event Registration:**
   - User receives confirmation email
   - Email includes event details
   - **Event Signature** appended below gold divider

4. **Bulk Email:**
   - Sent to event registrants
   - **Event Signature** appended below gold divider

### Editing Signatures

**Steps:**
1. Go to Email Settings tab
2. Scroll to signature textareas
3. Edit text (HTML allowed: `<br>`, `<strong>`, `<em>`, etc.)
4. Click **Save Settings**

**Effects:**
- Changes apply immediately to all future emails
- Past emails are NOT updated (they were sent with old signature)

---

## Site Customization

### Changing Site Name

**Location:** Admin → Email Settings tab → "Site Name" field

**Steps:**
1. Go to Email Settings tab
2. Find "Site Name" field
3. Enter new name (e.g., "Mr. Club Joberg")
4. Click **Save Settings**

**Effects (Automatic):**
- Page title (`<title>`) updates on all pages
- Logo text in navigation bar updates
- Admin button text updates (e.g., "Admin - Mr. Club Joberg")
- Email sender name updates (e.g., "Mr. Club Joberg <noreply@...>")
- Footer text updates (if using `data-cms-key="footerText"`)

> **Propagation Delay:** Changes take ~5 seconds to appear on already-loaded pages (due to `setInterval` polling). Refresh page to see immediately.

### Changing Colors

**Location:** Edit HTML files directly (not in admin panel yet)

**Files to Edit:**
- `index.html` (lines 11-36)
- `events.html` (lines 11-36)
- `admin.html` (lines 11-36)

**CSS Variables to Change:**
```css
:root {
  --gold: #c9a84c;        /* Primary gold */
  --gold-light: #f0d878;  /* Light gold */
  --gold-dark: #8b6914;   /* Dark gold */
  --black: #0a0a0a;       /* Background black */
  --dark: #1a1a1a;        /* Dark gray */
  --cream: #f5f0e8;       /* Text cream */
}
```

**Steps:**
1. Open HTML file in code editor
2. Find `:root` block in `<style>` section
3. Change hex values
4. Save and deploy (`npx vercel --prod --force`)

**Effects:**
- All buttons, headings, borders, badges update to new colors
- Site maintains consistent theme across all pages

> **Future:** Style Builder tab will provide UI for this without code editing.

---

## CMS Content Management

### What is CMS?

The CMS (Content Management System) uses a **Google Sheet** to manage text content across the site.

**Published Google Sheet CSV URL:** (configured in `/api/cms.js`)

### How It Works

1. Edit text in Google Sheet
2. Publish Sheet to web (File → Share → Publish to web → CSV)
3. Copy published CSV URL
4. Update `/api/cms.js` with new URL (or keep same if URL doesn't change)
5. Frontend fetches CSV via `/api/cms` endpoint
6. Text updates on site within 5 minutes (Vercel cache)

### CMS Keys

Each text element on the site has a `data-cms-key` attribute:

```html
<p data-cms-key="heroTagline">Your Legacy Begins Here</p>
```

**Common Keys:**

| Key | Location | Example Value |
|-----|----------|---------------|
| `navLogo` | Navigation bar logo text | "Miss Club Model SA" |
| `heroTagline` | Hero section tagline | "Your Legacy Begins Here" |
| `heroMission` | Hero section mission statement | Long text about pageant |
| `aboutTitle` | About section title | "About Miss Club Model SA" |
| `aboutSubtitle` | About section subtitle | "More than a beauty pageant..." |
| `aboutText1`, `aboutText2` | About section paragraphs | Descriptive text |
| `visionTitle`, `visionText` | Vision box content | Vision statement |
| `galleryTitle`, `gallerySubtitle` | Gallery section headers | "The Experience" |
| `eventsTitle`, `eventsSubtitle` | Events section headers | "Upcoming Events" |
| `candidatesTitle`, `candidatesSubtitle` | Candidates section headers | "Meet Our Candidates" |
| `footerText` | Footer copyright text | "© 2026 Miss Club Model SA" |
| `textTerms`, `textPrivacyPolicy` | Legal checkbox labels | "I agree to Terms & Conditions" |
| `labelHeadshot`, `labelFullbody`, `labelVideo` | Form field labels | "Headshot Photo *" |
| `placeholderEssay` | Essay field placeholder | "Tell us what makes you..." |

### Updating CMS Content

**Steps:**
1. Open Google Sheet (CMS)
2. Find the row with the key you want to change
3. Edit the "value" column
4. Save Sheet
5. Re-publish to web (File → Share → Publish to web → CSV)
   - If already published, click "Stop publishing" then "Publish" again to refresh
6. Wait 1-5 minutes for Vercel cache to expire
7. Refresh website to see changes

> **Important:** The site fetches from the **published CSV URL**, not the editable Sheet. You MUST re-publish after changes.

### Legal Links (Dynamic)

The CMS stores legal text as plain text (no HTML). The frontend automatically wraps phrases like "Terms & Conditions" and "Privacy Policy" with clickable `<a>` anchors.

**Example:**
- CMS value: "I agree to the Terms & Conditions and Privacy Policy"
- Frontend displays: "I agree to the [Terms & Conditions](/terms.html) and [Privacy Policy](/privacy.html)"

This is done via JavaScript regex replacement in `index.html` and `events.html` CMS loading functions.

---

## Troubleshooting

### Common Issues

#### 1. "Error updating record: Could not find the 'X' column"

**Cause:** Database schema doesn't have the column you're trying to edit.

**Solution:**
- System automatically retries without that column
- If error persists, check Supabase table schema
- Remove the column from admin panel's column config

#### 2. "Status update failed: violates check constraint"

**Cause:** Trying to set invalid status for a table (e.g., "approved" for `event_interest_subscriptions` which only allows "active"/"unsubscribed").

**Solution:**
- Use correct status values for each table:
  - `event_interest_subscriptions`: `active`, `unsubscribed`
  - `interested_parties`: `pending`, `approved`, `declined`, `confirmed`, `cancelled`
  - `applications`: `undecided`, `approved`, `declined`, `deleted`

#### 3. CMS changes not appearing

**Cause:** Google Sheet not re-published, or Vercel cache not expired.

**Solution:**
1. Re-publish Google Sheet to CSV
2. Wait 5 minutes
3. Hard refresh browser (Ctrl+Shift+R)
4. Check browser console for CORS errors

#### 4. Emails not sending

**Cause:** Missing `RESEND_API_KEY` environment variable on Vercel.

**Solution:**
1. Go to Vercel Dashboard → Project → Environment Variables
2. Add `RESEND_API_KEY` with your Resend API key
3. Redeploy site
4. Test by submitting a form

#### 5. Bulk email modal not loading events

**Cause:** Events table empty, or API endpoint error.

**Solution:**
1. Check Admin → Events tab for events
2. Ensure at least one event exists
3. Check browser console for API errors
4. Verify `/api/admin` endpoint is deployed

#### 6. "Create Event" button not visible

**Cause:** Button only appears on Events tab.

**Solution:**
- Click "Events" tab in admin panel
- Button appears in top-right toolbar

#### 7. Columns not saving after refresh

**Cause:** Browser `localStorage` cleared or different browser used.

**Solution:**
- Column config is per-browser
- Re-configure columns in each browser/device
- Future enhancement: save to user profile in database

---

## Appendix A: Database Tables

### `applications`

Candidate application submissions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| full_name | TEXT | Candidate's name |
| email | TEXT | Contact email |
| phone_number | TEXT | Phone number |
| age | TEXT | Age (optional) |
| event_id | UUID | Selected event (references `events.id`) |
| essay | TEXT | "Why should you win?" response |
| website_url | TEXT | Personal website |
| instagram_handle | TEXT | Instagram username |
| facebook_handle | TEXT | Facebook username |
| tiktok_handle | TEXT | TikTok username |
| availability | TEXT | Availability dates/times |
| headshot_url | TEXT | Supabase Storage URL |
| fullbody_url | TEXT | Supabase Storage URL |
| video_url | TEXT | Supabase Storage URL |
| status | TEXT | undecided/approved/declined/deleted |
| created_at | TIMESTAMP | Submission timestamp |

### `events`

Event definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Event name |
| event_date | DATE | Event date |
| event_time | TIME | Event time (optional) |
| location | TEXT | Venue location |
| description | TEXT | Event description |
| poster_url | TEXT | Poster image URL |
| status | TEXT | **pending** (hidden) or **launched** (visible) |
| created_at | TIMESTAMP | Creation timestamp |

### `interested_parties`

Event registrations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| full_name | TEXT | Registrant name |
| email | TEXT | Contact email |
| phone_number | TEXT | Phone number |
| event_id | UUID | Selected event (references `events.id`) |
| favorite_candidate | TEXT | Favorite candidate name (optional) |
| message | TEXT | Optional message from registrant |
| status | TEXT | pending/approved/declined/confirmed/cancelled |
| created_at | TIMESTAMP | Registration timestamp |

### `event_organizers`

Venue partner submissions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| venue_name | TEXT | Venue/business name |
| contact_name | TEXT | Contact person name |
| email | TEXT | Contact email |
| phone | TEXT | Contact phone |
| website_url | TEXT | Venue website |
| location | TEXT | Venue address |
| availability | TEXT | Available dates |
| message | TEXT | Optional message |
| status | TEXT | pending/approved/declined/deleted |
| created_at | TIMESTAMP | Submission timestamp |

### `event_interest_subscriptions`

Waitlist subscribers (composite key: event_id + email).

| Column | Type | Description |
|--------|------|-------------|
| event_id | UUID | Event reference |
| email | TEXT | Subscriber email |
| status | TEXT | **active** or **unsubscribed** |
| created_at | TIMESTAMP | Subscription timestamp |

### `site_settings`

Configuration settings (stored as JSON in `value` column).

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT | Settings key (e.g., "email_settings") |
| value | JSONB | Settings object |
| description | TEXT | Description |
| updated_at | TIMESTAMP | Last update timestamp |

**Email Settings Structure:**
```json
{
  "candidate_application_email": "candidates@...",
  "venue_partner_email": "venues@...",
  "event_registration_email": "events@...",
  "send_all_to_same": false,
  "global_email": "admin@...",
  "candidate_signature": "Best regards,\nMiss Club Model SA Team",
  "venue_signature": "Partnership Team\nMiss Club Model SA",
  "event_signature": "Events Team\nMiss Club Model SA",
  "site_name": "Miss Club Model SA"
}
```

### `candidates`

Approved candidates (manually promoted from applications).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Candidate name |
| email | TEXT | Contact email |
| status | TEXT | undecided/approved/declined/deleted |
| created_at | TIMESTAMP | Creation timestamp |

---

## Appendix B: API Endpoints

### `/api/cms`

**Method:** GET  
**Purpose:** Fetch CMS content from Google Sheet CSV  
**Response:** `{ status: "success", content: { key: "value", ... } }`

### `/api/settings`

**Method:** GET, POST  
**Purpose:** Get/update email settings and site configuration  
**GET Response:** `{ status: "success", data: { ...settings... } }`  
**POST Body:** `{ candidate_application_email: "...", ... }`

### `/api/admin`

**Method:** POST  
**Purpose:** Admin operations (requires service role key)  
**Actions:**
- `updateStatus` - Change record status
- `updateRecord` - Edit record fields
- `deleteRecord` - Delete a record
- `sendBulkEmail` - Send bulk email to registrants
- `getEventFilter` - Get events list for dropdown

**Body:**
```json
{
  "action": "updateStatus",
  "table": "interested_parties",
  "id": "uuid",
  "status": "approved"
}
```

### `/api/events`

**Method:** GET, POST, PUT, DELETE  
**Purpose:** Event CRUD operations  
**GET Query:** `?admin=true` (show all events, including pending)  
**POST Body:** `{ name, date, time, location, description, poster, status }`

### `/api/submit`

**Method:** POST  
**Purpose:** Candidate application submission  
**Body:** Form data (multipart/form-data)  
**Effects:**
- Uploads photos/video to Supabase Storage
- Inserts record into `applications` table
- Sends confirmation email to candidate
- Sends notification email to admin

### `/api/organizers`

**Method:** POST  
**Purpose:** Venue partner submission  
**Body:** Form data  
**Effects:**
- Inserts record into `event_organizers` table
- Sends confirmation email to venue
- Sends notification email to admin

### `/api/interested_parties`

**Method:** POST  
**Purpose:** Event registration submission  
**Body:** Form data  
**Effects:**
- Inserts record into `interested_parties` table
- Sends confirmation email to registrant
- Sends notification email to admin

### `/api/subscribe`

**Method:** POST  
**Purpose:** Newsletter subscription  
**Body:** `{ email }`  
**Effects:**
- Inserts record into `event_interest_subscriptions` table
- Sends welcome email

### `/api/upload`

**Method:** POST  
**Purpose:** File upload to Supabase Storage  
**Body:** Form data with file  
**Response:** `{ publicUrl: "https://..." }`

---

## Appendix C: Environment Variables

Required on Vercel:

| Variable | Purpose | Example |
|----------|---------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://ekvwgxnryasrvltyukvj.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service role key (admin access) | `eyJhbGc...` (long JWT) |
| `SUPABASE_ANON_KEY` | Anon key (public access) | `eyJhbGc...` (long JWT) |
| `RESEND_API_KEY` | Resend email API key | `re_TeYec98X_...` |

Optional:

| Variable | Purpose | Default |
|----------|---------|---------|
| `CANDIDATE_EMAIL` | Fallback candidate email | `elihsa@gmail.com` |
| `VENUE_EMAIL` | Fallback venue email | `elihsa@gmail.com` |
| `EVENT_EMAIL` | Fallback event email | `elihsa@gmail.com` |
| `GLOBAL_EMAIL` | Fallback global email | `elihsa@gmail.com` |

---

## Appendix D: Supabase Storage Buckets

### `applications`

Stores candidate submission files.

**Folder Structure:**
```
applications/
  headshots/
    <timestamp>-<filename>.jpg
  fullbody/
    <timestamp>-<filename>.jpg
  videos/
    <timestamp>-<filename>.mp4
```

**Access:** Public URLs (bucket must be set to public)

### `events`

Stores event posters.

**Folder Structure:**
```
events/
  posters/
    <timestamp>-<filename>.jpg
```

---

## Appendix E: Build Info & Version Tracking

### Build Number Format

`MAJOR.MINOR.PATCH` (e.g., `1.0.0`)

- **MAJOR:** Breaking changes (new architecture, removed features)
- **MINOR:** New features (bulk email, event status, site customization)
- **PATCH:** Bug fixes (typo corrections, error handling improvements)

### How to Update Build Number

1. Edit `README.md` (this file)
2. Update "Build Number" and "Last Updated" at top
3. Edit `index.html`, `events.html`, `admin.html` footer
4. Commit with message: `chore: bump version to 1.1.0`
5. Deploy

### Automated Build Info (Future)

See "Specification Document" for CI/CD setup to auto-update build info on each deploy.

---

## Appendix F: Time Tracking

### Development Time Tracker

**Location:** `scripts/track-time.js`

**Commands:**
```bash
# Initialize tracking
node scripts/track-time.js init

# Start a work session
node scripts/track-time.js log

# End session
node scripts/track-time.js stop

# View total time
node scripts/track-time.js report

# Time since a date
node scripts/track-time.js since 2026-11-01
```

**Output Example:**
```
=== Development Time Report ===
Tracking started: 11/12/2026, 7:00:00 PM
Total sessions: 15
Total time: 12h 34m 56s
Average session: 50m 19s
Active session: 1h 23m (ongoing)
```

**Data Storage:** `.dev-time.json` in project root

---

## Appendix G: Git Workflow

### Branching Strategy

- `main` - Production-ready code (auto-deploys to Vercel)
- `develop` - Staging branch (optional, for testing)
- `feature/*` - Feature branches (e.g., `feature/bulk-email`)

### Commit Message Convention

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation update
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code restructuring (no behavior change)
- `test` - Adding tests
- `chore` - Build process, auxiliary tools

**Example:**
```
feat: add bulk email functionality for event registrations

- Add event filter dropdown to bulk email modal
- Implement rich-text editor with formatting toolbar
- Support {name} placeholder personalization
- Auto-append unsubscribe link to all emails

Closes #42
```

### Deployment

```bash
# Commit changes
git add -A
git commit -m "feat: description"

# Deploy to production
npx vercel --prod --force
```

---

## Appendix H: Security Considerations

### Current State

- Admin panel is **publicly accessible** (no authentication)
- API endpoints use Supabase anon key (read-only) for most operations
- Write operations go through `/api/admin` with service role key

### Recommended Enhancements

1. **Admin Authentication:**
   - Implement Supabase Auth (email/password or magic link)
   - Protect `/admin.html` with session check
   - Add login/logout UI

2. **API Rate Limiting:**
   - Use Vercel middleware to limit requests per IP
   - Prevent brute-force attacks on forms

3. **Input Validation:**
   - Sanitize all user inputs (XSS prevention)
   - Validate file types on upload (prevent malicious uploads)
   - Limit file sizes (currently 50MB for videos)

4. **CORS Configuration:**
   - Restrict allowed origins in API headers
   - Currently set to `*` (allows any domain)

5. **Environment Variable Security:**
   - Never commit `.env` files to git
   - Use Vercel's encrypted environment variables
   - Rotate API keys periodically

---

## Appendix I: Performance Optimization

### Current Optimizations

- **Image Auto-Resize:** Client-side resize to 1200px max before upload
- **Lazy Loading:** Images load as user scrolls (future enhancement)
- **CSS Variables:** Efficient theme switching
- **Serverless Functions:** Auto-scaling on Vercel

### Future Enhancements

1. **Image Optimization:**
   - Convert uploads to WebP format
   - Use Vercel Image Optimization API

2. **Caching:**
   - Cache CMS content in browser localStorage
   - Set longer cache headers on static assets

3. **Code Splitting:**
   - Split admin panel into separate bundle
   - Lazy-load heavy libraries (e.g., rich-text editor)

4. **Database Indexing:**
   - Add indexes on `status`, `created_at`, `event_id` columns
   - Speed up filtering and sorting

---

## Appendix J: Accessibility (A11y)

### Current State

- Semantic HTML (proper heading hierarchy)
- Alt text on images (from CMS)
- Keyboard navigation support
- Color contrast meets WCAG AA (gold on black)

### Testing Tools

- **axe-core** - Browser extension for accessibility audits
- **Lighthouse** - Chrome DevTools accessibility score
- **WAVE** - Web Accessibility Evaluation Tool

### Recommendations

1. Add `aria-label` to icon-only buttons (e.g., hamburger menu)
2. Ensure all form fields have associated `<label>` elements
3. Add skip-to-content link for keyboard users
4. Test with screen readers (NVDA, VoiceOver)

---

## Appendix K: Browser Compatibility

### Tested Browsers

- ✅ Chrome 120+ (primary)
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

### Not Supported

- ❌ Internet Explorer (end of life)
- ❌ Old Android Browser (< v100)

### Polyfills

None currently used. Site uses modern ES6+ JavaScript.

---

## Appendix L: Known Issues & Limitations

1. **Bulk Email Unsubscribe:**
   - Current unsubscribe link goes to homepage
   - Future: Implement true unsubscribe endpoint that removes from `interested_parties`

2. **Column Configuration:**
   - Saved per-browser (localStorage)
   - Future: Save to user profile in database

3. **Event Deletion:**
   - Cannot delete launched events
   - Workaround: Change status to `pending` first

4. **Email Templates:**
   - No support for attachments in bulk emails
   - Future: Add file upload to bulk email composer

5. **CMS Publishing:**
   - Manual re-publish required after changes
   - Future: Use Google Sheets API for real-time updates

6. **Time Tracking:**
   - Manual start/stop required
   - Future: Integrate with git commits for automatic tracking

---

## Appendix M: Future Enhancements (Roadmap)

### Phase 1 (Q1 2027)

- [ ] Admin panel authentication (Supabase Auth)
- [ ] True unsubscribe functionality for bulk emails
- [ ] Column configuration saved to database
- [ ] Style Builder UI (no-code color/font changes)

### Phase 2 (Q2 2027)

- [ ] Candidate spotlight voting system
- [ ] Public voting for "People's Choice" award
- [ ] Live event streaming integration
- [ ] Mobile app (React Native)

### Phase 3 (Q3 2027)

- [ ] Multi-language support (i18n)
- [ ] White-label system for reselling to other pageants
- [ ] Automated social media posting (Instagram, Facebook)
- [ ] Analytics dashboard (Google Analytics integration)

---

## Contact & Support

**Developer:** ELI  
**Email:** elihsa@gmail.com  
**GitHub:** github.com/elihsa  
**Deployment:** Vercel (missclubmodel.vercel.app)  
**Database:** Supabase (ekvwgxnryasrvltyukvj)  

---

**END OF DOCUMENT**

*This document is auto-generated and should be updated with every major feature addition. See "Specification Document" for technical architecture details.*
