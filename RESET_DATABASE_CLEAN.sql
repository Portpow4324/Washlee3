-- Database Reset Script: Clear All Data While Preserving Schema
-- Purpose: Remove all records from all tables to start fresh
-- Preserves: Table structure, indexes, constraints, column definitions
-- Date: March 26, 2026

-- IMPORTANT: This script will DELETE ALL DATA but keeps table schemas intact
-- Backup your database before running this!

-- Disable foreign key constraints temporarily to allow deletion
SET session_replication_role = 'replica';

-- Clear data from all PUBLIC schema tables (in dependency order)
-- Wash Club Tables
TRUNCATE TABLE public.wash_club_transactions CASCADE;
TRUNCATE TABLE public.wash_club_verification CASCADE;
TRUNCATE TABLE public.wash_club_tiers CASCADE;

-- Order & Review Tables
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.orders CASCADE;

-- Payment & Transaction Tables
TRUNCATE TABLE public.stripe_events CASCADE;
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.subscriptions CASCADE;

-- Verification & Communication Tables
TRUNCATE TABLE public.verification_codes CASCADE;
TRUNCATE TABLE public.email_confirmations CASCADE;
TRUNCATE TABLE public.email_logs CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.admin_notifications CASCADE;

-- Employee & Service Tables
TRUNCATE TABLE public.employee_payouts CASCADE;
TRUNCATE TABLE public.employee_documents CASCADE;
TRUNCATE TABLE public.employee_availability CASCADE;
TRUNCATE TABLE public.pro_certifications CASCADE;
TRUNCATE TABLE public.pro_inquiries CASCADE;
TRUNCATE TABLE public.employees CASCADE;

-- Inquiry Tables
TRUNCATE TABLE public.inquiries CASCADE;

-- User Tables (keep business_accounts for structure, clear data)
TRUNCATE TABLE public.business_accounts CASCADE;
TRUNCATE TABLE public.customers CASCADE;
TRUNCATE TABLE public.admin_logs CASCADE;

-- Keep users table but clear all user data if needed
-- UNCOMMENT BELOW TO ALSO CLEAR USERS (be careful!)
-- TRUNCATE TABLE public.users CASCADE;

-- Re-enable foreign key constraints
SET session_replication_role = 'origin';

-- Verify the reset - show table row counts
SELECT 
  'Data Summary After Reset' as status,
  (SELECT COUNT(*) FROM public.users) as user_count,
  (SELECT COUNT(*) FROM public.customers) as customer_count,
  (SELECT COUNT(*) FROM public.orders) as order_count,
  (SELECT COUNT(*) FROM public.transactions) as transaction_count,
  (SELECT COUNT(*) FROM public.subscriptions) as subscription_count,
  (SELECT COUNT(*) FROM public.wash_club_transactions) as wash_club_transaction_count,
  (SELECT COUNT(*) FROM public.reviews) as review_count,
  (SELECT COUNT(*) FROM public.employees) as employee_count,
  (SELECT COUNT(*) FROM public.admin_logs) as admin_log_count;
