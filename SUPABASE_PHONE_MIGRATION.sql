-- ============================================================================
-- SUPABASE SQL: Add Phone Verification to Users Table
-- ============================================================================
-- Paste this entire block into Supabase SQL Editor and run
-- Location: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================================

-- Step 1: Add phone column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;

-- Step 2: Add phone_verified column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Step 3: Add phone_verified_at column (timestamp of when verified)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone_verified);

-- Step 5: Add unique constraint on phone (prevents duplicates, allows multiple NULLs)
ALTER TABLE users
ADD CONSTRAINT unique_phone UNIQUE (phone) WHERE phone IS NOT NULL;

-- Step 6: Verify the columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('phone', 'phone_verified', 'phone_verified_at')
ORDER BY ordinal_position;

-- ============================================================================
-- OPTIONAL: If you want to add phone_verified_at to customers table too
-- ============================================================================
-- ALTER TABLE customers 
-- ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
--
-- ALTER TABLE customers
-- ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- ============================================================================
-- OPTIONAL: If you want to add phone_verified_at to employees table too
-- ============================================================================
-- ALTER TABLE employees 
-- ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
--
-- ALTER TABLE employees
-- ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
