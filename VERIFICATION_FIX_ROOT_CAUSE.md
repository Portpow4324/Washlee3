# ROOT CAUSE FOUND: RLS Blocking Verification Code Storage

## The Problem
Your verification codes are failing because the API cannot write to the `verification_codes` and `email_confirmations` tables. This is due to **Row Level Security (RLS) being enabled on these tables without any policies defined**.

When RLS is enabled on a table with no policies:
- INSERT operations fail silently
- SELECT operations return empty results
- Even admin clients cannot access the table

## Why This Happened
The schema file (COMPREHENSIVE_SCHEMA_COMPLETE.sql) had:
```sql
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_confirmations ENABLE ROW LEVEL SECURITY;
-- But NO CREATE POLICY statements for these tables!
```

## The Logs Show This
When you tried to verify with code "S1SY8K":
```
[VerifyCode] Code mismatch: {}  ← Empty object = no code record found in DB
```

But the code WAS being generated (logs show "Generated verification code: S1SY8K").
It just wasn't being stored because the INSERT was blocked by RLS.

## The Fix
You must run this SQL in your Supabase SQL Editor:

```sql
-- Disable RLS on verification_codes (internal system table)
ALTER TABLE public.verification_codes DISABLE ROW LEVEL SECURITY;

-- Disable RLS on email_confirmations (internal system table)  
ALTER TABLE public.email_confirmations DISABLE ROW LEVEL SECURITY;
```

## Why Disable RLS?
These tables are internal system tables managed entirely by the API server. They're not user-facing data, so RLS is unnecessary and blocks the API's ability to function.

If you prefer to keep RLS enabled, you'd need to add policies like:
```sql
CREATE POLICY allow_api_access ON public.verification_codes
  FOR ALL USING (true);  -- Dangerous: allows all access
```

But disabling RLS is the correct approach for internal system tables.

## Steps to Apply the Fix

### Option 1: Quick Fix (Recommended for Now)
1. Go to https://app.supabase.com → Your Project → SQL Editor
2. Create a new query
3. Copy and paste the contents of `DISABLE_RLS_FIX.sql`
4. Click "Run"
5. Test signup/verify flow again

### Option 2: Use Your Schema File
1. Run the full `COMPREHENSIVE_SCHEMA_COMPLETE.sql` to recreate everything with the fix

## Expected Result After Fix
- Signup generates code "ABC123"
- Code is stored in verification_codes table ✓
- Code is sent via email ✓
- User enters code and verification succeeds ✓
- Code is marked as used and email is confirmed ✓

## Testing the Fix
1. Go to http://localhost:3000/auth/signup-customer
2. Fill in signup form with test email
3. You should receive the verification code
4. Enter the code and it should verify successfully
5. Check the server logs - you should see:
   ```
   [SIGNUP] ✓ Verification code stored successfully
   [VerifyCode] Code matches record - marking as used...
   [VerifyCode] ✓ Verification complete for: test@example.com
   ```

## Files Updated
- COMPREHENSIVE_SCHEMA_COMPLETE.sql - Schema comments updated to reflect RLS disabled
- DISABLE_RLS_FIX.sql - Created with migration SQL
- app/api/auth/signup/route.ts - Enhanced logging to show code insert details
- app/api/auth/verify-code/route.ts - Enhanced logging to show code query results
