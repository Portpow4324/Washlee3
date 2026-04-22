/**
 * SQL Migration: Create refund_requests table
 * 
 * This table tracks all refund requests from customers
 * IMPORTANT: This table may already exist - the migration will skip if it does
 * Run this in Supabase SQL Editor to create the table if needed
 */

-- Create refund_requests table (skips if exists)
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries (skips if exist)
CREATE INDEX IF NOT EXISTS idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests(created_at);

-- Enable RLS
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe, won't error if they don't)
DROP POLICY IF EXISTS "Users can view their own refund requests" ON refund_requests;
DROP POLICY IF EXISTS "System can manage refund requests" ON refund_requests;
DROP POLICY IF EXISTS "System can update refund requests" ON refund_requests;

-- RLS Policy: Users can see their own refund requests
CREATE POLICY "Users can view their own refund requests"
  ON refund_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: System can insert refund requests
CREATE POLICY "System can manage refund requests"
  ON refund_requests
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: System can update refund requests
CREATE POLICY "System can update refund requests"
  ON refund_requests
  FOR UPDATE
  USING (true);
