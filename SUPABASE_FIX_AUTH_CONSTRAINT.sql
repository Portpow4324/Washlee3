-- Fix: Remove auth.users FK constraint for data import
-- This allows importing users without them existing in auth.users first

-- Drop the constraint
ALTER TABLE public.users 
DROP CONSTRAINT users_id_fkey;

-- Modify users table to have UUID primary key without auth reference
ALTER TABLE public.users 
DROP CONSTRAINT users_pkey;

ALTER TABLE public.users
ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Now users can be imported independently
-- After import, you can manually create auth.users entries or use Supabase Auth API
