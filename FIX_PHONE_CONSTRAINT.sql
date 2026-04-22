-- Fix: Allow multiple users to have the same phone number
-- This removes the unique constraint on phone so multiple users can share a phone

-- Drop the unique constraint on phone
DROP INDEX IF EXISTS public.idx_unique_phone;

-- Create a non-unique index instead (for faster queries)
CREATE INDEX IF NOT EXISTS idx_users_phone_nonunique ON public.users(phone) WHERE phone IS NOT NULL;

-- Verify the index exists
SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE '%phone%';
