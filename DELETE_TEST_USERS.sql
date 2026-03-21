-- Delete all test users created during development
-- These are identified by their test email patterns

-- Delete from email_confirmations table first (references user_id)
DELETE FROM public.email_confirmations 
WHERE email LIKE '%@example.com%'
   OR email LIKE '%test-%@%'
   OR email LIKE '%newtest-%@%'
   OR email LIKE '%working-%@%'
   OR email LIKE '%success-%@%'
   OR email LIKE '%finaltest-%@%';

-- Delete from customers table (references user_id)
DELETE FROM public.customers
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@example.com%'
     OR email LIKE '%test-%@%'
     OR email LIKE '%newtest-%@%'
     OR email LIKE '%working-%@%'
     OR email LIKE '%success-%@%'
     OR email LIKE '%finaltest-%@%'
);

-- Delete from employees table (references user_id)
DELETE FROM public.employees
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@example.com%'
     OR email LIKE '%test-%@%'
     OR email LIKE '%newtest-%@%'
     OR email LIKE '%working-%@%'
     OR email LIKE '%success-%@%'
     OR email LIKE '%finaltest-%@%'
);

-- Delete from users table (references auth.users)
DELETE FROM public.users
WHERE email LIKE '%@example.com%'
   OR email LIKE '%test-%@%'
   OR email LIKE '%newtest-%@%'
   OR email LIKE '%working-%@%'
   OR email LIKE '%success-%@%'
   OR email LIKE '%finaltest-%@%';

-- Delete from auth.users (Supabase Auth)
DELETE FROM auth.users 
WHERE email LIKE '%@example.com%'
   OR email LIKE '%test-%@%'
   OR email LIKE '%newtest-%@%'
   OR email LIKE '%working-%@%'
   OR email LIKE '%success-%@%'
   OR email LIKE '%finaltest-%@%';
