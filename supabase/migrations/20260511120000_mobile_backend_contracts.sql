-- Mobile backend contracts for the Washlee app.
-- Adds the database surface needed for pro stage updates, pro live location,
-- device token registration, and server-owned booking pricing.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Orders: broaden status support and add mobile/pro tracking fields.
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS employee_id UUID,
  ADD COLUMN IF NOT EXISTS assigned_pro_id UUID,
  ADD COLUMN IF NOT EXISTS stage_status TEXT,
  ADD COLUMN IF NOT EXISTS stage_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS denied_by JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS pickup_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cleaning_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS in_transit_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pro_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pro_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pro_location_accuracy_m DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pro_location_heading DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pro_location_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS delivery_speed TEXT,
  ADD COLUMN IF NOT EXISTS protection_plan TEXT,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS pickup_date DATE,
  ADD COLUMN IF NOT EXISTS delivery_date DATE,
  ADD COLUMN IF NOT EXISTS delivery_time_slot TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pricing_quote JSONB;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (
    status IS NULL OR status IN (
      'pending',
      'confirmed',
      'assigned',
      'accepted',
      'pickup',
      'picked_up',
      'picked-up',
      'processing',
      'cleaning',
      'washing',
      'in_transit',
      'in-transit',
      'transit',
      'out_for_delivery',
      'delivered',
      'completed',
      'cancelled',
      'canceled',
      'refunded'
    )
  );

CREATE INDEX IF NOT EXISTS idx_orders_employee_id ON public.orders(employee_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_pro_id ON public.orders(assigned_pro_id);
CREATE INDEX IF NOT EXISTS idx_orders_stage_status ON public.orders(stage_status);
CREATE INDEX IF NOT EXISTS idx_orders_pro_location_updated ON public.orders(pro_location_updated_at DESC);

-- Employees: live location and mobile availability radius.
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS current_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_location_accuracy_m DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_location_heading DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_location_speed DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_location_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS location_sharing_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS service_radius_km INTEGER DEFAULT 15;

CREATE INDEX IF NOT EXISTS idx_employees_location_updated ON public.employees(current_location_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_employees_location_enabled ON public.employees(location_sharing_enabled);

-- Pro jobs: ensure the job assignment table exists and can carry stage state.
CREATE TABLE IF NOT EXISTS public.pro_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  pro_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'available',
  stage TEXT,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stage_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pro_jobs
  ADD COLUMN IF NOT EXISTS stage TEXT,
  ADD COLUMN IF NOT EXISTS stage_updated_at TIMESTAMPTZ;

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
      'canceled'
    )
  );

CREATE INDEX IF NOT EXISTS idx_pro_jobs_status ON public.pro_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pro_jobs_pro_id ON public.pro_jobs(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_jobs_order_id ON public.pro_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_pro_jobs_posted_at ON public.pro_jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_jobs_stage ON public.pro_jobs(stage);

-- Append-only pro location audit trail.
CREATE TABLE IF NOT EXISTS public.pro_location_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  accuracy_m DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_location_events_employee_created
  ON public.pro_location_events(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_location_events_order_created
  ON public.pro_location_events(order_id, created_at DESC);

-- Device tokens for mobile push registration. Push transport can read this
-- table without exposing token details back to the client.
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL DEFAULT 'unknown',
  device_id TEXT,
  app_version TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_active
  ON public.device_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform
  ON public.device_tokens(platform);

-- Notifications archive support used by the mobile notification center.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_user_archived
  ON public.notifications(user_id, archived);

-- Server-owned mobile pricing source of truth. The API currently mirrors this
-- config in code; this table documents the deployed values and gives backend a
-- canonical row to promote when dynamic pricing is enabled.
CREATE TABLE IF NOT EXISTS public.pricing_config (
  key TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.pricing_config (key, config, active, updated_at)
VALUES (
  'mobile_booking_v1',
  '{
    "currency": "AUD",
    "standardRatePerKg": 7.5,
    "expressRatePerKg": 12.5,
    "minimumOrder": 75,
    "hangDryPrice": 16.5,
    "returnOnHangersPrice": 1.5,
    "protectionPlans": {
      "none": 0,
      "basic": 0,
      "standard": 3.5,
      "premium": 8.5,
      "premium-plus": 8.5
    }
  }'::JSONB,
  TRUE,
  NOW()
)
ON CONFLICT (key) DO UPDATE
SET config = EXCLUDED.config,
    active = EXCLUDED.active,
    updated_at = EXCLUDED.updated_at;
