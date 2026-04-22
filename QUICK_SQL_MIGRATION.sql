-- ============================================================
-- QUICK REFERENCE: Copy & Paste This Into Supabase SQL Editor
-- ============================================================
-- 
-- Steps:
-- 1. Go to https://app.supabase.com
-- 2. Select your Washlee project
-- 3. Click "SQL Editor" (left sidebar)
-- 4. Click "New Query" button
-- 5. Delete any placeholder text
-- 6. Copy everything from this file
-- 7. Paste into the SQL editor
-- 8. Click the "Run" button (play icon)
-- 9. Wait for "Executed successfully" message
-- 10. Done! Check "Tables" section to verify
--
-- Time required: Less than 1 minute
-- ============================================================

-- Create pro_jobs table for job assignment workflow
CREATE TABLE IF NOT EXISTS pro_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  pro_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'available' NOT NULL,
  posted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_status CHECK (status IN ('available', 'accepted', 'in_progress', 'completed', 'cancelled'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pro_jobs_status ON pro_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pro_jobs_pro_id ON pro_jobs(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_jobs_order_id ON pro_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_pro_jobs_posted_at ON pro_jobs(posted_at DESC);

-- Create trigger for auto-updating timestamps
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

-- Create pro_earnings table for tracking earnings
CREATE TABLE IF NOT EXISTS pro_earnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pro_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  payment_method VARCHAR(50),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  notes TEXT,
  CONSTRAINT valid_earnings_status CHECK (status IN ('pending', 'paid', 'withheld', 'disputed')),
  CONSTRAINT valid_amount CHECK (amount >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pro_earnings_pro_id ON pro_earnings(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_earnings_status ON pro_earnings(status);
CREATE INDEX IF NOT EXISTS idx_pro_earnings_created_at ON pro_earnings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_earnings_pro_id_status ON pro_earnings(pro_id, status);

-- Create trigger for auto-updating timestamps
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

-- Create view for earnings summary (optional, for reporting)
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

-- ============================================================
-- VERIFICATION COMMANDS (Run these after to confirm success)
-- ============================================================

-- Should return 0 (table empty but exists)
-- SELECT COUNT(*) FROM pro_jobs;

-- Should return 0 (table empty but exists)
-- SELECT COUNT(*) FROM pro_earnings;

-- Should show the indexes we created
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename IN ('pro_jobs', 'pro_earnings')
-- ORDER BY indexname;
