-- Supabase PostgreSQL Schema for Washlee - IMPORT VERSION
-- Migration from Firebase Firestore
-- NOTE: This version removes auth.users FK constraint for initial data import
-- After importing data, create auth.users entries separately via Supabase Auth API

-- ============================================
-- 1. USERS TABLES (Must be first)
-- ============================================

-- Main users table (without auth.users reference for import)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
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
-- 2. ORDERS TABLES
-- ============================================

-- Main orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY,
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
-- 3. WASH CLUB TABLES
-- ============================================

-- Wash club memberships
CREATE TABLE IF NOT EXISTS public.wash_clubs (
  id UUID PRIMARY KEY,
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
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Wash club verification process
CREATE TABLE IF NOT EXISTS public.wash_club_verification (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  verification_code TEXT NOT NULL,
  code_verified BOOLEAN DEFAULT FALSE,
  code_expires_at TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  card_present BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Wash club transaction history
CREATE TABLE IF NOT EXISTS public.wash_club_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_type TEXT CHECK (transaction_type IN ('credit_earned', 'credit_redeemed', 'manual_adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  previous_balance DECIMAL(10, 2),
  new_balance DECIMAL(10, 2),
  order_id UUID REFERENCES public.orders(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. REVIEWS & RATINGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  categories JSONB DEFAULT '{}'::JSONB,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderation_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. TRANSACTIONS & PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('payment', 'refund', 'credit', 'payout')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  stripe_transaction_id TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. INQUIRIES & SUPPORT
-- ============================================

CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  inquiry_type TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. VERIFICATION CODES
-- ============================================

CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  type TEXT CHECK (type IN ('email', 'phone', 'password_reset')),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_pro_id ON public.orders(pro_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_pro_id ON public.reviews(pro_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON public.verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_wash_clubs_user_id ON public.wash_clubs(user_id);

-- ============================================
-- RLS Policies (Row Level Security)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Customers can view their orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (user_id = auth.uid() OR pro_id = auth.uid());

-- Admins can see everything (use a boolean flag or role check)
CREATE POLICY "Admins can see all orders" ON public.orders
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE
  ));
