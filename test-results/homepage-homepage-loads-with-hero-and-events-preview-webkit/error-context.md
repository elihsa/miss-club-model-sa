# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: homepage.spec.js >> homepage loads with hero and events preview
- Location: tests/e2e/homepage.spec.js:7:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('header h1')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('header h1') with timeout 5000ms
  - waiting for locator('header h1')

```

```yaml
- navigation:
  - link "Miss Club Model SA":
    - /url: "#home"
  - list:
    - listitem:
      - link "Home":
        - /url: "#home"
    - listitem:
      - link "About":
        - /url: "#about"
    - listitem:
      - link "Gallery":
        - /url: "#gallery"
    - listitem:
      - link "Events":
        - /url: "#events"
    - listitem:
      - link "Candidates":
        - /url: "#candidates"
    - listitem:
      - link "Apply":
        - /url: "#apply"
    - listitem:
      - link "Venue Partner":
        - /url: "#venue-partner"
    - listitem:
      - link "Contact":
        - /url: "#contact"
  - link "⚙ Admin - Miss Club Model SA":
    - /url: /admin.html
- img "Miss Club Model SA Logo"
- paragraph: Where Elegance Meets Opportunity
- paragraph: Empowering Women Across South Africa
- link "Apply Now":
  - /url: "#apply"
- img
- region "Impact Metrics": 500+ Candidates Empowered 25+ Events Hosted 9 Provinces Reached 100+ Communities Impacted
- heading "Our Vision" [level=2]
- paragraph: Empowering Women Across South Africa
- paragraph: Miss Club Model SA celebrates elegance,intelligence,and empowerment. We provide a platform for extraordinary women to showcase their talent,advocate for meaningful causes,and inspire communities across South Africa.
- paragraph: Our mission is to create opportunities for young women to grow,lead,and make an impact. Through our events,mentorship programs,and community initiatives,we're building the next generation of South African leaders.
- heading "Our Vision" [level=3]
- paragraph: To be the leading platform that celebrates and empowers South African women through elegance,leadership,and community impact.
- heading "Gallery" [level=2]
- paragraph: Highlights from our events
- img "Women enjoying club atmosphere"
- heading "Club Atmosphere" [level=3]
- paragraph: Where elegance meets excitement
- img "Women toasting with drinks"
- heading "Sisterhood" [level=3]
- paragraph: Celebrating sisterhood and style
- img "Women laughing and having fun"
- heading "Confidence" [level=3]
- paragraph: Confidence in every step
- img "Women celebrating indoors"
- heading "Moments" [level=3]
- paragraph: Moments that matter
- img "Women at bar having drinks"
- heading "Elegance" [level=3]
- paragraph: Elegance redefined
- img "Women with cocktails"
- heading "Journey" [level=3]
- paragraph: The journey continues
- heading "Events" [level=2]
- paragraph: Upcoming events and experiences
- text: "Sort by:"
- combobox "Sort by:":
  - 'option "Date: Soonest First" [selected]'
  - 'option "Date: Latest First"'
  - 'option "Name: A-Z"'
  - 'option "Name: Z-A"'
- text: "Filter:"
- combobox "Filter:":
  - option "All Events" [selected]
  - option "Upcoming"
  - option "Past Events"
- paragraph: No events match your filters.
- heading "Finalist Spotlight" [level=2]
- paragraph: Meet the remarkable women leading with purpose and grace
- article:
  - img "Final"
  - text: T, GP
  - heading "Final" [level=3]
  - text: 🎯 T...
  - paragraph: T...
  - link "Learn More":
    - /url: "#apply"
    - text: Learn More
    - img
- article:
  - img "Test"
  - text: Test, Gauteng
  - heading "Test" [level=3]
  - text: 🎯 Test...
  - paragraph: Test...
  - link "Learn More":
    - /url: "#apply"
    - text: Learn More
    - img
- article:
  - img "Eli Haimov"
  - text: Bruma, Gauteng
  - heading "Eli Haimov" [level=3]
  - text: 🎯 animal cruelty and cakes...
  - paragraph: I'm amazing ...
  - link "Learn More":
    - /url: "#apply"
    - text: Learn More
    - img
