-- Migration: Add denied_by column to orders table
-- Purpose: Track which employees have declined a job, so we can filter them out
-- This allows jobs to be offered to multiple employees and blocked for those who declined

-- Add denied_by column to orders table if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS denied_by TEXT DEFAULT '[]';

-- Column type: TEXT (stores JSON array as string)
-- Default: '[]' (empty array - no denials)
-- Example: '["employee-id-1", "employee-id-2"]'

-- Index for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_orders_denied_by ON orders USING GIN (denied_by);
