-- Mobile order chat and support escalation.
-- Order chat is server-mediated only; clients use /api/mobile/orders/:id/messages.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'pro', 'support')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  read_by_customer_at TIMESTAMPTZ,
  read_by_pro_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_messages_order_created
  ON public.order_messages(order_id, created_at);

CREATE INDEX IF NOT EXISTS idx_order_messages_sender
  ON public.order_messages(sender_id);

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT,
  user_id TEXT,
  email TEXT,
  name TEXT,
  phone TEXT,
  company_name TEXT,
  inquiry_type TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS order_id TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_inquiries_type_status_submitted
  ON public.inquiries(type, status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiries_order_id
  ON public.inquiries(order_id);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pickup_address_details JSONB,
  ADD COLUMN IF NOT EXISTS delivery_address_details JSONB;

ALTER TABLE public.pro_jobs
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS warning_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS candidate_pro_ids UUID[] DEFAULT '{}';

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.pro_jobs'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.pro_jobs DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.pro_jobs
  ADD CONSTRAINT pro_jobs_status_check
  CHECK (
    status IN (
      'available',
      'accepted',
      'assigned',
      'in_progress',
      'in-progress',
      'completed',
      'cancelled',
      'canceled',
      'expired'
    )
  );

CREATE INDEX IF NOT EXISTS idx_pro_jobs_expires_at
  ON public.pro_jobs(expires_at);

CREATE INDEX IF NOT EXISTS idx_pro_jobs_candidate_pro_ids
  ON public.pro_jobs USING gin(candidate_pro_ids);
