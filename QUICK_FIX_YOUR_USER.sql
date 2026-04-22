-- Quick fix for lukaverde6 user - update with actual first and last name
-- Run this SQL query in your Supabase dashboard

-- First, let's see what's in the customers table for this user
SELECT id, email, first_name, last_name FROM public.customers 
WHERE email LIKE 'lukaverde%' OR id = 'ae4b5696-e9d5-47d4-9351-94e3ee9bd598';

-- Then update the users table with this info
UPDATE public.users
SET 
  first_name = 'Luke',
  last_name = 'Verde'
WHERE id = 'ae4b5696-e9d5-47d4-9351-94e3ee9bd598';

-- Verify the update
SELECT id, email, first_name, last_name FROM public.users 
WHERE id = 'ae4b5696-e9d5-47d4-9351-94e3ee9bd598';

-- Then LOG OUT completely (clear browser cache) and log back in
-- You should now see "Luke Verde" instead of "lukaverde6"
