# Pro Inquiries Schema - Complete Fix

## Problem Identified
The `pro_inquiries` table has an old `name` column (NOT NULL) that conflicts with the new API schema which uses `first_name` and `last_name` instead.

**Error**: `null value in column "name" of relation "pro_inquiries" violates not-null constraint`

## Solution
Drop the old `name` column and ensure the new schema matches the API expectations:

```sql
-- Drop the old name column that conflicts
ALTER TABLE public.pro_inquiries
DROP COLUMN IF EXISTS name CASCADE;

-- Add all missing columns if they don't exist
ALTER TABLE public.pro_inquiries
ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS id_verification JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS work_verification JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS skills_assessment TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS comments TEXT DEFAULT '';

-- Make sure these are NOT NULL where needed
ALTER TABLE public.pro_inquiries
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';
```

## Steps to Apply
1. Open Supabase dashboard → SQL Editor
2. Copy and paste the SQL above
3. Click "Run" or press Cmd+Enter
4. Wait for success message
5. Verify the fix:

```sql
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'pro_inquiries' 
ORDER BY column_name;
```

6. Hard refresh browser: **Cmd+Shift+R** (Mac)
7. Restart dev server: `npm run dev`
8. Test pro application submission

## Expected Result
- ✅ `name` column removed
- ✅ `first_name` and `last_name` columns exist (NOT NULL)
- ✅ All other required columns present
- ✅ Pro application form submits successfully
- ✅ No more NOT-NULL constraint violations
