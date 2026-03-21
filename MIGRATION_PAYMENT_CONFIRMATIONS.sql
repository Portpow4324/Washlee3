-- Create payment_confirmations table to track Stripe payments
CREATE TABLE IF NOT EXISTS public.payment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(255) NOT NULL,
  customer_id UUID NOT NULL,
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, failed, refunded
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AUD',
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_stripe_session UNIQUE (stripe_session_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_payment_confirmations_order_id ON public.payment_confirmations(order_id);
CREATE INDEX idx_payment_confirmations_customer_id ON public.payment_confirmations(customer_id);
CREATE INDEX idx_payment_confirmations_status ON public.payment_confirmations(payment_status);
CREATE INDEX idx_payment_confirmations_created_at ON public.payment_confirmations(created_at DESC);

-- Enable RLS
ALTER TABLE public.payment_confirmations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payment confirmations"
  ON public.payment_confirmations
  FOR SELECT
  USING (auth.uid() = customer_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can insert payments"
  ON public.payment_confirmations
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can update payments"
  ON public.payment_confirmations
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add payment-related columns to orders table if they don't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id);
