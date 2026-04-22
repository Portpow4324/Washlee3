-- Fix users table to properly link to auth.users
-- Problem: Insert fails because auth.users record exists but public.users can't reference it

-- Step 1: Check if foreign key exists and drop it
ALTER TABLE IF EXISTS public.users
DROP CONSTRAINT IF EXISTS users_id_fkey CASCADE;

-- Step 2: Ensure ID column exists and is UUID type
ALTER TABLE public.users
ALTER COLUMN id SET NOT NULL;

-- Step 3: Add foreign key constraint to auth.users
ALTER TABLE public.users
ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Step 4: Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;

-- Step 5: Verify the setup
SELECT 
  'users table fixed' as status,
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM auth.users) as auth_users;
