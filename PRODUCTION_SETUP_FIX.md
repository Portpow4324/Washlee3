# Production Setup Fix - Employee Schema & 403 Error

## Current Issues

You're running on **Render.com (production)** and hitting two issues:

### Issue 1: 403 Forbidden on `/api/verification/get-code`
```
GET https://washlee3-llqy.onrender.com/api/verification/get-code?email=... 403 (Forbidden)
```

**Root Cause:** This endpoint is disabled in production (only works in development with `NODE_ENV === 'development'`)

**Solution:** Use `/api/verification/send-code` instead (which works in both dev and production)

---

### Issue 2: PGRST204 - Missing 'applicationStep' column
```
[UserMgmt] Failed to create employee profile: 
{code: 'PGRST204', message: "Could not find the 'applicationStep' column of 'employees' in the schema cache"}
```

**Root Cause:** Your Supabase production database is missing the new columns we added

**Solution:** Run the SQL migration in your Supabase production database

---

## STEP-BY-STEP FIX

### Step 1: Fix the Production Database Schema

1. **Go to your Supabase Dashboard**
   - https://app.supabase.com
   - Select your **production project** (not local/dev)

2. **Open SQL Editor** (left sidebar)

3. **Create New Query** and paste this:

```sql
-- Add missing columns to employees table (production)
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS application_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS skills JSON,
ADD COLUMN IF NOT EXISTS transport BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS equipment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS availability JSON;

-- Add constraint (without IF NOT EXISTS - PostgreSQL limitation)
DO $$ 
BEGIN
  ALTER TABLE employees
  ADD CONSTRAINT check_application_status 
  CHECK (application_status IN ('pending', 'approved', 'rejected', 'completed'));
EXCEPTION WHEN duplicate_object THEN 
  -- Constraint already exists, ignore
  NULL;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(application_status);
CREATE INDEX IF NOT EXISTS idx_employees_step ON employees(application_step);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;
```

4. **Run the Query** (Ctrl+Enter or click Run)
   - You should see ✅ "Success"
   - The results show all columns in employees table

5. **Wait 30 seconds** for schema cache to refresh

---

### Step 2: Update Signup Code to Use Correct Email Endpoint

The `/api/verification/get-code` endpoint doesn't work in production. Instead, use the full flow:

1. **User signs up** → Creates auth user ✅
2. **Send code email** → Use `/api/verification/send-code` ✅
3. **User verifies code** → Use `/api/auth/verify-code` ✅

This is what the template shows - it should work correctly.

---

### Step 3: Test Again

1. **Clear browser cache:** `Cmd+Shift+Delete` → All time → Clear
2. **Reload your app**
3. **Try employee signup again**
4. **Check browser console** for success logs

Expected flow:
```
✅ [Signup] Creating Supabase auth...
✅ [Signup] Auth created in XXXms UID: ...
✅ [Signup] Creating employee profile...
✅ [Signup] Employee profile created
✅ [Signup] Account creation completed
```

No PGRST204 error should appear.

---

## Verification Checklist

After running the migration:

```sql
-- Run this to verify all columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees'
ORDER BY column_name;
```

You should see these columns:
- ✅ application_step (integer)
- ✅ application_status (text)
- ✅ availability (jsonb)
- ✅ email (text)
- ✅ equipment (boolean)
- ✅ first_name (text)
- ✅ id (uuid)
- ✅ id_document_url (text)
- ✅ last_name (text)
- ✅ phone (text)
- ✅ skills (jsonb)
- ✅ state (text)
- ✅ transport (boolean)

---

## Why This Happened

The employee table was created without these columns. When the signup code tries to insert them, Supabase returns PGRST204 (column not found). The migration adds them retroactively.

---

## Next Steps

1. ✅ Run the SQL migration above
2. ✅ Wait 30 seconds for cache refresh
3. ✅ Clear browser cache and reload
4. ✅ Test employee signup again
5. ✅ If still issues, check Supabase logs: https://app.supabase.com → Logs

You're almost there! The account creation is working - just need the schema fixed.
