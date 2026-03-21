-- Washlee Supabase Complete Backend Tables Setup
-- ================================================
-- This SQL reflects the actual Washlee database schema
-- Copy and paste this SQL into your Supabase SQL editor
-- Go to: Supabase Dashboard → Your Project → SQL Editor → New Query
-- Then paste this entire script and click "Run"

-- ============================================
-- DROP EXISTING TABLES (Clean Slate)
-- ============================================

DROP TABLE IF EXISTS wholesale_inquiries CASCADE;
DROP TABLE IF EXISTS wash_club_verification CASCADE;
DROP TABLE IF EXISTS wash_club_transactions CASCADE;
DROP TABLE IF EXISTS wash_club_tiers CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS pro_certifications CASCADE;
DROP TABLE IF EXISTS inquiries CASCADE;
DROP TABLE IF EXISTS employee_documents CASCADE;
DROP TABLE IF EXISTS employee_availability CASCADE;
DROP TABLE IF EXISTS employee_payouts CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS business_accounts CASCADE;
DROP TABLE IF EXISTS stripe_events CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- CORE USER TABLES
-- ============================================

-- Create master users table for admin/role tracking
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT false,
  user_type TEXT DEFAULT 'customer',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  state TEXT,
  personal_use TEXT,
  preference_marketing_texts BOOLEAN DEFAULT false,
  preference_account_texts BOOLEAN DEFAULT true,
  selected_plan TEXT DEFAULT 'none',
  account_status TEXT DEFAULT 'active',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employees/pros table
