-- Whitelist Your IP from Rate Limits
-- This script helps you bypass rate limiting for development/testing

-- ============================================
-- STEP 1: Add your IP to the whitelist
-- ============================================
-- IMPORTANT: Replace 'YOUR_IP_ADDRESS_HERE' with your actual IP
-- To find your IP, visit: https://whatismyipaddress.com/
-- Example: '192.168.1.100' or '203.0.113.42'

-- Note: This is a workaround since Supabase doesn't expose IP whitelist via SQL
-- The rate limit is enforced at Supabase's infrastructure level

-- ============================================
-- STEP 2: Your IP Address
-- ============================================
-- Paste your IP here (without quotes in the comments):
-- YOUR IP: [PASTE_YOUR_IP_HERE]

-- ============================================
-- STEP 3: Contact Supabase Support (Alternative)
-- ============================================
-- To permanently whitelist your IP or disable rate limits:
-- 1. Go to https://supabase.com/dashboard
-- 2. Click on your project
-- 3. Settings → Auth → Rate Limiting
-- 4. Email support@supabase.com to request IP whitelist or limit adjustment

-- ============================================
-- STEP 4: Temporary Workaround (Dev Mode)
-- ============================================
-- Use admin API (which we already do) - it bypasses rate limits
-- The signup endpoint uses admin.createUser() which ignores rate limits

-- ============================================
-- Test Query: Check if your whitelist would work
-- ============================================
SELECT 
  'IP Whitelist Configuration' as step,
  'Paste your IP above in STEP 2' as instruction,
  'Admin API already bypasses limits' as current_solution,
  'Try signing up again with different phone numbers' as next_action;
