-- ============================================
-- FIX: Disable RLS on verification_codes and email_confirmations
-- ============================================
-- Problem: RLS was enabled on these tables but no policies were defined
-- This caused the API server to fail silently when trying to insert verification codes
-- 
-- Solution: Disable RLS on these internal system tables since they're managed entirely by the API
--
-- Impact: Verification flow will now work correctly
-- ============================================

-- Disable RLS on verification_codes (internal system table)
ALTER TABLE public.verification_codes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_select_own_verification_codes ON public.verification_codes;

-- Disable RLS on email_confirmations (internal system table)
ALTER TABLE public.email_confirmations DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_select_own_email_confirmations ON public.email_confirmations;

-- Verify the changes
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('verification_codes', 'email_confirmations');

-- ============================================
-- Expected output:
-- tablename          | rowsecurity
-- ===============================
-- verification_codes | false
-- email_confirmations | false
-- ============================================
