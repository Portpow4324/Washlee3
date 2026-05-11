-- ============================================================================
-- FIX: Employee/Pro Role Recognition in Auth Metadata
-- ============================================================================
-- Problem: Employee accounts not recognized because role field is missing
-- Solution: Add proper 'role' field to auth.users raw_user_meta_data

-- Step 1: Check current metadata for lukaverde3@gmail.com (employee account)
SELECT id, email, raw_user_meta_data FROM auth.users 
WHERE email = 'lukaverde3@gmail.com';

-- Step 2: Update metadata to include proper 'role' field for employee
-- This makes the system recognize the account as both customer AND employee
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', 'Luka Verde',
  'first_name', 'Luka',
  'last_name', 'Verde',
  'email', 'lukaverde3@gmail.com',
  'phone', '+04124581444',
  'state', 'Vic',
  'personal_use', true,
  'user_type', 'employee',
  'role', 'pro',                    -- KEY FIX: Add explicit role field
  'is_admin', false,
  'is_employee', true,              -- Keep this for backward compatibility
  'created_at', now()::text,
  'phone_verified', false
)
WHERE email = 'lukaverde3@gmail.com';

-- Step 3: Verify the update - should show 'role': 'pro' in metadata
SELECT id, email, raw_user_meta_data FROM auth.users 
WHERE email = 'lukaverde3@gmail.com';

-- Step 4: Also update lukaverde6@gmail.com (customer account) with explicit role
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', 'Luka Verde',
  'first_name', 'Luka',
  'last_name', 'Verde',
  'email', 'lukaverde6@gmail.com',
  'phone', '+04124581444',
  'state', 'Vic',
  'personal_use', true,
  'user_type', 'customer',
  'role', 'customer',               -- Explicit customer role
  'is_admin', false,
  'is_employee', false,
  'created_at', now()::text,
  'phone_verified', false
)
WHERE email = 'lukaverde6@gmail.com';

-- Step 5: Verify both accounts
SELECT email, raw_user_meta_data->>'role' as role FROM auth.users 
WHERE email IN ('lukaverde3@gmail.com', 'lukaverde6@gmail.com');

-- ============================================================================
-- EXPLANATION:
-- ============================================================================
-- The system was looking for 'role' field in raw_user_meta_data but it wasn't there
-- Previous system used 'is_employee' boolean which doesn't work for scheduling
-- 
-- NOW:
-- - lukaverde3@gmail.com has role: 'pro' → recognized as employee/pro ✅
-- - lukaverde6@gmail.com has role: 'customer' → recognized as customer ✅
-- 
-- BENEFITS:
-- 1. Scheduling system can find pro users (pro_slot_assignments query)
-- 2. Capacity calculation includes pro availability
-- 3. Employee dashboard properly recognizes employee role
-- 4. Can accept jobs and team usage updates correctly
-- ============================================================================
