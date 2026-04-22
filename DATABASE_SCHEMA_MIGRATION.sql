-- ============================================================================
-- Employee Dashboard Database Schema Setup
-- ============================================================================
-- This migration adds the necessary columns and tables for the Employee 
-- Dashboard to work with real data instead of mock data.
--
-- Run these migrations in order in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Modify existing ORDERS table
-- ============================================================================

-- Add employee_id column to track which employee handles the order
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add status column for order workflow (pending-pickup, in-progress, completed)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'pending-pickup', 'in-progress', 'completed', 'cancelled'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_employee_id ON orders(employee_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_employee_status ON orders(employee_id, status);

-- ============================================================================
-- STEP 2: Create JOBS table (if it doesn't exist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR UNIQUE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  pickup_address TEXT,
  delivery_address TEXT,
  pickup_time TIMESTAMP,
  delivery_time TIMESTAMP,
  weight TEXT,
  services JSONB,
  rate DECIMAL(10, 2),
  distance TEXT,
  rush BOOLEAN DEFAULT FALSE,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'accepted', 'in-progress', 'completed', 'cancelled')),
  posted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_jobs_accepted_by ON jobs(accepted_by);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at DESC);

-- ============================================================================
-- STEP 3: Create EMPLOYEE_AVAILABILITY table
-- ============================================================================
-- Stores work schedule and availability for each employee

-- Drop if exists and recreate
DROP TABLE IF EXISTS employee_availability CASCADE;

CREATE TABLE employee_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Employee reference
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- JSONB structure for day-based availability
  -- Format: { monday: { available: bool, start: "HH:MM", end: "HH:MM" }, ... }
  availability_schedule JSONB DEFAULT '{
    "monday": {"available": true, "start": "09:00", "end": "17:00"},
    "tuesday": {"available": true, "start": "09:00", "end": "17:00"},
    "wednesday": {"available": true, "start": "09:00", "end": "17:00"},
    "thursday": {"available": true, "start": "09:00", "end": "17:00"},
    "friday": {"available": true, "start": "09:00", "end": "17:00"},
    "saturday": {"available": true, "start": "10:00", "end": "14:00"},
    "sunday": {"available": false, "start": "00:00", "end": "00:00"}
  }',
  
  -- Service radius in kilometers
  service_radius_km INT DEFAULT 10,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(employee_id)
);

-- Create index for faster lookups
CREATE INDEX idx_employee_availability_employee_id ON employee_availability(employee_id);

