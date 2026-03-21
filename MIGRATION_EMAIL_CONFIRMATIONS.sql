-- Email Confirmations Tracking Table
-- Tracks email verification status for user signups via SendGrid/Resend

CREATE TABLE IF NOT EXISTS public.email_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'pro')),
  verification_code TEXT,
  email_provider TEXT NOT NULL DEFAULT 'sendgrid', -- 'sendgrid' or 'resend'
  is_confirmed BOOLEAN DEFAULT FALSE,
  confirmation_method TEXT, -- 'link_clicked', 'manual_admin', 'auto_confirmed'
  confirmed_at TIMESTAMP,
  email_sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_email_confirmations_user_id ON public.email_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_email_confirmations_email ON public.email_confirmations(email);
CREATE INDEX IF NOT EXISTS idx_email_confirmations_is_confirmed ON public.email_confirmations(is_confirmed);
CREATE INDEX IF NOT EXISTS idx_email_confirmations_created_at ON public.email_confirmations(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.email_confirmations ENABLE ROW LEVEL SECURITY;

-- Admins can view all email confirmations
CREATE POLICY "Admins can view all email confirmations"
  ON public.email_confirmations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );

-- Admins can update email confirmations
CREATE POLICY "Admins can update email confirmations"
  ON public.email_confirmations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = TRUE
    )
  );
