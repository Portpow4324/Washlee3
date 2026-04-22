-- CRITICAL FIX: Add missing columns to users table
-- Error 42703 means columns don't exist - this fixes it

-- Step 1: Add the missing columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Step 2: Update your specific user with first and last name from customers table
UPDATE public.users u
SET 
  first_name = c.first_name,
  last_name = c.last_name
FROM public.customers c
WHERE u.id = c.id 
  AND u.id = 'ae4b5696-e9d5-47d4-9351-94e3ee9bd598';

-- Step 3: Verify it worked - you should see your real name
SELECT id, email, first_name, last_name FROM public.users 
WHERE id = 'ae4b5696-e9d5-47d4-9351-94e3ee9bd598';

-- Step 4: Also populate ALL other users from their customer/employee records
UPDATE public.users u
SET 
  first_name = COALESCE(c.first_name, u.first_name),
  last_name = COALESCE(c.last_name, u.last_name)
FROM public.customers c
WHERE u.id = c.id 
  AND u.first_name IS NULL;

UPDATE public.users u
SET 
  first_name = COALESCE(e.first_name, u.first_name),
  last_name = COALESCE(e.last_name, u.last_name)
FROM public.employees e
WHERE u.id = e.id 
  AND u.first_name IS NULL;

-- Step 5: Final verification - check all users have names
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN first_name IS NOT NULL THEN 1 END) as with_names,
  COUNT(CASE WHEN first_name IS NULL THEN 1 END) as missing_names
FROM public.users;
