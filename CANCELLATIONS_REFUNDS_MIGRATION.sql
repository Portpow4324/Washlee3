-- ============================================================
-- ORDER CANCELLATIONS & REFUNDS TABLES
-- ============================================================
-- Copy & paste this into Supabase SQL Editor
-- ============================================================

-- Create order_cancellations table
CREATE TABLE IF NOT EXISTS order_cancellations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL,
  notes TEXT,
  refund_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_reason CHECK (reason IN ('change_of_mind', 'found_alternative', 'scheduling_conflict', 'damaged_items', 'quality_issues', 'other')),
  CONSTRAINT valid_refund_status CHECK (refund_status IN ('pending', 'approved', 'processed', 'rejected'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_cancellations_order_id ON order_cancellations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_cancellations_user_id ON order_cancellations(user_id);
CREATE INDEX IF NOT EXISTS idx_order_cancellations_status ON order_cancellations(refund_status);
CREATE INDEX IF NOT EXISTS idx_order_cancellations_created_at ON order_cancellations(created_at DESC);

-- Create trigger for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_order_cancellations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_cancellations_updated_at_trigger
BEFORE UPDATE ON order_cancellations
FOR EACH ROW
EXECUTE FUNCTION update_order_cancellations_updated_at();

-- Create refunds table for damage claims
CREATE TABLE IF NOT EXISTS order_refunds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cancellation_id UUID REFERENCES order_cancellations(id) ON DELETE SET NULL,
  refund_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  refund_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  stripe_refund_id VARCHAR(255),
  processed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_refund_type CHECK (refund_type IN ('full_cancellation', 'damage_claim', 'partial')),
  CONSTRAINT valid_status CHECK (refund_status IN ('pending', 'approved', 'processed', 'rejected', 'failed')),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_refunds_order_id ON order_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_order_refunds_user_id ON order_refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_order_refunds_status ON order_refunds(refund_status);
CREATE INDEX IF NOT EXISTS idx_order_refunds_created_at ON order_refunds(created_at DESC);

-- Create trigger for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_order_refunds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_refunds_updated_at_trigger
BEFORE UPDATE ON order_refunds
FOR EACH ROW
EXECUTE FUNCTION update_order_refunds_updated_at();

-- ============================================================
-- VERIFICATION COMMANDS
-- ============================================================

-- Check tables exist
-- SELECT COUNT(*) FROM order_cancellations;
-- SELECT COUNT(*) FROM order_refunds;

-- Check indexes
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename IN ('order_cancellations', 'order_refunds')
-- ORDER BY indexname;
a