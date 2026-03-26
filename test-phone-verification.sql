-- Phone Verification Testing Script
-- Run this to set up test data and clean up between test runs

-- ============================================================================
-- SETUP: Create test users for phone verification testing
-- ============================================================================

-- Test 1: New user (for signup test)
INSERT INTO users (email, user_type, phone, phone_verified, created_at) 
VALUES ('test.new@washlee.com.au', 'customer', NULL, FALSE, NOW())
ON CONFLICT (email) DO UPDATE SET phone = NULL, phone_verified = FALSE;

-- Test 2: Returning user with no phone
INSERT INTO users (email, user_type, phone, phone_verified, created_at)
VALUES ('test.nophone@washlee.com.au', 'customer', NULL, FALSE, NOW())
ON CONFLICT (email) DO UPDATE SET phone = NULL, phone_verified = FALSE;

-- Test 3: Returning user with phone already verified
INSERT INTO users (email, user_type, phone, phone_verified, created_at)
VALUES ('test.verified@washlee.com.au', 'customer', '0412345678', TRUE, NOW())
ON CONFLICT (email) DO UPDATE SET phone = '0412345678', phone_verified = TRUE;

-- Test 4: Returning user with phone not verified
INSERT INTO users (email, user_type, phone, phone_verified, created_at)
VALUES ('test.unverified@washlee.com.au', 'customer', '0487654321', FALSE, NOW())
ON CONFLICT (email) DO UPDATE SET phone = '0487654321', phone_verified = FALSE;

-- Test 5: Pro user for pro signup existing customer test
INSERT INTO users (email, user_type, phone, phone_verified, created_at)
VALUES ('test.pro@washlee.com.au', 'employee', '0498765432', TRUE, NOW())
ON CONFLICT (email) DO UPDATE SET user_type = 'employee', phone = '0498765432', phone_verified = TRUE;

-- ============================================================================
-- VERIFICATION: Check test users exist
-- ============================================================================
SELECT email, user_type, phone, phone_verified FROM users 
WHERE email LIKE 'test.%@washlee.com.au'
ORDER BY email;

-- ============================================================================
-- CLEANUP: Run between test runs to reset state
-- ============================================================================
-- DELETE FROM verification_codes WHERE user_id IN (
--   SELECT id FROM users WHERE email LIKE 'test.%@washlee.com.au'
-- );
--
-- UPDATE users 
-- SET phone = NULL, phone_verified = FALSE 
-- WHERE email IN (
--   'test.new@washlee.com.au',
--   'test.nophone@washlee.com.au',
--   'test.unverified@washlee.com.au'
-- );

-- ============================================================================
-- DEBUG: Verify verification codes table structure
-- ============================================================================
-- \d verification_codes
-- SELECT * FROM verification_codes ORDER BY created_at DESC LIMIT 10;

-- ============================================================================
-- USEFUL QUERIES for manual testing
-- ============================================================================

-- View all test users
-- SELECT id, email, user_type, phone, phone_verified, created_at FROM users 
-- WHERE email LIKE 'test.%@washlee.com.au' ORDER BY email;

-- View recent verification codes
-- SELECT id, user_id, code, code_type, expires_at, created_at FROM verification_codes
-- ORDER BY created_at DESC LIMIT 20;

-- View codes for specific user
-- SELECT vc.* FROM verification_codes vc
-- JOIN users u ON u.id = vc.user_id
-- WHERE u.email = 'test.nophone@washlee.com.au'
-- ORDER BY vc.created_at DESC;

-- Check code expiration
-- SELECT id, code, expires_at, NOW() as current_time,
--   EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_remaining
-- FROM verification_codes
-- WHERE expires_at > NOW()
-- ORDER BY expires_at DESC;

-- Clean up expired codes
-- DELETE FROM verification_codes WHERE expires_at < NOW();

-- ============================================================================
-- EDGE CASE TESTING
-- ============================================================================

-- Test duplicate phone detection
-- INSERT INTO users (email, user_type, phone, phone_verified) 
-- VALUES ('test.duplicate@washlee.com.au', 'customer', '0412345678', FALSE);
-- ^ Should fail if phone column has unique constraint

-- Test NULL phone handling
-- SELECT * FROM users WHERE phone IS NULL;

-- Test phone verification state machine
-- SELECT email, phone_verified, 
--   CASE 
--     WHEN phone IS NULL THEN 'No phone'
--     WHEN phone_verified = FALSE THEN 'Unverified'
--     ELSE 'Verified'
--   END as status
-- FROM users WHERE email LIKE 'test.%@washlee.com.au';
