-- Run this in Supabase SQL Editor
-- Create table for "Tell Me More" / event interest subscriptions
CREATE TABLE IF NOT EXISTS event_interest_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    phone TEXT,
    favorite_candidate TEXT,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    UNIQUE(event_id, email)
);

-- Enable RLS
ALTER TABLE event_interest_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anon inserts (for public form submissions)
CREATE POLICY "Allow anon inserts" ON event_interest_subscriptions
    FOR INSERT TO anon
    WITH CHECK (true);

-- Policy: Allow authenticated reads (for admin)
CREATE POLICY "Allow authenticated reads" ON event_interest_subscriptions
    FOR SELECT TO authenticated
    USING (true);

-- Policy: Allow authenticated updates (for admin status changes)
CREATE POLICY "Allow authenticated updates" ON event_interest_subscriptions
    FOR UPDATE TO authenticated
    USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_interest_subscriptions_event_id ON event_interest_subscriptions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_interest_subscriptions_email ON event_interest_subscriptions(email);

-- Create settings table for email configuration
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated reads
CREATE POLICY "Allow authenticated reads settings" ON site_settings
    FOR SELECT TO authenticated
    USING (true);

-- Policy: Allow authenticated updates
CREATE POLICY "Allow authenticated updates settings" ON site_settings
    FOR UPDATE TO authenticated
    USING (true);

-- Insert default email settings
INSERT INTO site_settings (key, value, description) VALUES
('email_settings', '{
  "candidate_application_email": "elihsa@gmail.com",
  "venue_partner_email": "elihsa@gmail.com",
  "event_registration_email": "elihsa@gmail.com",
  "send_all_to_same": false,
  "global_email": "elihsa@gmail.com"
}', 'Email configuration for form submissions')
ON CONFLICT (key) DO NOTHING;

-- Add created_at to interested_parties if not exists
ALTER TABLE interested_parties ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE interested_parties ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add event_name to interested_parties for easier display
ALTER TABLE interested_parties ADD COLUMN IF NOT EXISTS event_name TEXT;