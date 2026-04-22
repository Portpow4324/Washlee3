-- Add missing columns to pro_inquiries table
ALTER TABLE public.pro_inquiries
ADD COLUMN IF NOT EXISTS employee_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reviewed_by TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'pro_inquiries'
ORDER BY ordinal_position;
