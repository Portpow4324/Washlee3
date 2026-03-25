-- Migration: Create pro_inquiries table for employee signup
-- Date: 2026-03-25
-- Purpose: Store employee Pro signup applications with complete information

CREATE TABLE IF NOT EXISTS pro_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  state TEXT NOT NULL,
  id_verification JSONB, -- {fileName, fileType, base64}
  work_verification JSONB NOT NULL, -- {hasWorkRight, hasValidLicense, hasTransport, hasEquipment, ageVerified}
  skills_assessment TEXT NOT NULL,
  availability JSONB NOT NULL, -- {monday, tuesday, ..., sunday}
  comments TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'under-review', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes separately
CREATE INDEX idx_pro_inquiries_status ON pro_inquiries(status);
CREATE INDEX idx_pro_inquiries_email ON pro_inquiries(email);
CREATE INDEX idx_pro_inquiries_created_at ON pro_inquiries(created_at DESC);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE pro_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all inquiries
CREATE POLICY "Admins can view all inquiries" ON pro_inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE role = 'admin'
    )
  );

-- Policy: Users can only view their own inquiry
CREATE POLICY "Users can view their own inquiry" ON pro_inquiries
  FOR SELECT USING (
    user_id = auth.uid()::text
  );

-- Add some helpful comments
COMMENT ON TABLE pro_inquiries IS 'Stores employee Pro signup applications with all verification data';
COMMENT ON COLUMN pro_inquiries.id_verification IS 'Stores ID document details: {fileName, fileType, base64}';
COMMENT ON COLUMN pro_inquiries.work_verification IS 'Stores work eligibility answers: {hasWorkRight, hasValidLicense, hasTransport, hasEquipment, ageVerified}';
COMMENT ON COLUMN pro_inquiries.availability IS 'Stores availability booleans: {monday, tuesday, wednesday, thursday, friday, saturday, sunday}';
