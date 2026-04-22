-- FIX: Add missing phone_verified column to users table
-- Run this in Supabase SQL Editor to fix the signup issue

-- Since tables are empty (fresh start), recreate the users table with the correct schema
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT UNIQUE,
  user_type TEXT CHECK (user_type IN ('customer', 'pro', 'admin')),
  is_admin BOOLEAN DEFAULT FALSE,
  is_employee BOOLEAN DEFAULT FALSE,
  is_loyalty_member BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  profile_picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Recreate trigger
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();