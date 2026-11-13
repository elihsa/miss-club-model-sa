-- Newsletter subscriptions table for footer signup
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'homepage_footer',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admin can read all subscriptions
CREATE POLICY "Admin read newsletter" ON newsletter_subscriptions
    FOR SELECT
    USING (auth.jwt() ->> 'email' IN ('elihsa@gmail.com', 'admin@missclubmodelsa.co.za', 'kiyanoschoonraad98@gmail.com'));

-- Public can insert (subscribe)
CREATE POLICY "Public subscribe" ON newsletter_subscriptions
    FOR INSERT
    WITH CHECK (true);

-- Admin can update (confirm/unsubscribe)
CREATE POLICY "Admin manage newsletter" ON newsletter_subscriptions
    FOR UPDATE
    USING (auth.jwt() ->> 'email' IN ('elihsa@gmail.com', 'admin@missclubmodelsa.co.za', 'kiyanoschoonraad98@gmail.com'));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscriptions(status);