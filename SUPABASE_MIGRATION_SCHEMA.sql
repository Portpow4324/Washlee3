-- Supabase PostgreSQL Schema for Washlee
-- Migration from Firebase Firestore
-- Created: 2024-01-18

-- ============================================
-- 1. USERS TABLES
-- ============================================

-- Main users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT UNIQUE,
  user_type TEXT CHECK (user_type IN ('customer', 'pro', 'admin')),
  is_admin BOOLEAN DEFAULT FALSE,
  is_employee BOOLEAN DEFAULT FALSE,
  is_loyalty_member BOOLEAN DEFAULT FALSE,
  profile_picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers collection
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
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

-- ============================================
-- 2. WASH CLUB TABLES
-- ============================================

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
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Credit transactions/audit trail
CREATE TABLE IF NOT EXISTS public.wash_club_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wash_club_id UUID NOT NULL REFERENCES public.wash_clubs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sign_up_bonus', 'order_earnings', 'redemption', 'manual_adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  order_id UUID REFERENCES public.orders(id),
  tier_level INTEGER,
  balance_before DECIMAL(10, 2),
  balance_after DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. ORDERS TABLES
-- ============================================

-- Main orders table
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

-- ============================================
-- 4. REVIEWS TABLES
-- ============================================

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

-- ============================================
-- 5. INQUIRIES TABLES
-- ============================================

-- General inquiries/applications
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
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
  admin_notes TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. TRANSACTIONS TABLES
-- ============================================

-- Payment transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('payment', 'refund', 'adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  stripe_transaction_id TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. VERIFICATION CODE TABLE
-- ============================================

-- General verification codes
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'password_reset')),
  code TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 8. INDEXES
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

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
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
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

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

-- Admins can do everything (will be checked server-side)
-- This is a basic foundation; adjust based on your admin role system

-- ============================================
-- 10. UTILITY FUNCTIONS
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
