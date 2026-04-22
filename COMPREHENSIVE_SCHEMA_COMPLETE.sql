-- ============================================
-- COMPREHENSIVE WASHLEE DATABASE SCHEMA
-- ============================================
-- This is the COMPLETE schema with ALL tables
-- Merged from all SQL files in the project
-- Run this in Supabase SQL Editor to set up everything
-- ============================================

-- ============================================
-- 1. DROP ALL EXISTING TABLES (Clean Slate)
-- ============================================

DROP TABLE IF EXISTS public.admin_logs CASCADE;
DROP TABLE IF EXISTS public.business_accounts CASCADE;
DROP TABLE IF EXISTS public.email_confirmations CASCADE;
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.employee_availability CASCADE;
DROP TABLE IF EXISTS public.employee_documents CASCADE;
DROP TABLE IF EXISTS public.employee_payouts CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.pro_certifications CASCADE;
DROP TABLE IF EXISTS public.pro_inquiries CASCADE;
DROP TABLE IF EXISTS public.service_categories CASCADE;
DROP TABLE IF EXISTS public.stripe_events CASCADE;
DROP TABLE IF EXISTS public.wash_club_tiers CASCADE;
DROP TABLE IF EXISTS public.wash_club_transactions CASCADE;
DROP TABLE IF EXISTS public.wash_club_verification CASCADE;
DROP TABLE IF EXISTS public.wash_clubs CASCADE;
DROP TABLE IF EXISTS public.verification_codes CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.inquiries CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================
-- 2. CREATE ALL TABLES (Complete Schema)
-- ============================================

-- Main users table (standalone - no auth.users dependency)
CREATE TABLE IF NOT EXISTS public.users (
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

-- Customers collection
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  state TEXT,
  personal_use BOOLEAN DEFAULT FALSE,
  subscription_active BOOLEAN DEFAULT FALSE,
  subscription_plan TEXT,
  subscription_status TEXT,
  payment_status TEXT,
  delivery_address JSONB,
  preferences JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Employees/Pros collection
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT UNIQUE,
  state TEXT,
  address TEXT,
  rating FLOAT DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  earnings DECIMAL(10, 2) DEFAULT 0,
  availability_status TEXT DEFAULT 'available',
  service_areas JSONB DEFAULT '[]'::JSONB,
  bank_account JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscription plans and tiers
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'plus', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT TRUE,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'annually')),
  next_billing_date TIMESTAMP,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'AUD',
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  renewal_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in-transit', 'delivered', 'cancelled')),
  items JSONB DEFAULT '[]'::JSONB,
  total_price DECIMAL(10, 2),
  delivery_address JSONB,
  pickup_address JSONB,
  scheduled_pickup_date DATE,
  scheduled_delivery_date DATE,
  actual_pickup_date TIMESTAMP,
  actual_delivery_date TIMESTAMP,
  pro_id UUID REFERENCES public.users(id),
  tracking_code TEXT UNIQUE,
  notes TEXT,
  wash_club_credits_applied DECIMAL(10, 2) DEFAULT 0,
  tier_discount DECIMAL(10, 2) DEFAULT 0,
  credits_earned DECIMAL(10, 2) DEFAULT 0,
  tier_at_order_time INTEGER,
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Wash club memberships
CREATE TABLE IF NOT EXISTS public.wash_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  card_number TEXT UNIQUE NOT NULL,
  tier INTEGER DEFAULT 1 CHECK (tier >= 1 AND tier <= 4),
  credits_balance DECIMAL(10, 2) DEFAULT 0,
  earned_credits DECIMAL(10, 2) DEFAULT 0,
  redeemed_credits DECIMAL(10, 2) DEFAULT 0,
  total_spend DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  email_verified BOOLEAN DEFAULT FALSE,
  terms_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMP,
  join_date TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email verification codes for Wash Club
CREATE TABLE IF NOT EXISTS public.wash_club_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  code_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  card_present BOOLEAN DEFAULT FALSE,
  code_expires_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Credit transactions/audit trail