CREATE TABLE employees (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  employee_id TEXT UNIQUE,
  account_status TEXT DEFAULT 'pending',
  role TEXT DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BUSINESS OPERATION TABLES
-- ============================================

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  weight NUMERIC(10, 2) NOT NULL,
  service_type TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  pickup_date TIMESTAMP WITH TIME ZONE,
  delivery_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin logs table
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin notifications table
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_id TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email logs table (for tracking sent emails)
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_type TEXT,
  status TEXT DEFAULT 'pending',
  message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment/stripe events table
CREATE TABLE stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business accounts table (for wholesale)
CREATE TABLE business_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  abn TEXT UNIQUE,
  business_type TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postcode TEXT,
  verification_status TEXT DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table (customer notifications)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'order_update',
  read BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee payouts table
CREATE TABLE employee_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payout_method TEXT,
  bank_account_number TEXT,
  bsb TEXT,
  account_holder_name TEXT,
  pending_amount NUMERIC(10, 2) DEFAULT 0,
  total_earned NUMERIC(10, 2) DEFAULT 0,
  last_payout_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee availability table
CREATE TABLE employee_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee documents table
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  document_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inquiries table (wholesale inquiries)
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  estimated_weight NUMERIC(10, 2) NOT NULL,
  order_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service categories table
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  price_per_kg NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pro certifications table
CREATE TABLE pro_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  certification_type TEXT NOT NULL,
  certification_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_price NUMERIC(10, 2) NOT NULL,
  billing_cycle TEXT,
  status TEXT DEFAULT 'active',
  stripe_subscription_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  transaction_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  stripe_transaction_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification codes table
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wash club tiers table
CREATE TABLE wash_club_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  monthly_price NUMERIC(10, 2) NOT NULL,
  monthly_credits INTEGER NOT NULL,
  benefits JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wash club transactions table
CREATE TABLE wash_club_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES wash_club_tiers(id) ON DELETE CASCADE,
  credits_used INTEGER NOT NULL,
  credits_remaining INTEGER NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wash club verification table
CREATE TABLE wash_club_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES wash_club_tiers(id) ON DELETE CASCADE,
  verification_status TEXT DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_is_admin_idx ON users(is_admin);
CREATE INDEX users_user_type_idx ON users(user_type);
CREATE INDEX customers_email_idx ON customers(email);
CREATE INDEX customers_account_status_idx ON customers(account_status);
CREATE INDEX customers_role_idx ON customers(role);
CREATE INDEX employees_email_idx ON employees(email);
CREATE INDEX employees_account_status_idx ON employees(account_status);
CREATE INDEX admin_logs_admin_id_idx ON admin_logs(admin_id);
CREATE INDEX admin_logs_created_at_idx ON admin_logs(created_at DESC);
CREATE INDEX admin_notifications_recipient_idx ON admin_notifications(recipient_id);
CREATE INDEX admin_notifications_read_idx ON admin_notifications(read);
CREATE INDEX email_logs_recipient_idx ON email_logs(recipient_email);
CREATE INDEX email_logs_status_idx ON email_logs(status);
CREATE INDEX stripe_events_event_id_idx ON stripe_events(stripe_event_id);
CREATE INDEX stripe_events_processed_idx ON stripe_events(processed);
CREATE INDEX orders_customer_id_idx ON orders(customer_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX business_accounts_customer_id_idx ON business_accounts(customer_id);
CREATE INDEX business_accounts_status_idx ON business_accounts(verification_status);
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX notifications_read_idx ON notifications(read);
CREATE INDEX employee_payouts_employee_id_idx ON employee_payouts(employee_id);
CREATE INDEX employee_payouts_status_idx ON employee_payouts(status);
CREATE INDEX employee_availability_employee_id_idx ON employee_availability(employee_id);
CREATE INDEX employee_availability_day_idx ON employee_availability(day_of_week);
CREATE INDEX employee_documents_employee_id_idx ON employee_documents(employee_id);
CREATE INDEX employee_documents_status_idx ON employee_documents(status);
CREATE INDEX inquiries_status_idx ON inquiries(status);
CREATE INDEX inquiries_created_at_idx ON inquiries(created_at DESC);
CREATE INDEX reviews_customer_id_idx ON reviews(customer_id);
CREATE INDEX reviews_employee_id_idx ON reviews(employee_id);
CREATE INDEX pro_certifications_employee_id_idx ON pro_certifications(employee_id);
CREATE INDEX pro_certifications_status_idx ON pro_certifications(status);
CREATE INDEX subscriptions_customer_id_idx ON subscriptions(customer_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);
CREATE INDEX transactions_customer_id_idx ON transactions(customer_id);
CREATE INDEX transactions_status_idx ON transactions(status);
CREATE INDEX verification_codes_email_idx ON verification_codes(email);
CREATE INDEX verification_codes_used_idx ON verification_codes(used);
CREATE INDEX wash_club_transactions_customer_id_idx ON wash_club_transactions(customer_id);
CREATE INDEX wash_club_verification_customer_id_idx ON wash_club_verification(customer_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_club_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_club_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_club_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE RLS POLICIES
-- ============================================

-- Users can view their own record
CREATE POLICY "Users view own record"
  ON users FOR SELECT
  USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

-- Only admins can update user records
CREATE POLICY "Only admins update users"
  ON users FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- CUSTOMER RLS POLICIES
-- ============================================

-- Customers can view their own profile
CREATE POLICY "Customers view own profile"
  ON customers FOR SELECT
  USING (auth.uid() = id OR role = 'admin');

-- Customers can insert their own profile
CREATE POLICY "Customers insert own profile"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'authenticated');

-- Customers can update their own profile
CREATE POLICY "Customers update own profile"
  ON customers FOR UPDATE
  USING (auth.uid() = id OR role = 'admin');

-- ============================================
-- EMPLOYEE RLS POLICIES
-- ============================================

-- Employees can view their own profile
CREATE POLICY "Employees view own profile"
  ON employees FOR SELECT
  USING (auth.uid() = id);

-- Employees can insert their own profile
CREATE POLICY "Employees insert own profile"
  ON employees FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'authenticated');

-- Employees can update their own profile
CREATE POLICY "Employees update own profile"
  ON employees FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- ORDER RLS POLICIES
-- ============================================

-- Customers can view their own orders
CREATE POLICY "Customers view own orders"
  ON orders FOR SELECT
  USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Customers can create orders
CREATE POLICY "Customers create orders"
  ON orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Customers can update their own orders
CREATE POLICY "Customers update own orders"
  ON orders FOR UPDATE
  USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- ADMIN OPERATIONS RLS POLICIES
-- ============================================

-- Admin logs - only admins can view
CREATE POLICY "Admins view admin logs"
  ON admin_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Admin notifications - only visible to recipient
CREATE POLICY "Admins view own notifications"
  ON admin_notifications FOR SELECT
  USING (recipient_id = auth.uid());

-- Email logs - only admins can view
CREATE POLICY "Email logs read only"
  ON email_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Stripe events - only admins can view
CREATE POLICY "Stripe events read only"
  ON stripe_events FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- BUSINESS ACCOUNT POLICIES
-- ============================================

-- Business accounts - customers view own, admins view all
CREATE POLICY "Customers view own business account"
  ON business_accounts FOR SELECT
  USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Customers insert own business account"
  ON business_accounts FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers update own business account"
  ON business_accounts FOR UPDATE
  USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Notifications - users view own
CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- EMPLOYEE PAYOUTS POLICIES
-- ============================================

-- Employee payouts - employees view own, admins view all
CREATE POLICY "Employees view own payouts"
  ON employee_payouts FOR SELECT
  USING (employee_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Employees insert own payouts"
  ON employee_payouts FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees update own payouts"
  ON employee_payouts FOR UPDATE
  USING (employee_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- EMPLOYEE AVAILABILITY POLICIES
-- ============================================

-- Employee availability - employees manage own, admins manage all
CREATE POLICY "Employees view own availability"
  ON employee_availability FOR SELECT
  USING (employee_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Employees insert own availability"
  ON employee_availability FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees update own availability"
  ON employee_availability FOR UPDATE
  USING (employee_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Employees delete own availability"
  ON employee_availability FOR DELETE
  USING (employee_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- EMPLOYEE DOCUMENTS POLICIES
-- ============================================

-- Employee documents - employees manage own, admins manage all
CREATE POLICY "Employees view own documents"
  ON employee_documents FOR SELECT
  USING (employee_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Employees insert own documents"
  ON employee_documents FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees update own documents"
  ON employee_documents FOR UPDATE
  USING (employee_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- INQUIRIES POLICIES
-- ============================================

-- Public inquiries submission
CREATE POLICY "Anyone can submit inquiry"
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- Admins view all inquiries
CREATE POLICY "Admins view inquiries"
  ON inquiries FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- REVIEWS POLICIES
-- ============================================

-- Users can view reviews
CREATE POLICY "Users view reviews"
  ON reviews FOR SELECT
  USING (true);

-- Customers can create reviews
CREATE POLICY "Customers create reviews"
  ON reviews FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- ============================================
-- PRO CERTIFICATIONS POLICIES
-- ============================================

-- Employees view own certifications, admins view all
CREATE POLICY "Employees view own certifications"
  ON pro_certifications FOR SELECT
  USING (employee_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Employees insert own certifications"
  ON pro_certifications FOR INSERT
  WITH CHECK (employee_id = auth.uid());

-- ============================================
-- SUBSCRIPTIONS POLICIES
-- ============================================

-- Customers view own subscriptions
CREATE POLICY "Customers view own subscriptions"
  ON subscriptions FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers create subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- ============================================
-- TRANSACTIONS POLICIES
-- ============================================

-- Customers view own transactions
CREATE POLICY "Customers view own transactions"
  ON transactions FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers create transactions"
  ON transactions FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- ============================================
-- VERIFICATION CODES POLICIES
-- ============================================

-- Verification codes - anyone can insert, admins can view
CREATE POLICY "Anyone can request verification code"
  ON verification_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins view verification codes"
  ON verification_codes FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- WASH CLUB POLICIES
-- ============================================

-- Service categories - anyone can view
CREATE POLICY "Service categories public view"
  ON service_categories FOR SELECT
  USING (true);

-- Wash club tiers - anyone can view
CREATE POLICY "Wash club tiers public view"
  ON wash_club_tiers FOR SELECT
  USING (true);

-- Wash club transactions - customers view own, admins view all
CREATE POLICY "Customers view own wash club transactions"
  ON wash_club_transactions FOR SELECT
  USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Customers insert wash club transactions"
  ON wash_club_transactions FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Wash club verification - customers view own, admins view all
CREATE POLICY "Customers view own wash club verification"
  ON wash_club_verification FOR SELECT
  USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Customers insert wash club verification"
  ON wash_club_verification FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- ============================================
-- ENABLE REALTIME FOR KEY TABLES
-- ============================================

ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE employee_payouts REPLICA IDENTITY FULL;
ALTER TABLE subscriptions REPLICA IDENTITY FULL;
ALTER TABLE wash_club_transactions REPLICA IDENTITY FULL;
ALTER TABLE admin_logs REPLICA IDENTITY FULL;
ALTER TABLE admin_notifications REPLICA IDENTITY FULL;
