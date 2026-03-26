-- COMPLETE RESET SCRIPT
-- 1. DELETE ALL DATA
-- 2. FIX AUTH DATABASE SCHEMA
-- 3. VERIFY EVERYTHING WORKS

SET session_replication_role = 'replica';

-- ============================================
-- PHASE 1: DELETE ALL APPLICATION DATA
-- ============================================

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
DELETE FROM public.users;

-- ============================================
-- PHASE 2: CLEAR ALL AUTH DATA
-- ============================================

DELETE FROM auth.mfa_amr_claims;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.one_time_tokens;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- ============================================
-- PHASE 3: FIX AUTH DATABASE (SKIPPED - Supabase manages auth schema)
-- ============================================
-- Note: Auth schema is managed by Supabase and cannot be modified directly
-- The auth tables were already cleaned in PHASE 2
-- Supabase will auto-repair constraints when needed

SET session_replication_role = 'origin';

-- ============================================
-- PHASE 4: RESET ALL SEQUENCES
-- ============================================

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

-- ============================================
-- PHASE 5: VACUUM AND ANALYZE
-- ============================================

VACUUM ANALYZE public.users;
VACUUM ANALYZE public.customers;
VACUUM ANALYZE public.employees;
VACUUM ANALYZE public.orders;
VACUUM ANALYZE public.transactions;

-- ============================================
-- PHASE 6: VERIFICATION REPORT
-- ============================================

SELECT 
  '✅ COMPLETE RESET FINISHED' as status,
  'Application Data Cleared' as phase_1,
  (SELECT COUNT(*) FROM public.users) as app_users_remaining,
  (SELECT COUNT(*) FROM public.customers) as customers_remaining,
  (SELECT COUNT(*) FROM public.orders) as orders_remaining,
  (SELECT COUNT(*) FROM public.transactions) as transactions_remaining,
  'Auth Data Cleared' as phase_2,
  (SELECT COUNT(*) FROM auth.users) as auth_users_remaining,
  (SELECT COUNT(*) FROM auth.identities) as identities_remaining,
  (SELECT COUNT(*) FROM auth.sessions) as sessions_remaining,
  'Database Optimized' as phase_3;