-- ============================================================================
-- STEP 4: Create PAYOUTS table
-- ============================================================================
-- Tracks payout requests and history

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Employee reference
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payout details
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  
  -- Bank account information (stored as JSONB for flexibility)
  -- Format: { accountHolder, accountNumber, bsb, bankName, accountType }
  account_details JSONB NOT NULL,
  
  -- Account type (savings, checking, business)
  account_type VARCHAR(20) NOT NULL DEFAULT 'savings' CHECK (account_type IN ('savings', 'checking', 'business')),
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Timestamps
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  failed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Admin notes
  notes TEXT,
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (processed_at IS NULL OR processed_at >= requested_at),
  CONSTRAINT valid_failed_dates CHECK (failed_at IS NULL OR failed_at >= requested_at)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payouts_employee_id ON payouts(employee_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_requested_at ON payouts(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_employee_status ON payouts(employee_id, status);

-- ============================================================================
-- STEP 5: Create EARNINGS_HISTORY table (optional but recommended)
-- ============================================================================
-- Denormalized table for faster earnings calculations

CREATE TABLE IF NOT EXISTS earnings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Employee and order references
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Earnings data
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AUD',
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid_out')),
  
  -- Timestamps
  earned_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  paid_out_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_earnings_employee_id ON earnings_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON earnings_history(status);
CREATE INDEX IF NOT EXISTS idx_earnings_earned_at ON earnings_history(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_employee_status ON earnings_history(employee_id, status);

-- ============================================================================
-- STEP 6: Update existing ORDERS table with additional helpful columns
-- ============================================================================

-- Add rating/review columns if not present
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS rating INT CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS review TEXT,
ADD COLUMN IF NOT EXISTS earnings DECIMAL(10, 2);

-- ============================================================================
-- STEP 7: Add RLS (Row Level Security) Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_history ENABLE ROW LEVEL SECURITY;

-- Employee can view their own availability
CREATE POLICY "Employees can view own availability"
  ON employee_availability FOR SELECT
  USING (auth.uid() = employee_id OR (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Employee can update their own availability
CREATE POLICY "Employees can update own availability"
  ON employee_availability FOR UPDATE
  USING (auth.uid() = employee_id)
  WITH CHECK (auth.uid() = employee_id);

-- Employee can insert their own availability
CREATE POLICY "Employees can insert own availability"
  ON employee_availability FOR INSERT
  WITH CHECK (auth.uid() = employee_id);

-- Employees can view their own payouts
CREATE POLICY "Employees can view own payouts"
  ON payouts FOR SELECT
  USING (auth.uid() = employee_id OR (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Employees can insert payout requests
CREATE POLICY "Employees can request payouts"
  ON payouts FOR INSERT
  WITH CHECK (auth.uid() = employee_id);

-- Employees can view their earnings history
CREATE POLICY "Employees can view own earnings"
  ON earnings_history FOR SELECT
  USING (auth.uid() = employee_id OR (SELECT role FROM auth.users WHERE id = auth.uid()) = 'admin');

-- ============================================================================
-- STEP 8: Create helpful functions
-- ============================================================================

-- Function to calculate employee balance
CREATE OR REPLACE FUNCTION get_employee_balance(emp_id UUID)
RETURNS TABLE (
  available_balance DECIMAL,
  completed_earnings DECIMAL,
  pending_earnings DECIMAL,
  total_paid_out DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(eh.amount), 0) - COALESCE(SUM(p.amount), 0)::DECIMAL as available_balance,
    COALESCE(SUM(CASE WHEN eh.status = 'completed' THEN eh.amount ELSE 0 END), 0)::DECIMAL as completed_earnings,
    COALESCE(SUM(CASE WHEN eh.status = 'pending' THEN eh.amount ELSE 0 END), 0)::DECIMAL as pending_earnings,
    COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0)::DECIMAL as total_paid_out
  FROM earnings_history eh
  LEFT JOIN payouts p ON p.employee_id = eh.employee_id AND p.status = 'completed'
  WHERE eh.employee_id = emp_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get employee earnings for timeframe
CREATE OR REPLACE FUNCTION get_employee_earnings(emp_id UUID, timeframe TEXT)
RETURNS TABLE (
  total DECIMAL,
  paid DECIMAL,
  pending DECIMAL,
  orders INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(eh.amount), 0)::DECIMAL as total,
    COALESCE(SUM(CASE WHEN eh.status = 'completed' THEN eh.amount ELSE 0 END), 0)::DECIMAL as paid,
    COALESCE(SUM(CASE WHEN eh.status = 'pending' THEN eh.amount ELSE 0 END), 0)::DECIMAL as pending,
    COUNT(DISTINCT eh.order_id)::INT as orders
  FROM earnings_history eh
  WHERE eh.employee_id = emp_id
  AND (
    CASE 
      WHEN timeframe = 'week' THEN eh.earned_at >= NOW() - INTERVAL '7 days'
      WHEN timeframe = 'month' THEN eh.earned_at >= NOW() - INTERVAL '30 days'
      WHEN timeframe = 'all' THEN true
      ELSE false
    END
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 9: Verify the schema
-- ============================================================================

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'jobs', 'employee_availability', 'payouts', 'earnings_history')
ORDER BY table_name;

-- ============================================================================
-- STEP 10: Sample data for testing (OPTIONAL)
-- ============================================================================

-- Insert sample availability
INSERT INTO employee_availability (employee_id, availability_schedule, service_radius_km)
VALUES (
  'ae4b5696-e9d5-47d4-9351-94e3ee9bd598',
  '{
    "monday": {"available": true, "start": "09:00", "end": "17:00"},
    "tuesday": {"available": true, "start": "09:00", "end": "17:00"},
    "wednesday": {"available": true, "start": "09:00", "end": "17:00"},
    "thursday": {"available": true, "start": "09:00", "end": "17:00"},
    "friday": {"available": true, "start": "09:00", "end": "17:00"},
    "saturday": {"available": true, "start": "10:00", "end": "14:00"},
    "sunday": {"available": false, "start": "00:00", "end": "00:00"}
  }',
  15
)
ON CONFLICT (employee_id) DO UPDATE SET
  availability_schedule = EXCLUDED.availability_schedule,
  service_radius_km = EXCLUDED.service_radius_km,
  updated_at = NOW();

-- ============================================================================
-- DONE!
-- ============================================================================
-- Your database schema is now ready for the Employee Dashboard
-- All tables, indexes, RLS policies, and functions have been created
-- ============================================================================
