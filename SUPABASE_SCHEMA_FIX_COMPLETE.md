# Supabase Pro Inquiries Table - Complete Schema Fix

## Issue
Pro application submission fails with API 500 errors due to missing columns in `pro_inquiries` table.

## Root Cause
The `pro_inquiries` table schema doesn't match what the API expects. The API at `/app/api/inquiries/create/route.ts` tries to insert these fields:

**Required by API**:
- user_id ✅ (exists)
- first_name ❌ (missing)
- last_name ❌ (missing)
- email ✅ (exists)
- phone ✅ (exists)
- state ❌ (missing)
- id_verification ❌ (missing)
- work_verification ❌ (missing)
- skills_assessment ❌ (missing)
- availability ✅ (exists)
- comments ❌ (missing)
- status ✅ (exists)
- created_at ✅ (exists)

## Solution
Run this SQL in Supabase SQL Editor to add ALL 7 missing columns at once:

```sql
-- Add all missing columns to pro_inquiries table
ALTER TABLE public.pro_inquiries
ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS id_verification JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS work_verification JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS skills_assessment TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS comments TEXT DEFAULT '';

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';
```

## Verification
After running the migration, verify all columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pro_inquiries' 
ORDER BY column_name;
```

Expected result: **18 columns** (11 original + 7 new)

## Steps to Fix
1. Open Supabase dashboard → SQL Editor
2. Copy and paste the SQL from the Solution section above
3. Click "Run" or press Cmd+Enter
4. Wait for success message
5. Run the Verification query to confirm
6. Hard refresh browser: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows/Linux)
7. Restart dev server: `npm run dev`
8. Test pro application form submission

## Expected Outcome
- ✅ No more "Could not find column" errors
- ✅ Pro application form submits successfully
- ✅ Data persists in pro_inquiries table
- ✅ Build continues to pass
