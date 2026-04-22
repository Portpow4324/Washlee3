-- Add missing columns to pro_inquiries table
ALTER TABLE public.pro_inquiries
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS comments TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS id_verification JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS work_verification JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS skills_assessment TEXT DEFAULT '';

-- Create index on availability for better query performance
CREATE INDEX IF NOT EXISTS idx_pro_inquiries_availability ON public.pro_inquiries USING gin (availability);
