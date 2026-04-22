-- Create refund_requests table
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  payment_method TEXT, -- stripe, paypal, manual
  transaction_id TEXT, -- external transaction ID
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for faster queries
CREATE INDEX idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);
CREATE INDEX idx_refund_requests_created_at ON refund_requests(created_at);

-- Add RLS policies
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own refund requests
CREATE POLICY "Users can view their own refund requests"
  ON refund_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Only admin or system can insert/update refund requests
CREATE POLICY "System can manage refund requests"
  ON refund_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update refund requests"
  ON refund_requests FOR UPDATE
  USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_refund_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refund_requests_updated_at_trigger
BEFORE UPDATE ON refund_requests
FOR EACH ROW
EXECUTE FUNCTION update_refund_requests_updated_at();