CREATE TABLE IF NOT EXISTS public.wash_club_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wash_club_id UUID NOT NULL REFERENCES public.wash_clubs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sign_up_bonus', 'order_earnings', 'redemption', 'manual_adjustment', 'credit_earned', 'credit_redeemed')),
  transaction_type TEXT CHECK (transaction_type IN ('credit_earned', 'credit_redeemed', 'manual_adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  order_id UUID REFERENCES public.orders(id),
  tier_level INTEGER,
  balance_before DECIMAL(10, 2),
  balance_after DECIMAL(10, 2),
  previous_balance DECIMAL(10, 2),
  new_balance DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews collection
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  categories JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderation_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inquiries/applications
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('pro_application', 'wholesale_inquiry', 'partnership', 'customer_inquiry')),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  company_name TEXT,
  inquiry_type TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted', 'new', 'in-progress', 'resolved', 'closed')),
  admin_notes TEXT,
  assigned_to UUID REFERENCES public.users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pro inquiries (separate from general inquiries)
CREATE TABLE IF NOT EXISTS public.pro_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('payment', 'refund', 'adjustment', 'credit', 'payout')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  stripe_transaction_id TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- General verification codes
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'password_reset')),
  code TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin activity logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pro certifications
CREATE TABLE IF NOT EXISTS public.pro_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  issued_date TIMESTAMP,
  expiry_date TIMESTAMP,
  issuer TEXT,
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'expired', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Service categories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  base_price DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Wash club tier definitions
CREATE TABLE IF NOT EXISTS public.wash_club_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_level INTEGER NOT NULL UNIQUE CHECK (tier_level >= 1 AND tier_level <= 4),
  tier_name TEXT NOT NULL,
  description TEXT,
  credits_earned_per_wash INTEGER,
  discount_percentage DECIMAL(5, 2),
  min_annual_spend DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email confirmations
CREATE TABLE IF NOT EXISTS public.email_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  is_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email logs (for tracking sent emails)
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Business accounts
CREATE TABLE IF NOT EXISTS public.business_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  abn TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Employee documents
CREATE TABLE IF NOT EXISTS public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Employee availability
CREATE TABLE IF NOT EXISTS public.employee_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Employee payouts
CREATE TABLE IF NOT EXISTS public.employee_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_date TIMESTAMP,
  bank_account JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stripe events (webhook tracking)
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rate limiting & IP whitelist configuration
CREATE TABLE IF NOT EXISTS public.rate_limit_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Signup attempts tracking (for rate limiting)
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  email TEXT NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2.5 SEED DATA - IP WHITELIST
-- ============================================

-- Essential IPs (required for local testing)
INSERT INTO public.rate_limit_whitelist (ip_address, description, is_active)
VALUES 
  ('127.0.0.1', 'Localhost IPv4 - Essential for local development', true),
  ('::1', 'Localhost IPv6 - Essential for local development', true)
ON CONFLICT (ip_address) DO NOTHING;

-- Optional IPs (for future testing/staging environments)
INSERT INTO public.rate_limit_whitelist (ip_address, description, is_active)
VALUES 
  ('STAGING_IP_1', 'Staging environment - Add your IP here', false),
  ('STAGING_IP_2', 'Testing server - Add your IP here', false),
  ('TESTING_IP_1', 'QA testing - Add your IP here', false)
ON CONFLICT (ip_address) DO NOTHING;

-- ============================================
-- 3. INDEXES (Performance Optimization)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

CREATE INDEX IF NOT EXISTS idx_wash_clubs_user_id ON public.wash_clubs(user_id);
CREATE INDEX IF NOT EXISTS idx_wash_clubs_card_number ON public.wash_clubs(card_number);
CREATE INDEX IF NOT EXISTS idx_wash_clubs_tier ON public.wash_clubs(tier);
CREATE INDEX IF NOT EXISTS idx_wash_clubs_status ON public.wash_clubs(status);

CREATE INDEX IF NOT EXISTS idx_wash_club_verification_user_id ON public.wash_club_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_wash_club_verification_code ON public.wash_club_verification(code);