- article:
  - img "File Upload Test"
  - text: Finalist
  - heading "File Upload Test" [level=3]
  - text: 🎯 Testing file upload...
  - paragraph: This submission includes uploaded file URLs...
  - link "Learn More":
    - /url: "#apply"
    - text: Learn More
    - img
- heading "Our Candidates" [level=2]
- paragraph: Meet our inspiring candidates
- button "All Events"
- article:
  - img "Test"
  - heading "Test" [level=4]
  - paragraph: Test, GP
- article:
  - img "Final"
  - heading "Final" [level=4]
  - paragraph: T, GP
- article:
  - img "Test"
  - heading "Test" [level=4]
  - paragraph: Test, Gauteng
- article:
  - img "Test"
  - heading "Test" [level=4]
  - paragraph: Test, Gauteng
- article:
  - img "Test Candidate"
  - heading "Test Candidate" [level=4]
  - paragraph: Cape Town, WC
- article:
  - img "Test Applicant"
  - heading "Test Applicant" [level=4]
  - paragraph
- article:
  - img "Eli Haimov"
  - heading "Eli Haimov" [level=4]
  - paragraph: Bruma, Gauteng
- article:
  - img "Final Test"
  - heading "Final Test" [level=4]
  - paragraph
- article:
  - img "File Upload Test"
  - heading "File Upload Test" [level=4]
  - paragraph
- article:
  - img "Public Test"
  - heading "Public Test" [level=4]
  - paragraph
- article:
  - img "Test User 2"
  - heading "Test User 2" [level=4]
  - paragraph
- article:
  - img "Test User"
  - heading "Test User" [level=4]
  - paragraph
- heading "Apply Now" [level=2]
- paragraph: Take the first step towards your journey with Miss Club Model SA
- text: Full Name
- textbox "Thandiwe Mkhize"
- text: Date of Birth
- textbox:
  - /placeholder: YYYY-MM-DD
- text: Email Address
- textbox "you@example.com"
- text: Phone Number
- textbox "082 123 4567"
- text: Select Event
- combobox:
  - option "Select an event" [selected]
  - option "All Events"
- text: Physical Address
- textbox "123 Main Street,City"
- text: City
- textbox "e.g. Cape Town"
- text: Province
- combobox:
  - option "Select a province" [selected]
  - option "Eastern Cape"
  - option "Free State"
  - option "Gauteng"
  - option "KwaZulu-Natal"
  - option "Limpopo"
  - option "Mpumalanga"
  - option "North West"
  - option "Northern Cape"
  - option "Western Cape"
- text: Height (cm)
- spinbutton "165"
- text: Occupation
- textbox "e.g. Student,Model,Entrepreneur"
- text: Education Level
- textbox "e.g. Bachelor's Degree"
- text: Instagram Handle
- textbox "@yourhandle"
- text: Platform / Cause
- textbox "e.g. Women's Education,Mental Health,Environment"
- text: Personal Essay
- textbox "Tell us about yourself,your aspirations,and why you want to join Miss Club Model SA..."
- text: Talent / Skill
- textbox "e.g. Dancing,Public Speaking,Singing"
- text: Headshot Photo
- paragraph: Upload a headshot photo (JPG/PNG/WebP,max 5MB)
- paragraph
- text: Full Body Photo
- paragraph: Upload a full-body photo (JPG/PNG/WebP,max 5MB)
- paragraph
- text: Video Introduction
- paragraph: Upload a 60-second video introduction (MP4/WebM,max 50MB)
- paragraph
- text: Emergency Contact Name
- textbox "Jane Doe"
- text: Emergency Contact Phone
- textbox "082 123 4567"
- checkbox "I agree to the Terms & Conditions and Privacy Policy and confirm all information provided is accurate."
- text: I agree to the
- link:
  - /url: https://missclubmodel.vercel.app/terms
- link "Terms & Conditions":
  - /url: /terms.html
