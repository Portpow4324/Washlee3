-- Migration: Create Missing Pro Tables
-- Date: April 7, 2026
-- Purpose: Set up pro_jobs and pro_earnings tables for job assignment and earnings tracking

-- =====================================================
-- 1. Create pro_jobs table (for job assignment flow)
-- =====================================================
CREATE TABLE IF NOT EXISTS pro_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  pro_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'available' NOT NULL,
  -- Status values: 'available' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  posted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_status CHECK (status IN ('available', 'accepted', 'in_progress', 'completed', 'cancelled'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pro_jobs_status ON pro_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pro_jobs_pro_id ON pro_jobs(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_jobs_order_id ON pro_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_pro_jobs_posted_at ON pro_jobs(posted_at DESC);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pro_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pro_jobs_updated_at_trigger
BEFORE UPDATE ON pro_jobs
FOR EACH ROW
EXECUTE FUNCTION update_pro_jobs_updated_at();

-- =====================================================
-- 2. Create pro_earnings table (for earnings tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS pro_earnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pro_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  -- Status values: 'pending' | 'paid' | 'withheld' | 'disputed'
  payment_method VARCHAR(50), -- 'bank_transfer', 'paypal', etc.
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  notes TEXT,
  CONSTRAINT valid_earnings_status CHECK (status IN ('pending', 'paid', 'withheld', 'disputed')),
  CONSTRAINT valid_amount CHECK (amount >= 0)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pro_earnings_pro_id ON pro_earnings(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_earnings_status ON pro_earnings(status);
CREATE INDEX IF NOT EXISTS idx_pro_earnings_created_at ON pro_earnings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_earnings_pro_id_status ON pro_earnings(pro_id, status);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pro_earnings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pro_earnings_updated_at_trigger
BEFORE UPDATE ON pro_earnings
FOR EACH ROW
EXECUTE FUNCTION update_pro_earnings_updated_at();

-- =====================================================
-- 3. Optional: Create view for earnings summary
-- =====================================================
CREATE OR REPLACE VIEW pro_earnings_summary AS
SELECT 
  pro_id,
  SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
  SUM(CASE WHEN status = 'withheld' THEN amount ELSE 0 END) as total_withheld,
  COUNT(*) as total_transactions,
  MAX(created_at) as last_earning
FROM pro_earnings
GROUP BY pro_id;

-- =====================================================
-- 4. Enable RLS (Row Level Security) - Optional
-- =====================================================
-- Uncomment these if you want to enable RLS for security

-- ALTER TABLE pro_jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pro_earnings ENABLE ROW LEVEL SECURITY;

-- -- Pro can only see their own jobs
-- CREATE POLICY pro_jobs_select_policy ON pro_jobs
-- FOR SELECT
-- USING (
--   auth.uid() = pro_id OR 
--   auth.uid() IN (SELECT id FROM employees WHERE id = pro_id)
-- );

-- -- Pro can only see their own earnings
-- CREATE POLICY pro_earnings_select_policy ON pro_earnings
-- FOR SELECT
-- USING (
--   auth.uid() = pro_id OR
--   auth.uid() IN (SELECT id FROM employees WHERE id = pro_id)
-- );

-- =====================================================
-- 5. Data Migration: Populate pro_earnings from orders
-- =====================================================
-- This inserts initial earnings data for completed orders
-- Run AFTER creating the table, only if you have existing orders

-- INSERT INTO pro_earnings (pro_id, order_id, amount, status, created_at)
-- SELECT 
--   o.pro_id,
--   o.id,
--   o.price * 0.8 as amount,  -- Assume 80% goes to pro
--   CASE WHEN o.status = 'completed' THEN 'pending' ELSE 'pending' END,
--   o.created_at
-- FROM orders o
-- WHERE o.pro_id IS NOT NULL AND o.status IN ('completed', 'in_progress')
-- ON CONFLICT DO NOTHING;
