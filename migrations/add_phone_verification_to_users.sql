-- Migration: Add phone verification fields to users table
-- Date: 2026-03-26
-- Description: Add phone and phone_verified columns to enable phone verification flow

-- Add phone column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;

-- Add phone_verified column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Add phone_verified_at column if it doesn't exist (tracks when verification happened)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone_verified);

-- Add unique constraint on phone using a partial index (allows multiple NULLs)
-- This prevents duplicate phone numbers across accounts
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_phone ON users(phone) WHERE phone IS NOT NULL;

-- Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('phone', 'phone_verified', 'phone_verified_at')
ORDER BY ordinal_position;
