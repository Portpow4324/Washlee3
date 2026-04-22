-- Fix existing user's metadata to include ALL user details
-- This updates the auth user record with comprehensive metadata
-- New signups automatically get all this data, but existing users need this fix

-- Step 1: Check current metadata for your account
SELECT id, email, raw_user_meta_data FROM auth.users 
WHERE email = 'lukaverde6@gmail.com';

-- Step 2: Update metadata with COMPLETE user information
-- IMPORTANT: Replace the placeholder values with your actual information:
-- - "Luka" → your first name
-- - "Verde" → your last name  
-- - "+1-555-1234" → your phone number (or remove if not available)
-- - "NSW" → your state (optional)

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
  'is_admin', false,
  'is_employee', false,
  'created_at', now()::text,
  'phone_verified', false
)
WHERE email = 'lukaverde6@gmail.com';

-- Step 3: Verify the update - should show all fields now
SELECT id, email, raw_user_meta_data FROM auth.users 
WHERE email = 'lukaverde6@gmail.com';

-- Step 4: After running this in Supabase:
-- 1. Return to app and rebuild: npm run build && npm run dev
-- 2. Log out completely from the app
-- 3. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
-- 4. Close browser completely
-- 5. Reopen browser and log back in
-- 6. Check header - should show "Luka Verde" instead of "lukaverde6"
