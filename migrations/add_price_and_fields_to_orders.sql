-- Migration: Fix orders table schema
-- Date: April 9, 2026
-- Reason: Database has user_id and total_price (not customer_id and price)
-- This migration documents the actual schema

-- No changes needed - the table already has the correct columns!
-- Schema is:
-- id, user_id, status, items, total_price, delivery_address, pickup_address,
-- scheduled_pickup_date, scheduled_delivery_date, actual_pickup_date, 
-- actual_delivery_date, pro_id, tracking_code, notes, wash_club_credits_applied,
-- tier_discount, credits_earned, tier_at_order_time, reviewed, created_at, updated_at,
-- employee_id, rating, review, earnings

-- Verify indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_pro_id ON orders(pro_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_employee_id ON orders(employee_id);

