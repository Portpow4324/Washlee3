-- Fix Supabase Auth Database Issues
-- This script repairs common auth database corruption issues

-- 1. Check and repair identities table constraints
ALTER TABLE auth.identities DROP CONSTRAINT IF EXISTS identities_user_id_fkey;
ALTER TABLE auth.identities ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Check and repair sessions table constraints  
ALTER TABLE auth.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE auth.sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Check and repair mfa_factors table constraints
ALTER TABLE auth.mfa_factors DROP CONSTRAINT IF EXISTS mfa_factors_user_id_fkey;
ALTER TABLE auth.mfa_factors ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Check and repair refresh_tokens table constraints
ALTER TABLE auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_session_id_fkey;
ALTER TABLE auth.refresh_tokens ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;

-- 5. Ensure email index exists properly
DROP INDEX IF EXISTS auth.users_email_key;
CREATE UNIQUE INDEX users_email_key ON auth.users(email);

-- 6. Vacuum and analyze auth schema
VACUUM ANALYZE auth.users;
VACUUM ANALYZE auth.identities;
VACUUM ANALYZE auth.sessions;

-- Verify everything is working
SELECT 
  'Auth Schema Check' as status,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.identities) as total_identities,
  (SELECT COUNT(*) FROM auth.sessions) as total_sessions;
