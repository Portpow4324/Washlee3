-- Fix Users Table to Ensure first_name and last_name Exist
-- This migration adds missing name fields and populates them from customer/employee records

BEGIN;

-- Step 1: Check if columns exist, add if missing
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT NULL;

-- Step 2: Populate first_name and last_name from customers table for existing customer users
UPDATE public.users u
SET 
  first_name = COALESCE(c.first_name, u.first_name),
  last_name = COALESCE(c.last_name, u.last_name)
FROM public.customers c
WHERE u.id = c.id 
  AND (u.first_name IS NULL OR u.last_name IS NULL)
  AND u.user_type = 'customer';

-- Step 3: Populate first_name and last_name from employees table for existing pro/employee users
UPDATE public.users u
SET 
  first_name = COALESCE(e.first_name, u.first_name),
  last_name = COALESCE(e.last_name, u.last_name)
FROM public.employees e
WHERE u.id = e.id 
  AND (u.first_name IS NULL OR u.last_name IS NULL)
  AND (u.user_type = 'pro' OR u.is_employee = true);

-- Step 4: Set sensible defaults for any remaining NULL names (fallback to email prefix)
UPDATE public.users
SET 
  first_name = COALESCE(first_name, SPLIT_PART(email, '@', 1)),
  last_name = COALESCE(last_name, '')
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 5: Verify the update worked
SELECT id, email, first_name, last_name, user_type 
FROM public.users 
LIMIT 10;

-- Step 6: Count how many users have names now
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN first_name IS NOT NULL THEN 1 END) as with_first_name,
  COUNT(CASE WHEN last_name IS NOT NULL THEN 1 END) as with_last_name,
  COUNT(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 1 END) as with_both_names
FROM public.users;

COMMIT;
