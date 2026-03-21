-- WASHLEE FRESH START - COMPLETE DATABASE RESET
-- ============================================================================
-- This script removes ALL users, orders, and test data to start completely fresh.
-- It deletes:
--   - All orders and related data
--   - All employees (pros)
--   - All customers
--   - All users
--   - Everything in auth.users
--
-- WARNING: This is DESTRUCTIVE. Back up your database before running!
-- ============================================================================

BEGIN;

-- Step 1: Delete all orders and order-related data
-- Orders reference users and employees, so delete them first
DELETE FROM public.orders;

-- Step 2: Delete all employees (pros) - they reference auth.users
DELETE FROM public.employees;

-- Step 3: Delete all customers - they reference auth.users
DELETE FROM public.customers;

-- Step 4: Delete all users from public.users table - references auth.users
DELETE FROM public.users;

-- Step 5: Delete ALL auth users from Supabase Auth
DELETE FROM auth.users;

-- Step 6: Reset sequences (auto-increment counters)
-- This ensures IDs start from 1 again
ALTER SEQUENCE IF EXISTS public.orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.employees_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.customers_id_seq RESTART WITH 1;

COMMIT;

-- Verify everything is clean
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.users) as public_users_count,
  (SELECT COUNT(*) FROM public.orders) as orders_count,
  (SELECT COUNT(*) FROM public.employees) as employees_count,
  (SELECT COUNT(*) FROM public.customers) as customers_count;

-- Expected output: all counts should be 0
-- If not 0, check for constraint violations or run again

-- ============================================================================
-- To run this script:
-- 1. Go to Supabase Console → Your Project → SQL Editor
-- 2. Create a new query
-- 3. Copy and paste this entire script
-- 4. Click "Run"
-- 5. Confirm all tables are empty with the verification query at the bottom
-- ============================================================================

-- ============================================================================
-- AFTER RUNNING THIS SCRIPT:
-- You can now:
-- - Create fresh test accounts at /auth/signup
-- - Start completely clean with new data
-- - All IDs will restart from 1
-- ============================================================================
