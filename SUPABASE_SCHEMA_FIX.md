# Pro Inquiries Table Schema Fix

## Issue
The `pro_inquiries` table is missing several columns needed for pro applications:
- `availability` - day/time availability
- `comments` - additional comments from applicant
- `id_verification` - ID verification document data
- `work_verification` - work authorization verification data
- `skills_assessment` - skills assessment details

## Solution
Run this SQL in your Supabase SQL Editor to add all missing columns:

```sql
-- Add missing columns to pro_inquiries table
ALTER TABLE public.pro_inquiries
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS comments TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS id_verification JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS work_verification JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS skills_assessment TEXT DEFAULT '';

-- Create index on availability for better query performance
CREATE INDEX IF NOT EXISTS idx_pro_inquiries_availability ON public.pro_inquiries USING gin (availability);
```

## Column Descriptions

| Column | Type | Purpose |
|--------|------|---------|
| `availability` | JSONB | Day/time availability (e.g., `{"monday": true, "tuesday": false, ...}`) |
| `comments` | TEXT | Additional comments from applicant |
| `id_verification` | JSONB | ID verification document data (fileName, fileType, base64) |
| `work_verification` | JSONB | Work authorization checks (hasWorkRight, hasValidLicense, hasTransport, hasEquipment, ageVerified) |
| `skills_assessment` | TEXT | Skills assessment or experience description |

## Expected Data Formats

### availability
```json
{
  "monday": true,
  "tuesday": true,
  "wednesday": false,
  "thursday": true,
  "friday": true,
  "saturday": false,
  "sunday": false
}
```

### work_verification
```json
{
  "hasWorkRight": true,
  "hasValidLicense": true,
  "hasTransport": true,
  "hasEquipment": true,
  "ageVerified": true
}
```

### id_verification
```json
{
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "base64": "..."
}
```

## Steps to Apply
1. Go to Supabase Dashboard
2. Click on "SQL Editor"
3. Copy and paste the SQL above
4. Click "Run"
5. Refresh the page or restart your dev server

After this, all pro application submissions should work without schema errors.

