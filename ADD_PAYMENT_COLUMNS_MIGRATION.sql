-- Add payment tracking columns to refund_requests table

-- Add columns if they don't exist
ALTER TABLE refund_requests
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_refund_requests_payment_method ON refund_requests(payment_method);
CREATE INDEX IF NOT EXISTS idx_refund_requests_transaction_id ON refund_requests(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);

-- Add comment to columns for documentation
COMMENT ON COLUMN refund_requests.payment_method IS 'Payment method used (stripe, paypal)';
COMMENT ON COLUMN refund_requests.transaction_id IS 'Transaction ID from payment provider (Stripe PI ID or PayPal Order ID)';
COMMENT ON COLUMN refund_requests.completed_at IS 'Timestamp when refund was completed';

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'refund_requests'
ORDER BY ordinal_position;
