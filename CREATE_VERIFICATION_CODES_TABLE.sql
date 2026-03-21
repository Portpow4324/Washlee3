-- Create verification_codes table to store codes
-- This table stores verification codes for email confirmation
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
  verified_at TIMESTAMP,
  is_used BOOLEAN DEFAULT FALSE
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON public.verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON public.verification_codes(user_id);
