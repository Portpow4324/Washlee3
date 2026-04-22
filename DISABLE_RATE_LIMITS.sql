-- Disable Supabase rate limiting for development
-- This removes the email send rate limit on auth.users signups

-- Note: This is for DEVELOPMENT ONLY
-- In production, keep rate limits enabled to prevent spam/abuse

-- Check current auth settings (view only, can't modify auth settings directly via SQL)
-- Rate limiting is configured in Supabase dashboard

-- For local development, the rate limit typically resets after:
-- - 15 minutes for email verification
-- - Per-IP basis (not global)

-- To disable rate limits in Supabase:
-- 1. Go to Project Settings → Auth
-- 2. Find "Rate Limiting" section
-- 3. Set to 0 or disable for development
-- 4. Always re-enable before production deploy

-- Alternatively, use different IPs/VPNs to test multiple signups without hitting limit

SELECT 'Rate limiting info' as note, 
  'Rate limits are per-IP address' as scope,
  'Contact Supabase support to adjust' as action;
