# SPECIFICATION DOCUMENT — Miss Club Model SA Website

**Document Version:** 1.0.0
**Build:** v1.0.0 #63
**Last Updated:** 2026-11-14T10:08:35+02:00 (SAST)
**Commit:** 7952146
**Branch:** master
**Repository:** https://github.com/elihsa/miss-club-model-sa
**Live URL:** https://missclubmodel.vercel.app/

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Environment & Credentials](#2-environment--credentials)
3. [Deployment](#3-deployment)
4. [Supabase Database Schema](#4-supabase-database-schema)
5. [Supabase Storage](#5-supabase-storage)
6. [API Endpoints](#6-api-endpoints)
7. [Frontend Pages](#7-frontend-pages)
8. [Design System — Colors, Gradients & Fonts](#8-design-system--colors-gradients--fonts)
9. [CMS (Google Sheets)](#9-cms-google-sheets)
10. [Email System — Resend](#10-email-system--resend)
11. [Rebuild / Portability Guide](#11-rebuild--portability-guide)
12. [Build Number & Date Tracking](#12-build-number--date-tracking)
13. [Dependencies](#13-dependencies)

---

## 1. Project Overview

Full-stack static website + serverless API for a beauty pageant/events platform.
- **Frontend:** Plain HTML, CSS, vanilla JavaScript (no framework)
- **Backend API:** Vercel serverless functions (`/api/*.js`)
- **Database + Storage + Auth:** Supabase
- **Email:** Resend
- **CMS:** Google Sheets (published as CSV)
- **Deployment:** Vercel

---

## 2. Environment & Credentials

| Variable | Purpose | Where Used |
|---|---|---|
| `SUPABASE_URL` | Supabase project REST URL | All `/api/*.js` |
| `SUPABASE_ANON_KEY` | Public (browser-side) Supabase key | HTML pages (`supabase.createClient`) |
| `SUPABASE_SERVICE_KEY` | Server-side admin key (RLS bypass) | All `/api/*.js` |
| `RESEND_API_KEY` | Resend email API key (`re_...`) | `/api/submit.js`, `/api/admin.js`, `/api/organizers.js`, `/api/interested_parties.js`, `/api/subscribe.js` |
| `CANDIDATE_EMAIL` | Fallback recipient for candidate apps | `/api/submit.js` |
| `VENUE_EMAIL` | Fallback recipient for venue proposals | `/api/organizers.js` |
| `EVENT_EMAIL` | Fallback recipient for event registrations | `/api/interested_parties.js` |
| `GLOBAL_EMAIL` | Fallback when "send all to same" enabled | All email endpoints |

> **IMPORTANT:** NEVER commit these values to the repo. Store only in Vercel → Settings → Environment Variables (scope: `production`).

---

## 3. Deployment

**Platform:** Vercel
**Project:** `missclubmodel.vercel.app`
**Config:** `/vercel.json`
**Build Command:** `node scripts/build-info.js`
**Output Directory:** `.` (root — all static files are served directly)

### Deploy Steps (from repo)
```bash
cd /home/eli/Downloads/missclubmodel
git add -A && git commit -m "feat|fix|docs: description"
npx vercel --prod --force
```

---

## 4. Supabase Database Schema

Project ID: `ekvwgxnryasrvltyukvj`
URL: `https://ekvwgxnryasrvltyukvj.supabase.co`

### Table: `applications`
Candidate applications submitted via homepage form.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | Auto-generated |
| `full_name` | `text` | |
| `dob` | `date` | |
| `email` | `text` | |
| `phone` | `text` | |
| `address` | `text` | |
| `city` | `text` | |
| `province` | `text` | |
| `height` | `int` | cm |
| `occupation` | `text` | |
| `education` | `text` | |
| `instagram` | `text` | |
| `platform` | `text` | Required |
| `essay` | `text` | Required |
| `talent` | `text` | |
| `headshot_url` | `text` | Supabase Storage URL |
| `fullbody_url` | `text` | Supabase Storage URL |
| `video_url` | `text` | Supabase Storage URL |
| `emergency_name` | `text` | |
| `emergency_phone` | `text` | |
| `terms` | `boolean` | Default `false` |
| `media_release` | `boolean` | Default `false` |
| `status` | `text` | `undecided` / `approved` / `declined` / `deleted` |
| `created_at` | `timestamptz` | Default `NOW()` |

RLS:
- Allow anonymous `INSERT`
- Authenticated users can `SELECT`

### Table: `events`
Event definitions (created/managed via admin panel).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | |
| `name` | `text` | |
| `event_date` | `date` | |
| `event_time` | `time` | Optional |
| `location` | `text` | |
| `description` | `text` | |
| `poster_url` | `text` | Supabase Storage URL |
| `status` | `text` | `pending` (hidden) / `launched` (visible) |
| `created_at` | `timestamptz` | |

### Table: `interested_parties`
Event registrations (waitlist / ticket interest).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | |
| `full_name` | `text` | |
| `email` | `text` | |
| `phone` | `text` | |
| `event_id` | `uuid` (FK → `events.id`) | |
| `favorite_candidate` | `text` | Optional |
| `message` | `text` | Optional |
| `status` | `text` | `pending` / `approved` / `declined` / `confirmed` / `cancelled` |
| `created_at` | `timestamptz` | |

### Table: `event_organizers`
Venue partner submissions.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | |
| `venue_name` | `text` | |
| `contact_name` | `text` | |
| `email` | `text` | |
| `phone` | `text` | |
| `website_url` | `text` | |
| `location` | `text` | |
| `availability` | `text` | |
| `message` | `text` | |
| `status` | `text` | `pending` / `approved` / `declined` / `deleted` |
| `created_at` | `timestamptz` | |

### Table: `site_settings`
Key-value settings (JSONB values).

| Column | Type | Notes |
|---|---|---|
| `key` | `text` (PK) | e.g. `email_settings` |
| `value` | `jsonb` | Settings object |
| `description` | `text` | |
| `updated_at` | `timestamptz` | |

### Table: `candidates`
Approved candidates (promoted from `applications`).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | |
| `name` | `text` | |
| `email` | `text` | |
| `status` | `text` | |
| `created_at` | `timestamptz` | |

### Table: `newsletter_subscriptions`
Newsletter signups.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` (PK) | |
| `email` | `text` | |
| `created_at` | `timestamptz` | |

---

## 5. Supabase Storage

| Bucket | Purpose | Public? | Max File Size | Allowed MIME Types |
|---|---|---|---|---|
| `videos` | Candidate headshots, full-body photos, intro videos | Yes | 50 MB | `video/mp4`, `video/webm`, `video/quicktime`, `image/jpeg`, `image/png` |
| `events` | Event poster images | Yes | — | `image/*` |
| `applications` | Candidate submission files | Yes | — | `image/*`, `video/*` |

---

## 6. API Endpoints

All under `/api/` (Vercel serverless functions).

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/submit` | `POST` | Public | Candidate application (uploads files + inserts record) |
| `/api/organizers` | `POST` | Public | Venue partner submission |
| `/api/interested_parties` | `POST` | Public | Event registration |
| `/api/subscribe` | `POST` | Public | Newsletter signup |
| `/api/upload` | `POST` | Public | Generic file upload to Supabase Storage |
| `/api/events` | `GET`, `POST`, `PUT`, `DELETE` | Service key | Event CRUD. `?admin=true` includes `pending` events |
| `/api/events_create` | `POST` | Service key | Alternative event creation endpoint |
| `/api/admin` | `POST` | Service key | Admin operations (`updateStatus`, `updateRecord`, `deleteRecord`, `sendBulkEmail`, `getEventFilter`) |
| `/api/settings` | `GET`, `POST` | Service key | Get/update site settings (email config, signatures, site name) |
| `/api/cms` | `GET` | Public | Fetch CMS content from published Google Sheet CSV |
| `/api/event-interest` | `GET`, `POST` | Service key | Event interest subscription management |
| `/api/candidates` | `GET` | Service key | List candidates |

### Admin Actions (`/api/admin` POST body)
```json
{
  "action": "updateStatus|updateRecord|deleteRecord|sendBulkEmail|getEventFilter",
  "table": "applications|events|interested_parties|event_organizers|event_interest_subscriptions",
  "id": "<uuid>",
  "status": "<status>",
  "data": { ...fields... }
}
```

---

## 7. Frontend Pages

| File | URL | Purpose |
|---|---|---|
| `index.html` | `/` | Hero, about, gallery, events preview, candidate application form, venue partner form, newsletter signup |
| `events.html` | `/events.html` | Event listings, event detail modals, registration/waitlist forms |
| `admin.html` | `/admin.html` | Full admin dashboard (analytics, candidates, venues, events, registrations, interest, email settings, media, style builder) |
| `terms.html` | `/terms.html` | Terms & Conditions legal page |
| `privacy.html` | `/privacy.html` | Privacy Policy (POPIA compliant) |
| `contact.html` | `/contact.html` | Contact information |
| `design-system-builder.html` | `/design-system` | Visual style builder tool (via rewrite in `vercel.json`) |

---

## 8. Design System — Colors, Gradients & Fonts

### CSS Custom Properties (Primary Palette)
| Variable | Value | Usage |
|---|---|---|
| `--gold` | `#c9a84c` | Primary gold (buttons, headings, accents) |
| `--gold-light` | `#f0d878` | Hover highlights, gold text |
| `--gold-dark` | `#8b6914` | Borders, dark gold elements |
| `--black` | `#0a0a0a` | Background |
| `--dark` | `#1a1a1a` | Cards, secondary background |
| `--darker` | `#121212` | Deep background, footers |
| `--cream` | `#f5f0e8` | Body text, primary text color |
| `--red` | `#e74c3c` | Error, declined badge |
| `--green` | `#27ae60` | Success, approved badge |
| `--blue` | `#3498db` | Info badges |
| `--warning` | `#f39c12` | Warning, pending badge |

### Fonts (Google Fonts CDN)
| Family | Weights | Usage |
|---|---|---|
| **Playfair Display** | 400, 500, 600, 700 | Headings (`h1`–`h4`), buttons |
| **Inter** | 300, 400, 500, 600 | Body text, paragraphs, labels |
| **Montserrat** | 300–800 | Admin panel headings |
| **Lora** | 400–700 | Legal pages (terms, privacy) |
| **DM Serif Display** | 400, italic 400 | Design System Builder |

Google Fonts URLs loaded in `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Spacing Scale (CSS Variables)
| Variable | Value |
|---|---|
| `--space-1` | `0.25rem` |
| `--space-2` | `0.5rem` |
| `--space-3` | `0.75rem` |
| `--space-4` | `1rem` |
| `--space-5` | `1.5rem` |
| `--space-6` | `2rem` |
| `--space-8` | `3rem` |
| `--space-10` | `4rem` |

### Border Radii
| Variable | Value |
|---|---|
| `--radius-sm` | `4px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |
| `--radius-xl` | `16px` |
| `--radius-2xl` | `24px` |
| `--radius-full` | `9999px` |

### Transitions
| Variable | Value |
|---|---|
| `--transition-fast` | `150ms ease` |
| `--transition-normal` | `300ms ease` |
| `--transition-slow` | `500ms ease` |
| `--transition-bounce` | `300ms cubic-bezier(0.34, 1.56, 0.64, 1)` |

---

## 9. CMS (Google Sheets)

**Published CSV URL:**
`https://docs.google.com/spreadsheets/d/e/2PACX-1vTfyDuaZ3UGKmMCNsKGYwG0oqfADQJMcNnrWkt0qYjhjTuNWL0LTGpWM-WORdoz10AW7P1_QxJNW2G_/pub?gid=1299416052&single=true&output=csv`

**Endpoint:** `GET /api/cms`

**Local Mirror:** `cms-exact-match.csv`

Every text element on the site has a `data-cms-key` attribute. The frontend fetches `/api/cms`, parses the CSV, and replaces inner text of matching elements.

**To update:** Edit Google Sheet → File → Share → Publish to web → CSV → redeploy (or wait for cache).

---

## 10. Email System — Resend

**Provider:** Resend (`re_...` API key)
**Sender Domain:** Verified domain on Resend (e.g., `noreply@missclubmodelsa.co.za`)

| Trigger | Endpoint | Sends To |
|---|---|---|
| Candidate application | `/api/submit` | Admin (configurable), candidate (confirmation) |
| Venue proposal | `/api/organizers` | Admin, venue contact |
| Event registration | `/api/interested_parties` | Admin, registrant |
| Newsletter signup | `/api/subscribe` | Subscriber (welcome) |
| Bulk email | `/api/admin` (action: `sendBulkEmail`) | Selected registrants |

Signatures are stored in `site_settings` table (`email_settings` key) as JSON with `candidate_signature`, `venue_signature`, `event_signature` fields.

---

## 11. Rebuild / Portability Guide

### Prerequisites
1. Node.js 18+
2. Vercel account + project
3. Supabase account + project
4. Resend account + verified domain
5. Google account (for CMS Sheet)

### Step-by-Step Rebuild
1. Clone repo: `git clone https://github.com/elihsa/miss-club-model-sa.git`
2. Set Supabase project URL + keys in Vercel env vars
3. Set Resend API key in Vercel env vars
4. Run `setup_supabase.js` against new Supabase project (creates tables, storage buckets)
5. Recreate `site_settings` row with email config
6. Publish new Google Sheet → copy CSV URL → update `/api/cms.js`
7. Deploy: `npx vercel --prod --force`
8. Change `site_name` in `site_settings` to new brand name
9. Update Google Sheet keys (`navLogo`, `heroTagline`, `footerText`, etc.)
10. Swap gallery images in Google Sheet (`gallery1`–`gallery6` URLs)
11. (Optional) Customize CSS variables (`--gold`, `--black`, etc.) in HTML `<style>` blocks

---

## 12. Build Number & Date Tracking

**Generator:** `scripts/build-info.js`
- Runs on every Vercel build (see `vercel.json` `buildCommand`)
- Outputs `build-info.json` with build number (commit count), version, commit hash, branch, build time
- Read by `scripts/build-info-runtime.js` on every page load
- Renders at bottom of every page: `Built v1.0.0 #63 · 14 Nov 2026, 10:08:35 (SAST) · commit 7952146`

**To regenerate locally:** `node scripts/build-info.js`

---

## 13. Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | `^2.119.0` | Supabase client (backend + browser) |
| `busboy` | `^1.6.0` | Multipart form parsing (file uploads) |
| `resend` | `^3.2.0` | Email delivery |

---

*END OF SPECIFICATION DOCUMENT*
*Updated with every major change. See `README.md` for functional user guide.*
