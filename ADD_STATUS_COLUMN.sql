-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ekvwgxnryasrvltyukvj/sql/new

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'undecided' 
CHECK (status IN ('undecided', 'approved', 'declined', 'deleted'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);