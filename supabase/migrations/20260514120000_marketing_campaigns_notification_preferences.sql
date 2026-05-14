-- Marketing campaigns and Pro notification preferences.
-- Supports /admin/marketing/campaigns and /employee/settings.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'promotional'
    CHECK (campaign_type IN ('promotional', 'transactional', 'newsletter', 'winback')),
  segments TEXT[] NOT NULL DEFAULT ARRAY['customers']::TEXT[],
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sent')),
  sent_count INTEGER NOT NULL DEFAULT 0,
  open_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  template_key TEXT NOT NULL DEFAULT 'promotional_campaign',
  subject TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  cta_url TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status
  ON public.marketing_campaigns(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_at
  ON public.marketing_campaigns(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{
    "new_jobs": true,
    "order_reminders": true,
    "earnings_payouts": true,
    "customer_messages": true,
    "marketing": false
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
  ON public.notification_preferences(user_id);
