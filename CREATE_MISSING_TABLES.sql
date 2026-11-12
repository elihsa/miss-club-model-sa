-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ekvwgxnryasrvltyukvj/sql/new

-- 1. Create interested_parties table
CREATE TABLE IF NOT EXISTS interested_parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  favorite_candidate TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interested_parties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert interested_parties" ON interested_parties;
CREATE POLICY "Allow anon insert interested_parties" ON interested_parties
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read interested_parties" ON interested_parties;
CREATE POLICY "Allow authenticated read interested_parties" ON interested_parties
  FOR SELECT TO authenticated USING (true);

-- 2. Create event_organizers table
CREATE TABLE IF NOT EXISTS event_organizers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  venue_name TEXT NOT NULL,
  venue_location TEXT NOT NULL,
  venue_address TEXT,
  website_url TEXT,
  venue_description TEXT,
  capacity INT,
  equipment TEXT,
  availability TEXT,
  terms_accepted BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert event_organizers" ON event_organizers;
CREATE POLICY "Allow anon insert event_organizers" ON event_organizers
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read event_organizers" ON event_organizers;
CREATE POLICY "Allow authenticated read event_organizers" ON event_organizers
  FOR SELECT TO authenticated USING (true);

-- 3. Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT,
  location TEXT,
  description TEXT,
  poster_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert events" ON events;
CREATE POLICY "Allow anon insert events" ON events
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read events" ON events;
CREATE POLICY "Allow authenticated read events" ON events
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated update events" ON events;
CREATE POLICY "Allow authenticated update events" ON events
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete events" ON events;
CREATE POLICY "Allow authenticated delete events" ON events
  FOR DELETE TO authenticated USING (true);

-- 4. Update videos bucket to allow webp
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
WHERE id = 'videos';