CREATE INDEX IF NOT EXISTS idx_wash_club_transactions_user_id ON public.wash_club_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wash_club_transactions_wash_club_id ON public.wash_club_transactions(wash_club_id);
CREATE INDEX IF NOT EXISTS idx_wash_club_transactions_type ON public.wash_club_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wash_club_transactions_created_at ON public.wash_club_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_pro_id ON public.orders(pro_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON public.orders(tracking_code);

CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_pro_id ON public.reviews(pro_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

CREATE INDEX IF NOT EXISTS idx_inquiries_type ON public.inquiries(type);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON public.inquiries(email);

CREATE INDEX IF NOT EXISTS idx_pro_inquiries_user_id ON public.pro_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_pro_inquiries_status ON public.pro_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_pro_inquiries_email ON public.pro_inquiries(email);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_recipient_id ON public.admin_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(read);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

CREATE INDEX IF NOT EXISTS idx_email_confirmations_user_id ON public.email_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

CREATE INDEX IF NOT EXISTS idx_business_accounts_customer_id ON public.business_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_business_accounts_abn ON public.business_accounts(abn);
CREATE INDEX IF NOT EXISTS idx_business_accounts_status ON public.business_accounts(status);

CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON public.employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_status ON public.employee_documents(status);

CREATE INDEX IF NOT EXISTS idx_employee_availability_employee_id ON public.employee_availability(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_availability_day ON public.employee_availability(day_of_week);

CREATE INDEX IF NOT EXISTS idx_employee_payouts_employee_id ON public.employee_payouts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_payouts_status ON public.employee_payouts(status);

CREATE INDEX IF NOT EXISTS idx_pro_certifications_employee_id ON public.pro_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_pro_certifications_status ON public.pro_certifications(verification_status);

CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON public.stripe_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON public.stripe_events(processed);

CREATE INDEX IF NOT EXISTS idx_rate_limit_whitelist_ip ON public.rate_limit_whitelist(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_whitelist_active ON public.rate_limit_whitelist(is_active);

CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip ON public.signup_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_email ON public.signup_attempts(email);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_created_at ON public.signup_attempts(created_at);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wash_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wash_club_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wash_club_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- RLS disabled on verification_codes and email_confirmations - internal system tables accessed by API
-- ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.email_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wash_club_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Customers can view their own data
CREATE POLICY customers_select_own ON public.customers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY customers_update_own ON public.customers
  FOR UPDATE USING (auth.uid() = id);

-- Wash club members can view their own membership
CREATE POLICY wash_clubs_select_own ON public.wash_clubs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY wash_clubs_update_own ON public.wash_clubs
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can view their own orders
CREATE POLICY orders_select_own ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = pro_id);

CREATE POLICY orders_insert_own ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own transactions
CREATE POLICY transactions_select_own ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 5. UTILITY FUNCTIONS
-- ============================================

-- Function to generate unique card number
CREATE OR REPLACE FUNCTION generate_card_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'WASH-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || '-' ||
         LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || '-' ||
         LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update_updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wash_clubs_updated_at BEFORE UPDATE ON public.wash_clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_codes_updated_at BEFORE UPDATE ON public.verification_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DATABASE SETUP COMPLETE!
-- ============================================
-- Total Tables Created: 27
-- 
-- Table Summary:
-- 1. users - Main user table
-- 2. customers - Customer profiles
-- 3. employees - Pro/employee profiles
-- 4. subscriptions - Subscription management
-- 5. orders - Customer orders
-- 6. reviews - Order reviews
-- 7. wash_clubs - Loyalty program memberships
-- 8. wash_club_verification - Loyalty verification
-- 9. wash_club_transactions - Loyalty transactions
-- 10. wash_club_tiers - Loyalty tier definitions
-- 11. transactions - Payment transactions
-- 12. inquiries - General inquiries
-- 13. pro_inquiries - Pro applications
-- 14. verification_codes - Email/phone verification
-- 15. email_confirmations - Email confirmation codes
-- 16. email_logs - Email delivery logs
-- 17. admin_logs - Admin activity logs
-- 18. admin_notifications - Admin notifications
-- 19. notifications - User notifications
-- 20. pro_certifications - Pro certifications
-- 21. service_categories - Service types
-- 22. business_accounts - Business accounts
-- 23. employee_documents - Employee documents
-- 24. employee_availability - Employee schedules
-- 25. employee_payouts - Employee payments
-- 26. stripe_events - Stripe webhook logs
--
-- Next Steps:
-- 1. Verify tables exist in Supabase
-- 2. Check that Authentication is enabled
-- 3. Test signup with your API
-- 4. Import any existing data from CSV files