- text: and
- link:
  - /url: https://missclubmodel.vercel.app/privacy
- link "Privacy Policy":
  - /url: /privacy.html
- text: and confirm all information provided is accurate.
- checkbox "I consent to the use of my photos and videos for promotional purposes"
- text: I consent to the use of my photos and videos for promotional purposes
- checkbox "I have read and accept the Privacy Policy (POPIA Compliant)"
- text: I have read and accept the
- link:
  - /url: https://missclubmodel.vercel.app/privacy
- link "Privacy Policy":
  - /url: /privacy.html
- text: (POPIA Compliant)
- button "Submit Application"
- heading "Venue Partner" [level=2]
- paragraph: Become a venue partner
- text: Partner with us to host Miss Club Model SA events Your Name
- textbox "John Smith"
- text: Contact Email
- textbox "venue@example.com"
- text: Contact Phone
- textbox "082 123 4567"
- text: Venue Name
- textbox "The Grand Ballroom"
- text: Location/City
- textbox "e.g. Sandton,Johannesburg"
- text: Venue Address
- textbox "123 Venue Street,City"
- text: Venue Website
- textbox "https://venue.example.com"
- text: Capacity
- spinbutton "e.g. 500"
- text: Venue Description
- textbox "Describe your venue facilities,ambiance,and what makes it special for hosting events..."
- text: Equipment Available
- textbox "e.g. Stage,Sound System,Lighting,Dressing Rooms"
- text: Available Dates
- textbox:
  - /placeholder: e.g. March - June 2026
- checkbox "By submitting,you agree to our venue partnership terms,\"Terms & Conditions\",\"and Privacy Policy"
- text: By submitting,you agree to our venue partnership terms,"
- link:
  - /url: https://missclubmodel.vercel.app/terms
- link "Terms & Conditions":
  - /url: /terms.html
- text: "\",\"and"
- link:
  - /url: https://missclubmodel.vercel.app/privacy
- link "Privacy Policy":
  - /url: /privacy.html
- button "Submit Venue Proposal"
- heading "Contact Us" [level=2]
- paragraph: Get in touch with us
- heading "mail" [level=3]
- paragraph: kiyanoschoonraad98@gmail.com
- heading "phone" [level=3]
- paragraph: 074 148 8883
- heading "location" [level=3]
- paragraph: South Africa
- heading "Stay Updated" [level=2]
- paragraph: Get the latest news, event announcements, and candidate spotlights delivered to your inbox.
- textbox "Enter your email address"
- button "Subscribe"
- paragraph
- contentinfo:
  - paragraph:
    - text: © 2026 Miss Club Model SA. All rights reserved. |
    - link "Privacy Policy":
      - /url: https://missclubmodel.vercel.app/privacy
    - text: "|"
    - link "Terms & Conditions":
      - /url: https://missclubmodel.vercel.app/terms
- text: "Built v1.0.0 #822121 · 16 Nov 2026, 11:42:01 (SAST) · commit local"
```

# Test source

```ts
  1  | // tests/e2e/homepage.spec.js
  2  | const { test, expect } = require('@playwright/test');
  3  | 
  4  | /**
  5  |  * Verify homepage loads and essential elements exist.
  6  |  */
  7  | test('homepage loads with hero and events preview', async ({ page }) => {
  8  |   await page.goto('/');
  9  |   // Hero title contains "Miss Club Model"
  10 |   const hero = await page.locator('header h1');
> 11 |   await expect(hero).toBeVisible();
     |                      ^ Error: expect(locator).toBeVisible() failed
  12 |   await expect(hero).toContainText('Miss Club Model', { timeout: 5000 });
  13 | 
  14 |   // Events preview section should have at least one event card
  15 |   const eventCards = page.locator('.event-card');
  16 |   await expect(eventCards.first()).toBeVisible({ timeout: 5000 });
  17 | 
  18 |   // Footer build info present
  19 |   const footer = page.locator('#buildInfo');
  20 |   await expect(footer).toBeVisible();
  21 | });
  22 | 
```