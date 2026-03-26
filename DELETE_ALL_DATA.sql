-- COMPLETE DATA DELETION SCRIPT
-- WARNING: This deletes ALL data from ALL tables in the database
-- This is a complete reset - cannot be undone without backup!

-- Disable foreign key constraints temporarily
SET session_replication_role = 'replica';

-- Delete ALL data from ALL tables (complete wipe)
DELETE FROM public.admin_logs;
DELETE FROM public.admin_notifications;
DELETE FROM public.business_accounts;
DELETE FROM public.customers;
DELETE FROM public.email_confirmations;
DELETE FROM public.email_logs;
DELETE FROM public.employee_availability;
DELETE FROM public.employee_documents;
DELETE FROM public.employee_payouts;
DELETE FROM public.employees;
DELETE FROM public.inquiries;
DELETE FROM public.notifications;
DELETE FROM public.orders;
DELETE FROM public.pro_certifications;
DELETE FROM public.pro_inquiries;
DELETE FROM public.reviews;
DELETE FROM public.service_categories;
DELETE FROM public.stripe_events;
DELETE FROM public.subscriptions;
DELETE FROM public.transactions;
DELETE FROM public.verification_codes;
DELETE FROM public.wash_club_tiers;
DELETE FROM public.wash_club_transactions;
DELETE FROM public.wash_club_verification;

-- DELETE AUTH USERS (this deletes from auth.users)
DELETE FROM auth.users;

-- DELETE USERS TABLE
DELETE FROM public.users;

-- Re-enable foreign key constraints
SET session_replication_role = 'origin';

-- Reset all sequences to 1
ALTER SEQUENCE IF EXISTS public.admin_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.admin_notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.business_accounts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.customers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.email_confirmations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.email_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.employee_availability_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.employee_documents_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.employee_payouts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.employees_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.inquiries_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.pro_certifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.pro_inquiries_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.reviews_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.service_categories_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.stripe_events_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.subscriptions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.verification_codes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.wash_club_tiers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.wash_club_transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.wash_club_verification_id_seq RESTART WITH 1;

-- Verify everything is deleted
SELECT 
  'DELETION COMPLETE' as status,
  (SELECT COUNT(*) FROM public.users) as users_remaining,
  (SELECT COUNT(*) FROM public.customers) as customers_remaining,
  (SELECT COUNT(*) FROM public.orders) as orders_remaining,
  (SELECT COUNT(*) FROM public.transactions) as transactions_remaining,
  (SELECT COUNT(*) FROM public.subscriptions) as subscriptions_remaining,
  (SELECT COUNT(*) FROM public.employees) as employees_remaining,
  (SELECT COUNT(*) FROM auth.users) as auth_users_remaining;
